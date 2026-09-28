import {
  router,
  json,
  error,
  db,
  requireAuth,
  requireAdminEmailAllowlist,
  withScopes,
} from '@appdeploy/sdk';

const ADMIN_EMAILS = ['ruannpersonal@gmail.com'];
const TABLES: Record<string, string> = {
  students: 'students',
  modalities: 'modalities',
  lessons: 'lessons',
  payments: 'payments',
};
const protectedRoute = [
  requireAuth(),
  withScopes('email'),
  requireAdminEmailAllowlist(ADMIN_EMAILS),
];

function cleanRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) return null;
    if (
      typeof val !== 'string' &&
      typeof val !== 'number' &&
      typeof val !== 'boolean' &&
      val !== null
    )
      return null;
    if (typeof val === 'string' && val.length > 500) return null;
    clean[key] = val;
  }
  return Object.keys(clean).length ? clean : null;
}

export const handler = router({
  'GET /api/me': [
    ...protectedRoute,
    async ctx =>
      json({ user: { email: ctx.user!.email, name: ctx.user!.name } }),
  ],
  'GET /api/reports': [
    ...protectedRoute,
    async () => {
      const counts: Record<string, number> = {};
      for (const [key, table] of Object.entries(TABLES)) {
        const result = await db.list(table, { limit: 100 });
        counts[key] = result.items.length;
      }
      return json({ counts, items: [] });
    },
  ],
  'GET /api/students': [
    ...protectedRoute,
    async () => {
      const result = await db.list('students', { limit: 100 });
      return json({ items: result.items });
    },
  ],
  'GET /api/:resource': [
    ...protectedRoute,
    async ctx => {
      const table = TABLES[ctx.params.resource];
      if (!table) return error('Recurso não encontrado', 404);
      const result = await db.list(table, { limit: 100 });
      return json({ items: result.items });
    },
  ],
  'POST /api/students/import': [
    ...protectedRoute,
    async ctx => {
      const body = ctx.body as { records?: unknown };
      if (!Array.isArray(body?.records) || body.records.length === 0 || body.records.length > 100) {
        return error('Envie de 1 a 100 alunos por importação.', 400);
      }
      const records = body.records.map(cleanRecord);
      if (records.some(record => !record || typeof record.name !== 'string' || !record.name.trim())) {
        return error('Cada aluno precisa ter um nome válido.', 400);
      }
      const { items: existing } = await db.list<Record<string, unknown>>('students', { limit: 100 });
      const key = (record: Record<string, unknown>) => {
        const phone = String(record.phone ?? '').replace(/\D/g, '');
        return phone ? 'phone:' + phone : 'name:' + String(record.name ?? '').trim().toLocaleLowerCase('pt-BR');
      };
      const known = new Set(existing.map(key));
      const fresh = records.filter((record): record is Record<string, unknown> => {
        if (!record) return false;
        const recordKey = key(record);
        if (known.has(recordKey)) return false;
        known.add(recordKey);
        return true;
      });
      if (!fresh.length) return json({ imported: 0, skipped: records.length });
      const ids = await db.add('students', fresh);
      const imported = ids.filter((id): id is string => Boolean(id)).length;
      return json({ imported, skipped: records.length - imported });
    },
  ],
  'POST /api/payments/generate-monthly': [
    ...protectedRoute,
    async ctx => {
      const body = ctx.body as { month?: unknown };
      const month = typeof body?.month === 'string' ? body.month : '';
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return error('Informe o mês no formato AAAA-MM.', 400);
      }
      const [yearText, monthText] = month.split('-');
      const year = Number(yearText);
      const monthNumber = Number(monthText);
      const lastDay = new Date(year, monthNumber, 0).getDate();
      const [{ items: students }, { items: payments }] = await Promise.all([
        db.list<Record<string, unknown>>('students', { limit: 100 }),
        db.list<Record<string, unknown>>('payments', { limit: 100 }),
      ]);
      const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
      const alreadyBilled = new Set(payments.filter(payment => String(payment.dueDate ?? '').slice(0, 7) === month).map(payment => normalize(payment.student)));
      const eligible = students.filter(student => !/^(inativo|inactive|false|0)$/i.test(String(student.status ?? 'Ativo').trim()));
      const records: Record<string, unknown>[] = [];
      let skipped = 0;
      for (const student of eligible) {
        const name = String(student.name ?? '').trim();
        const amount = Number(String(student.monthlyFee ?? '0').replace(',', '.'));
        if (!name || !Number.isFinite(amount) || amount <= 0 || alreadyBilled.has(normalize(name))) {
          skipped++;
          continue;
        }
        const day = Math.min(lastDay, Math.max(1, Math.floor(Number(student.dueDay) || 10)));
        records.push({
          student: name,
          studentId: student.id,
          amount: String(amount),
          dueDate: month + '-' + String(day).padStart(2, '0'),
          paidDate: '',
          status: 'Pendente',
          generatedMonth: month,
        });
        alreadyBilled.add(normalize(name));
      }
      if (!records.length) return json({ created: 0, skipped, month, message: 'Nenhuma mensalidade nova para gerar.' });
      const ids = await db.add('payments', records);
      const created = ids.filter((id): id is string => Boolean(id)).length;
      return json({ created, skipped: skipped + records.length - created, month, message: 'Geração concluída.' });
    },
  ],
  'POST /api/:resource': [
    ...protectedRoute,
    async ctx => {
      const table = TABLES[ctx.params.resource];
      if (!table) return error('Recurso não encontrado', 404);
      const record = cleanRecord(ctx.body);
      if (!record) return error('Dados inválidos', 400);
      const [id] = await db.add(table, [record]);
      if (!id) return error('Não foi possível salvar o registro', 500);
      return json({ id, ...record }, 201);
    },
  ],
  'PUT /api/:resource/:id': [
    ...protectedRoute,
    async ctx => {
      const table = TABLES[ctx.params.resource];
      if (!table) return error('Recurso não encontrado', 404);
      const incoming = cleanRecord(ctx.body);
      if (!incoming) return error('Dados inválidos', 400);
      const [existing] = await db.get<Record<string, unknown>>(table, [ctx.params.id]);
      if (!existing) return error('Registro não encontrado', 404);
      const [updated] = await db.update(table, [{ id: ctx.params.id, record: { ...existing, ...incoming } }]);
      if (!updated) return error('Não foi possível atualizar o registro', 500);
      return json({ id: ctx.params.id, ...existing, ...incoming });
    },
  ],
  'DELETE /api/:resource/:id': [
    ...protectedRoute,
    async ctx => {
      const table = TABLES[ctx.params.resource];
      if (!table) return error('Recurso não encontrado', 404);
      if (ctx.params.resource === 'students') {
        // Student records are historical anchors for lessons and payments.
        // Archive instead of deleting so linked history is never destroyed.
        const [existing] = await db.get<Record<string, unknown>>(table, [ctx.params.id]);
        if (!existing) return error('Registro não encontrado', 404);
        const [updated] = await db.update(table, [{
          id: ctx.params.id,
          record: { ...existing, status: 'Inativo', active: false },
        }]);
        if (!updated) return error('Não foi possível inativar o aluno', 500);
        return json({ deleted: false, archived: true, id: ctx.params.id });
      }
      const [deleted] = await db.delete(table, [ctx.params.id]);
      if (!deleted) return error('Registro não encontrado', 404);
      return json({ deleted: true });
    },
  ],
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
});
