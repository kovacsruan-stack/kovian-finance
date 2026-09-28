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


type RuntimeEnv = { process?: { env?: Record<string, string | undefined> } };
const runtimeEnv = (globalThis as typeof globalThis & RuntimeEnv).process?.env ?? {};

function isPaidPayment(payment: Record<string, unknown>): boolean {
  return /^(pago|paid)$/i.test(String(payment.status ?? '').trim());
}

function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function stablePaymentEventId(paymentId: string): Promise<string> {
  if (validUuid(paymentId)) return paymentId;
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const namespaceBytes = Uint8Array.from(
    namespace.replace(/-/g, '').match(/.{2}/g)!.map(byte => Number.parseInt(byte, 16)),
  );
  const nameBytes = new TextEncoder().encode(paymentId);
  const input = new Uint8Array(namespaceBytes.length + nameBytes.length);
  input.set(namespaceBytes);
  input.set(nameBytes, namespaceBytes.length);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', input));
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = Array.from(digest.slice(0, 16), byte => byte.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
}

function validateLessonSchedule(record: Record<string, unknown>): string | null {
  const date = String(record.date ?? '').trim();
  const time = String(record.time ?? '').trim();
  if (!String(record.student ?? '').trim()) return 'Selecione o aluno.';
  if (!String(record.modality ?? '').trim()) return 'Selecione a modalidade.';
  const parsedDate = new Date(date + 'T12:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return 'Informe uma data válida para a aula.';
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return 'Informe um horário válido.';
  const duration = Number(record.durationMinutes ?? 60);
  if (!Number.isInteger(duration) || duration < 15 || duration > 240) return 'A duração deve estar entre 15 e 240 minutos.';
  const capacity = Number(record.capacity ?? 1);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) return 'A capacidade deve estar entre 1 e 200 vagas.';
  const interval = Number(record.recurrenceIntervalWeeks ?? 1);
  if (!Number.isInteger(interval) || interval < 1 || interval > 52) return 'A recorrência deve ser de 1 a 52 semanas.';
  const repeatUntil = String(record.repeatUntil ?? '').trim();
  if (repeatUntil) {
    const parsedRepeatUntil = new Date(repeatUntil + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(repeatUntil) || Number.isNaN(parsedRepeatUntil.getTime()) || parsedRepeatUntil.toISOString().slice(0, 10) !== repeatUntil || repeatUntil < date) {
      return 'A data final da recorrência deve ser uma data válida, igual ou posterior à primeira aula.';
    }
  }
  const days = String(record.daysOfWeek ?? '').trim();
  if (days.length > 100) return 'A configuração dos dias da semana é muito longa.';
  const selectedDays = parseScheduleDays(days, date);
  if (!selectedDays) return 'Use dias válidos: SEG, TER, QUA, QUI, SEX, SAB e/ou DOM.';
  if (!selectedDays.includes(parsedDate.getUTCDay())) return 'A data da primeira aula precisa corresponder a um dos dias selecionados.';
  return null;
}

async function persistPayment(
  id: string,
  record: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const [updated] = await db.update('payments', [{ id, record }]);
  if (!updated) throw new Error('Não foi possível atualizar o estado da integração.');
  return record;
}

async function syncPaymentWithFinance(
  paymentId: string,
): Promise<{ status: string; transactionId?: string; message: string }> {
  const [payment] = await db.get<Record<string, unknown>>('payments', [paymentId]);
  if (!payment) throw new Error('Pagamento não encontrado.');
  if (!isPaidPayment(payment)) throw new Error('Somente pagamentos com status Pago podem ser enviados ao Finance.');

  const financeUrl = (runtimeEnv.KOVIAN_FINANCE_API_URL ?? '').trim().replace(/\\/$/, '');
  const integrationToken = runtimeEnv.KOVIAN_FINANCE_INTEGRATION_TOKEN ?? '';
  const ownerId = runtimeEnv.KOVIAN_FINANCE_OWNER_ID ?? '';
  const accountId = runtimeEnv.KOVIAN_FINANCE_ACCOUNT_ID ?? '';
  if (!financeUrl || integrationToken.length < 32 || !validUuid(ownerId) || !accountId.trim()) {
    throw new Error('Integração não configurada no backend. Configure URL, token, proprietário e conta do Finance.');
  }
  let parsedFinanceUrl: URL;
  try {
    parsedFinanceUrl = new URL(financeUrl);
  } catch {
    throw new Error('A URL da API Finance está inválida.');
  }
  const localHttpHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsedFinanceUrl.hostname);
  if (
    (parsedFinanceUrl.protocol !== 'https:' && !(parsedFinanceUrl.protocol === 'http:' && localHttpHost)) ||
    parsedFinanceUrl.username ||
    parsedFinanceUrl.password ||
    parsedFinanceUrl.search ||
    parsedFinanceUrl.hash
  ) {
    throw new Error('A API Finance precisa usar HTTPS e uma URL sem credenciais, query ou fragmento.');
  }

  let studentRef = String(payment.financeStudentRef ?? payment.studentId ?? '').trim();
  if (!studentRef) {
    const { items: students } = await db.list<Record<string, unknown>>('students', { limit: 100 });
    const target = String(payment.student ?? '').trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const matches = students.filter(student =>
      String(student.name ?? '').trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLocaleLowerCase('pt-BR') === target
    );
    if (matches.length !== 1 || !matches[0]?.id) {
      throw new Error('Não foi possível identificar o aluno por um ID único. Vincule o pagamento ao cadastro do aluno antes de sincronizar.');
    }
    studentRef = String(matches[0].id);
  }

  const amount = Number(String(payment.amount ?? '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(Math.round(amount * 100) / 100 - amount) > 1e-8) {
    throw new Error('O valor do pagamento é inválido para lançamento financeiro.');
  }
  const paidDate = String(payment.paidDate ?? '').trim();
  const parsedPaidDate = new Date(paidDate + 'T12:00:00Z');
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(paidDate) || Number.isNaN(parsedPaidDate.getTime()) || parsedPaidDate.toISOString().slice(0, 10) !== paidDate) {
    throw new Error('Informe uma data de pagamento válida antes de sincronizar.');
  }

  const paidAt = new Date(paidDate + 'T12:00:00Z').toISOString();
  const eventId = typeof payment.financeEventId === 'string' && validUuid(payment.financeEventId)
    ? payment.financeEventId
    : await stablePaymentEventId(paymentId);
  const occurredAt = typeof payment.financeOccurredAt === 'string' && !Number.isNaN(Date.parse(payment.financeOccurredAt))
    ? new Date(payment.financeOccurredAt).toISOString()
    : paidAt;
  const event = {
    id: eventId,
    type: 'MANAGEMENT_PAYMENT_PAID.v1',
    version: 1,
    ownerId,
    occurredAt,
    correlationId: eventId,
    payload: {
      paymentRef: paymentId,
      studentRef,
      amountMinor: Math.round(amount * 100),
      currency: 'BRL',
      paidAt,
      description: 'Mensalidade KOVIAN Gestão',
    },
  };

  await persistPayment(paymentId, {
    ...payment,
    financeEventId: eventId,
    financeStudentRef: studentRef,
    financeOccurredAt: occurredAt,
    financeSyncStatus: 'pending',
    financeSyncError: '',
  });

  try {
    const response = await fetch(
      financeUrl + '/api/v1/integrations/gestao/payments?account_id=' + encodeURIComponent(accountId),
      {
        method: 'POST',
        signal: AbortSignal.timeout(12000),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + integrationToken,
        },
        body: JSON.stringify(event),
      },
    );
    const responseText = await response.text();
    let result: Record<string, unknown> = {};
    try {
      const parsed: unknown = JSON.parse(responseText);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) result = parsed as Record<string, unknown>;
    } catch {
      // Do not expose raw upstream response text, which may contain implementation details.
    }
    if (!response.ok) {
      const detail = typeof result.detail === 'string' ? result.detail : 'Finance recusou a importação (HTTP ' + response.status + ').';
      await persistPayment(paymentId, {
        ...payment,
        financeEventId: eventId,
        financeStudentRef: studentRef,
        financeOccurredAt: occurredAt,
        financeSyncStatus: 'pending',
        financeSyncError: detail.slice(0, 300),
      });
      return { status: 'pending', message: detail };
    }

    const transaction = result.transaction && typeof result.transaction === 'object'
      ? result.transaction as Record<string, unknown>
      : {};
    const transactionId = typeof transaction.id === 'string' ? transaction.id.trim() : '';
    if (!transactionId) {
      throw new Error('Finance retornou uma resposta sem o identificador da transação.');
    }
    await persistPayment(paymentId, {
      ...payment,
      financeEventId: eventId,
      financeStudentRef: studentRef,
      financeOccurredAt: occurredAt,
      financeSyncStatus: 'synced',
      financeTransactionId: transactionId,
      financeSyncedAt: new Date().toISOString(),
      financeSyncError: '',
    });
    return { status: 'synced', transactionId, message: result.duplicate === true ? 'Pagamento já estava sincronizado no Finance.' : 'Pagamento enviado ao Finance.' };
  } catch {
    await persistPayment(paymentId, {
      ...payment,
      financeEventId: eventId,
      financeStudentRef: studentRef,
      financeOccurredAt: occurredAt,
      financeSyncStatus: 'pending',
      financeSyncError: 'Falha de comunicação com o Finance. Tente sincronizar novamente.',
    });
    return { status: 'pending', message: 'Falha de comunicação com o Finance. O pagamento continua registrado no Gestão e pode ser reenviado.' };
  }
}

function parseScheduleDays(value: unknown, fallbackDate: string): number[] | null {
  const aliases: Record<string, number> = {
    MON: 1, MONDAY: 1, SEG: 1, SEGUNDA: 1,
    TUE: 2, TUESDAY: 2, TER: 2, TERCA: 2, TERÇA: 2,
    WED: 3, WEDNESDAY: 3, QUA: 3, QUARTA: 3,
    THU: 4, THURSDAY: 4, QUI: 4, QUINTA: 4,
    FRI: 5, FRIDAY: 5, SEX: 5, SEXTA: 5,
    SAT: 6, SATURDAY: 6, SAB: 6, SABADO: 6, SÁBADO: 6,
    SUN: 0, SUNDAY: 0, DOM: 0, DOMINGO: 0,
  };
  const raw = String(value ?? '').trim();
  if (!raw) {
    const day = new Date(fallbackDate + 'T12:00:00Z').getUTCDay();
    return [day];
  }
  const tokens = raw.split(/[,;|\\s]+/).filter(Boolean).map(token =>
    token.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  );
  const parsed = tokens.map(token => aliases[token]);
  if (!parsed.length || parsed.some(day => day === undefined)) return null;
  return [...new Set(parsed)];
}

function dateOnlyUtc(value: string): Date {
  return new Date(value + 'T12:00:00Z');
}

function formatDateOnlyUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
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
  'POST /api/payments/:id/sync-finance': [
    ...protectedRoute,
    async ctx => {
      try {
        const result = await syncPaymentWithFinance(ctx.params.id);
        return json(result, result.status === 'synced' ? 200 : 202);
      } catch (e) {
        return error(e instanceof Error ? e.message : 'Não foi possível sincronizar o pagamento.', 400);
      }
    },
  ],
  'POST /api/lessons/:id/generate-recurring': [
    ...protectedRoute,
    async ctx => {
      const [template] = await db.get<Record<string, unknown>>('lessons', [ctx.params.id]);
      if (!template) return error('Aula não encontrada.', 404);
      const validation = validateLessonSchedule(template);
      if (validation) return error(validation, 400);
      if (template.recurrenceGenerated === true || template.recurrenceGenerated === 'true') {
        return error('Uma aula gerada não pode ser usada como modelo de recorrência.', 400);
      }

      const startDate = String(template.date);
      const configuredEnd = String(template.repeatUntil ?? '').trim();
      const endDate = configuredEnd || (() => {
        const end = dateOnlyUtc(startDate);
        end.setUTCDate(end.getUTCDate() + 180);
        return formatDateOnlyUtc(end);
      })();
      const start = dateOnlyUtc(startDate);
      const end = dateOnlyUtc(endDate);
      if (end.getTime() - start.getTime() > 366 * 24 * 60 * 60 * 1000) {
        return error('A recorrência pode gerar aulas por no máximo 366 dias.', 400);
      }

      const days = parseScheduleDays(template.daysOfWeek, startDate);
      if (!days) return error('Dias inválidos. Use SEG, TER, QUA, QUI, SEX, SAB e/ou DOM.', 400);
      const interval = Number(template.recurrenceIntervalWeeks ?? 1);
      const capacity = Number(template.capacity ?? 1);
      const duration = Number(template.durationMinutes ?? 60);
      const [existingResult] = await Promise.all([
        db.list<Record<string, unknown>>('lessons', { limit: 100 }),
      ]);
      const existing = existingResult.items;
      const candidates: Record<string, unknown>[] = [];
      let skipped = 0;
      const startMonday = new Date(start);
      startMonday.setUTCDate(startMonday.getUTCDate() - ((startMonday.getUTCDay() + 6) % 7));

      for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
        if (cursor.getTime() === start.getTime()) continue;
        const weekday = cursor.getUTCDay();
        if (!days.includes(weekday)) continue;
        const weekStart = new Date(cursor);
        weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
        const weekIndex = Math.floor((weekStart.getTime() - startMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weekIndex < 0 || weekIndex % interval !== 0) continue;
        const date = formatDateOnlyUtc(cursor);
        const duplicate = existing.some(item =>
          String(item.student ?? '') === String(template.student ?? '') &&
          String(item.date ?? '') === date &&
          String(item.time ?? '') === String(template.time ?? '') &&
          String(item.modality ?? '') === String(template.modality ?? '') &&
          String(item.recurrenceParentId ?? '') === String(template.id)
        ) || candidates.some(item =>
          String(item.student ?? '') === String(template.student ?? '') &&
          String(item.date ?? '') === date &&
          String(item.time ?? '') === String(template.time ?? '') &&
          String(item.modality ?? '') === String(template.modality ?? '')
        );
        if (duplicate) { skipped++; continue; }

        const startMinutes = Number(String(template.time).slice(0, 2)) * 60 + Number(String(template.time).slice(3, 5));
        const endMinutes = startMinutes + duration;
        const sameStudentConflict = existing.some(item => {
          if (String(item.date ?? '') !== date || String(item.status ?? 'Agendada') === 'Cancelada') return false;
          if (String(item.student ?? '') !== String(template.student ?? '')) return false;
          const time = String(item.time ?? '');
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
          const otherStart = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
          const otherEnd = otherStart + Math.max(15, Number(item.durationMinutes ?? 60));
          return startMinutes < otherEnd && otherStart < endMinutes;
        });
        const sameClass = (item: Record<string, unknown>) =>
          String(item.date ?? '') === date &&
          String(item.time ?? '') === String(template.time ?? '') &&
          String(item.modality ?? '') === String(template.modality ?? '') &&
          String(item.trainer ?? '') === String(template.trainer ?? '') &&
          String(item.location ?? '') === String(template.location ?? '') &&
          String(item.status ?? 'Agendada') !== 'Cancelada';
        const classCount = existing.filter(sameClass).length + candidates.filter(sameClass).length;
        const resourceConflict = existing.some(item => {
          if (String(item.date ?? '') !== date || String(item.status ?? 'Agendada') === 'Cancelada') return false;
          const sameTrainer = Boolean(String(template.trainer ?? '').trim()) && String(item.trainer ?? '') === String(template.trainer ?? '');
          const sameRoom = Boolean(String(template.location ?? '').trim()) && String(item.location ?? '') === String(template.location ?? '');
          if (!sameTrainer && !sameRoom) return false;
          const time = String(item.time ?? '');
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
          const otherStart = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
          const otherEnd = otherStart + Math.max(15, Number(item.durationMinutes ?? 60));
          const overlaps = startMinutes < otherEnd && otherStart < endMinutes;
          return overlaps && !sameClass(item);
        });
        if (sameStudentConflict || resourceConflict || classCount >= capacity) { skipped++; continue; }
        const generated: Record<string, unknown> = {
          ...template,
          date,
          recurrenceParentId: String(template.id),
          recurrenceGenerated: true,
          status: 'Agendada',
        };
        delete generated.id;
        candidates.push(generated);
        if (candidates.length >= 100) break;
      }

      if (!candidates.length) return json({ created: 0, skipped, message: 'Nenhuma nova aula foi gerada.' });
      const batches: Record<string, unknown>[][] = [];
      for (let index = 0; index < candidates.length; index += 50) batches.push(candidates.slice(index, index + 50));
      let created = 0;
      for (const batch of batches) {
        const ids = await db.add('lessons', batch);
        created += ids.filter(Boolean).length;
      }
      return json({ created, skipped, message: 'Recorrência processada.' }, 201);
    },
  ],
  'POST /api/:resource': [
    ...protectedRoute,
    async ctx => {
      const table = TABLES[ctx.params.resource];
      if (!table) return error('Recurso não encontrado', 404);
      const record = cleanRecord(ctx.body);
      if (!record) return error('Dados inválidos', 400);
      if (ctx.params.resource === 'lessons') {
        const scheduleError = validateLessonSchedule(record);
        if (scheduleError) return error(scheduleError, 400);
        record.durationMinutes = Number(record.durationMinutes ?? 60);
        record.capacity = Number(record.capacity ?? 1);
        record.recurrenceIntervalWeeks = Number(record.recurrenceIntervalWeeks ?? 1);
      }
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
      const merged = { ...existing, ...incoming };
      if (ctx.params.resource === 'lessons') {
        const scheduleError = validateLessonSchedule(merged);
        if (scheduleError) return error(scheduleError, 400);
        merged.durationMinutes = Number(merged.durationMinutes ?? 60);
        merged.capacity = Number(merged.capacity ?? 1);
        merged.recurrenceIntervalWeeks = Number(merged.recurrenceIntervalWeeks ?? 1);
      }
      const [updated] = await db.update(table, [{ id: ctx.params.id, record: merged }]);
      if (!updated) return error('Não foi possível atualizar o registro', 500);
      return json({ id: ctx.params.id, ...merged });
    },
  ],
  'DELETE /api/:resource/:id': [
    ...protectedRoute,
    async ctx => {
      const table = TABLES[ctx.params.resource];
      if (!table) return error('Recurso não encontrado', 404);
      const [deleted] = await db.delete(table, [ctx.params.id]);
      if (!deleted) return error('Registro não encontrado', 404);
      return json({ deleted: true });
    },
  ],
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
});
