import { useEffect, useMemo, useState } from 'react';
import { auth, api } from '@appdeploy/client';
import {
  Users,
  Layers,
  CalendarDays,
  CreditCard,
  BarChart3,
  LogOut,
  Plus,
  Search,
  RefreshCw,
  Upload,
  Download,
  Pencil,
  Check,
  UserCheck,
  Wallet,
  Clock3,
  AlertCircle,
} from 'lucide-react';

type RecordItem = { id: string; [key: string]: unknown };
const sections = [
  {
    id: 'students',
    label: 'Alunos',
    icon: Users,
    fields: [
      ['name', 'Nome'],
      ['phone', 'Telefone'],
      ['modality', 'Modalidade'],
      ['frequency', 'Frequência semanal'],
      ['monthlyFee', 'Mensalidade (R$)'],
      ['dueDay', 'Dia de vencimento'],
      ['startDate', 'Data de início'],
      ['status', 'Status'],
      ['notes', 'Observações'],
    ],
  },
  {
    id: 'modalities',
    label: 'Modalidades',
    icon: Layers,
    fields: [
      ['name', 'Nome'],
      ['description', 'Descrição'],
      ['price', 'Mensalidade (R$)'],
      ['frequency', 'Frequência semanal'],
    ],
  },
  {
    id: 'lessons',
    label: 'Aulas',
    icon: CalendarDays,
    fields: [
      ['student', 'Aluno'],
      ['modality', 'Modalidade'],
      ['date', 'Data'],
      ['time', 'Horário'],
      ['durationMinutes', 'Duração (minutos)'],
      ['trainer', 'Profissional responsável'],
      ['location', 'Local / sala'],
      ['capacity', 'Vagas'],
      ['daysOfWeek', 'Dias da semana (ex.: SEG, QUA, SEX)'],
      ['recurrenceIntervalWeeks', 'Repetir a cada (semanas)'],
      ['repeatUntil', 'Repetir até'],
      ['status', 'Status'],
    ],
  },
  {
    id: 'payments',
    label: 'Pagamentos',
    icon: CreditCard,
    fields: [
      ['student', 'Aluno'],
      ['amount', 'Valor (R$)'],
      ['dueDate', 'Vencimento'],
      ['paidDate', 'Data do pagamento'],
      ['status', 'Status'],
    ],
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: BarChart3,
    fields: [] as readonly (readonly [string, string])[],
  },
] as const;

function App() {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null
  );
  const [section, setSection] = useState('students');
  const [items, setItems] = useState<RecordItem[]>([]);
  const [referenceStudents, setReferenceStudents] = useState<RecordItem[]>([]);
  const [referenceModalities, setReferenceModalities] = useState<RecordItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncingPaymentId, setSyncingPaymentId] = useState<string | null>(null);
  const [generatingLessonId, setGeneratingLessonId] = useState<string | null>(null);
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dashboard, setDashboard] = useState({ activeStudents: 0, inactiveStudents: 0, monthlyProjection: 0, overduePayments: 0, paymentsThisMonth: 0 });

  const current = sections.find(s => s.id === section)!;
  const load = async (target = section) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/api/' + target);
      setItems(result.data.items || []);
      if (target !== 'reports')
        setCounts(prev => ({
          ...prev,
          [target]: (result.data.items || []).length,
        }));
      if (target === 'reports') setCounts(result.data.counts || {});
    } catch (e) {
      setError(
        'Não foi possível carregar os dados. Confira seu acesso e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    auth
      .getUser()
      .then(async u => {
        if (!active) return;
        if (u) {
          try {
            const result = await api.get('/api/me');
            if (active) {
              setUser(result.data.user);
              await load('students');
            }
          } catch {
            if (active) {
              await auth.signOut();
              setUser(null);
              setError(
                'Esta conta não tem autorização para acessar o KOVIAN Gestão.'
              );
            }
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) void load(section);
  }, [section, user]);

  const refreshReferenceData = async () => {
    const [studentsResult, modalitiesResult] = await Promise.all([
      api.get('/api/students'),
      api.get('/api/modalities'),
    ]);
    setReferenceStudents((studentsResult.data.items || []) as RecordItem[]);
    setReferenceModalities((modalitiesResult.data.items || []) as RecordItem[]);
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([api.get('/api/students'), api.get('/api/modalities')])
      .then(([studentsResult, modalitiesResult]) => {
        if (!active) return;
        setReferenceStudents((studentsResult.data.items || []) as RecordItem[]);
        setReferenceModalities((modalitiesResult.data.items || []) as RecordItem[]);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar a lista de alunos e modalidades. Atualize a tela e tente novamente.');
      });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user || section !== 'reports') return;
    let active = true;
    Promise.all([api.get('/api/students'), api.get('/api/payments')])
      .then(([studentsResult, paymentsResult]) => {
        if (!active) return;
        const students = (studentsResult.data.items || []) as RecordItem[];
        const payments = (paymentsResult.data.items || []) as RecordItem[];
        const isActive = (student: RecordItem) => !/^(inativo|inactive|false|0)$/i.test(String(student.status ?? 'Ativo').trim());
        const activeStudents = students.filter(isActive);
        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();
        const paymentsThisMonth = payments.filter(payment => {
          const raw = String(payment.paidDate || '');
          const date = new Date(raw.length === 10 ? raw + 'T12:00:00' : raw);
          return Boolean(raw) && !Number.isNaN(date.getTime()) && date.getMonth() === month && date.getFullYear() === year;
        });
        const todayKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
        const overduePayments = payments.filter(payment => {
          const status = String(payment.status || '').toLowerCase();
          const due = String(payment.dueDate || '');
          const isUnpaid = /pendente|atrasad|aberto|unpaid|pending|vencid|parcial/i.test(status);
          return isUnpaid && /^\d{4}-\d{2}-\d{2}/.test(due) && due.slice(0, 10) < todayKey;
        }).length;
        setDashboard({
          activeStudents: activeStudents.length,
          inactiveStudents: students.length - activeStudents.length,
          monthlyProjection: activeStudents.reduce((sum, student) => sum + (Number(String(student.monthlyFee ?? '0').replace(',', '.')) || 0), 0),
          overduePayments,
          paymentsThisMonth: paymentsThisMonth.length,
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [section, user]);

  const filtered = useMemo(
    () => items.filter(item => {
      const matchesSearch = JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
      const status = String(item.status ?? 'Ativo').toLowerCase();
      const isActive = !/^(inativo|inactive|false|0)$/.test(status);
      const matchesStudentStatus = section !== 'students' || studentStatusFilter === 'all' || (studentStatusFilter === 'active' ? isActive : !isActive);
      const dueDate = String(item.dueDate || '').slice(0, 10);
      const today = new Date();
      const todayKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
      const paymentStatus = status.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const overdue = /pendente|atrasad|aberto|unpaid|pending|parcial/.test(paymentStatus) && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && dueDate < todayKey;
      const matchesPaymentStatus = section !== 'payments' || paymentStatusFilter === 'all' || (paymentStatusFilter === 'overdue' ? overdue || /atrasad|vencid/.test(paymentStatus) : paymentStatus.includes(paymentStatusFilter));
      return matchesSearch && matchesStudentStatus && matchesPaymentStatus;
    }),
    [items, search, section, studentStatusFilter, paymentStatusFilter]
  );

  const signIn = async () => {
    setError('');
    try {
      const result = await auth.signIn({
        scope: 'openid email profile offline_access',
      });
      const check = await api.get('/api/me');
      setUser(check.data.user || result.user);
      await load('students');
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setError(
        code === 'popup_blocked'
          ? 'Permita a abertura de pop-ups para entrar com Google.'
          : 'Login cancelado ou não autorizado. Use a conta Google administradora.'
      );
    }
  };

  const save = async () => {
    const requiredKeys: Record<string, string[]> = {
      students: ['name', 'modality'],
      modalities: ['name'],
      lessons: ['student', 'modality', 'date'],
      payments: ['student', 'amount', 'dueDate', 'status'],
    };
    const requiredFields = current.fields.filter(([key]) => (requiredKeys[section] || []).includes(key));
    const missing = requiredFields.find(([key]) => !form[key]?.trim());
    if (missing) {
      setError('Preencha o campo ' + missing[1] + '.');
      return;
    }
    try {
      if (editing) {
        await api.put('/api/' + section + '/' + editing.id, form);
      } else {
        await api.post('/api/' + section, form);
      }
      setForm({});
      setAdding(false);
      setEditing(null);
      await load(section);
      if (section === 'students' || section === 'modalities') {
        await refreshReferenceData();
      }
    } catch {
      setError(
        'Não foi possível salvar. Verifique os dados e tente novamente.'
      );
    }
  };

  const syncPaymentWithFinance = async (item: RecordItem) => {
    if (syncingPaymentId) return;
    setSyncingPaymentId(item.id);
    setError('');
    try {
      const result = await api.post('/api/payments/' + encodeURIComponent(item.id) + '/sync-finance', {});
      await load('payments');
      setError(String(result.data.message || (result.data.status === 'synced' ? 'Pagamento sincronizado com o Finance.' : 'Sincronização pendente.')));
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setError(message && !/internal|stack|token|secret/i.test(message)
        ? message
        : 'Não foi possível sincronizar. Confira a configuração da integração e tente novamente.');
      await load('payments');
    } finally {
      setSyncingPaymentId(null);
    }
  };

  const generateRecurringLessons = async (item: RecordItem) => {
    if (generatingLessonId) return;
    const interval = Math.max(1, Number(item.recurrenceIntervalWeeks) || 1);
    const end = String(item.repeatUntil || '');
    const range = end ? ' até ' + end : ' pelos próximos 180 dias';
    if (!window.confirm('Gerar aulas recorrentes a cada ' + interval + ' semana(s)' + range + '? Aulas já existentes e conflitos de horário serão ignorados.')) return;
    setGeneratingLessonId(item.id);
    setError('');
    try {
      const result = await api.post('/api/lessons/' + encodeURIComponent(item.id) + '/generate-recurring', {});
      await load('lessons');
      setError('Recorrência concluída: ' + Number(result.data.created || 0) + ' aula(s) criada(s), ' + Number(result.data.skipped || 0) + ' ignorada(s).');
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setError(message && !/internal|stack|token|secret/i.test(message)
        ? message
        : 'Não foi possível gerar as aulas recorrentes. Confira a configuração e tente novamente.');
    } finally {
      setGeneratingLessonId(null);
    }
  };

  const startEditing = (item: RecordItem) => {
    setEditing(item);
    setAdding(true);
    setError('');
    setForm(Object.fromEntries(current.fields.map(([key]) => [key, String(item[key] ?? '')])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportCsv = () => {
    const fields = current.fields as readonly (readonly [string, string])[];
    if (!filtered.length || !fields.length) {
      setError('Não há registros para exportar.');
      return;
    }
    const escapeCell = (value: unknown) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const rows = [fields.map(([, label]) => escapeCell(label)).join(';'), ...filtered.map(item => fields.map(([key]) => escapeCell(item[key])).join(';'))];
    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kovian-' + section + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const generateMonthlyPayments = async () => {
    const now = new Date();
    const month = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0')].join('-');
    if (!window.confirm('Gerar mensalidades pendentes para os alunos ativos de ' + month + '? Registros já existentes para o mês serão ignorados.')) return;
    setError('');
    setLoading(true);
    try {
      const result = await api.post('/api/payments/generate-monthly', { month });
      await load('payments');
      setError('Mensalidades de ' + month + ': ' + Number(result.data.created || 0) + ' criada(s), ' + Number(result.data.skipped || 0) + ' ignorada(s).');
    } catch {
      setError('Não foi possível gerar as mensalidades. Confira a conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const startStudentPayment = (student: RecordItem) => {
    const now = new Date();
    const dueDay = Math.min(28, Math.max(1, Number(student.dueDay) || 10));
    const due = new Date(now.getFullYear(), now.getMonth(), dueDay);
    const dateValue = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    setSection('payments');
    setAdding(true);
    setEditing(null);
    setSearch('');
    setError('');
    setForm({ student: String(student.name || ''), amount: String(student.monthlyFee || ''), dueDate: dateValue(due), paidDate: '', status: 'Pendente' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const importStudents = async (file?: File) => {
    if (!file) return;
    setError('');
    setImporting(true);
    try {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/, 1)[0] || '';
      const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
      const parseLine = (line: string) => {
        const cells: string[] = [];
        let value = '';
        let quoted = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
          else if (char === '"') quoted = !quoted;
          else if (char === delimiter && !quoted) { cells.push(value.trim()); value = ''; }
          else value += char;
        }
        cells.push(value.trim());
        return cells;
      };
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
      const firstNonEmpty = lines.findIndex(line => line.trim());
      if (firstNonEmpty < 0) throw new Error('O CSV não contém alunos.');
      const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const firstCells = parseLine(lines[firstNonEmpty]).map(normalize);
      const isAppExport = firstCells[0] === 'table' && firstCells[1] === 'students';
      const headerIndex = isAppExport ? firstNonEmpty + 1 : firstNonEmpty;
      if (!lines[headerIndex]?.trim()) throw new Error('Não encontrei o cabeçalho dos alunos no CSV.');
      const headers = parseLine(lines[headerIndex]).map(normalize);
      const find = (row: string[], names: string[]) => {
        const index = headers.findIndex(header => names.includes(header));
        return index >= 0 ? (row[index] || '').trim() : '';
      };
      let dataLines = lines.slice(headerIndex + 1);
      if (isAppExport) {
        const nextSection = dataLines.findIndex(line => !line.trim());
        if (nextSection >= 0) dataLines = dataLines.slice(0, nextSection);
      } else {
        dataLines = dataLines.filter(line => line.trim());
      }
      const records = dataLines.map(line => {
        const row = parseLine(line);
        const cents = find(row, ['feecents', 'mensalidadecentavos', 'valorcentavos']);
        const fee = find(row, ['monthlyfee', 'mensalidade', 'valor', 'fee']);
        const rawFee = cents ? String(Number(cents.replace(/[^0-9-]/g, '')) / 100) : fee.replace(/R\$\s?/gi, '').replace(/\./g, '').replace(',', '.');
        const active = find(row, ['active', 'ativo', 'status']);
        return {
          name: find(row, ['name', 'nome', 'aluno']),
          phone: find(row, ['phone', 'telefone', 'celular', 'whatsapp']),
          modality: find(row, ['modality', 'modalidade']),
          frequency: find(row, ['frequency', 'frequencia', 'frequenciasemanal']),
          monthlyFee: rawFee && Number.isFinite(Number(rawFee)) ? String(Number(rawFee)) : '',
          dueDay: find(row, ['dueday', 'diavencimento', 'diadevencimento']),
          startDate: find(row, ['startdate', 'datainicio', 'inicio']),
          status: /^(0|false|inativo|inact|inactive)$/i.test(active) ? 'Inativo' : (/^(1|true|ativo|active)$/i.test(active) || !active ? 'Ativo' : active),
          notes: find(row, ['notes', 'observacoes', 'obs']),
        };
      }).filter(record => record.name);
      if (!records.length) throw new Error('Nenhum aluno com nome válido foi encontrado.');
      const result = await api.post('/api/students/import', { records });
      setSection('students');
      setSearch('');
      await Promise.all([load('students'), refreshReferenceData()]);
      const imported = Number(result.data.imported || 0);
      const skipped = Number(result.data.skipped || 0);
      setError('Importação concluída: ' + imported + ' aluno(s) incluído(s)' + (skipped ? ', ' + skipped + ' duplicado(s) ignorado(s).' : '.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível importar o arquivo CSV.');
    } finally {
      setImporting(false);
    }
  };

  const remove = async (id: string) => {
    if (
      !window.confirm('Excluir este registro? Esta ação não pode ser desfeita.')
    )
      return;
    try {
      await api.delete('/api/' + section + '/' + id);
      await load(section);
    } catch {
      setError('Não foi possível excluir o registro.');
    }
  };

  if (!user)
    return (
      <main className="login-shell">
        <div className="login-card">
          <div className="brand-mark">K</div>
          <p className="eyebrow">GESTÃO INTELIGENTE</p>
          <h1>
            KOVIAN <span>Gestão</span>
          </h1>
          <p className="muted">Seu estúdio organizado em um só lugar.</p>
          <button className="primary google" onClick={signIn}>
            <span className="google-g">G</span> Entrar com Google
          </button>
          <p className="fine">
            Acesso exclusivo à conta administradora autorizada.
          </p>
          {error && <p className="error">{error}</p>}
        </div>
      </main>
    );

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark small">K</div>
          <div className="brand-title">
            <b>KOVIAN</b>
            <small>GESTÃO</small>
          </div>
          <div className="mobile-account" aria-label="Usuário conectado">
            <span className="mobile-user-name">{user.name || 'Administrador'}</span>
            <button
              className="mobile-logout"
              onClick={async () => {
                await auth.signOut();
                setUser(null);
                setItems([]);
              }}
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
        <nav aria-label="Menu principal">
          {sections.map(s => (
            <button
              key={s.id}
              className={section === s.id ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setSection(s.id);
                setSearch('');
                setAdding(false);
                setEditing(null);
              }}
            >
              <s.icon size={18} />
              {s.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">
              {(user.name || user.email || 'R').slice(0, 1).toUpperCase()}
            </div>
            <div className="user-text">
              <b>{user.name || 'Administrador'}</b>
            </div>
          </div>
          <button
            className="logout"
            onClick={async () => {
              await auth.signOut();
              setUser(null);
              setItems([]);
            }}
          >
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">PAINEL ADMINISTRATIVO</p>
            <h1>{current.label}</h1>
          </div>
          <button
            className="icon-button"
            onClick={() => void load()}
            aria-label="Atualizar"
          >
            <RefreshCw size={18} />
          </button>
        </header>
        {error && (
          <div className="notice">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}
        {section === 'reports' ? (
          <>
            <div className="stats-grid dashboard-stats">
              <button className="stat-card stat-action" onClick={() => setSection('students')}>
                <span><UserCheck size={16} /> Alunos ativos</span>
                <strong>{dashboard.activeStudents}</strong>
                <small>{dashboard.inactiveStudents} inativos · tocar para abrir alunos</small>
              </button>
              <div className="stat-card">
                <span><Wallet size={16} /> Receita mensal prevista</span>
                <strong>{dashboard.monthlyProjection.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                <small>Somatório das mensalidades dos alunos ativos</small>
              </div>
              <button className="stat-card stat-action" onClick={() => setSection('payments')}>
                <span><AlertCircle size={16} /> Pagamentos em atraso</span>
                <strong>{dashboard.overduePayments}</strong>
                <small>Com status pendente e vencimento passado</small>
              </button>
              <button className="stat-card stat-action" onClick={() => setSection('payments')}>
                <span><Clock3 size={16} /> Pagamentos neste mês</span>
                <strong>{dashboard.paymentsThisMonth}</strong>
                <small>Registros com data de pagamento neste mês</small>
              </button>
            </div>
            <section className="panel dashboard-shortcuts">
              <div>
                <h2>Acesso rápido</h2>
                <p className="muted">Vá direto às tarefas mais frequentes.</p>
              </div>
              <div className="shortcut-grid">
                <button className="secondary" onClick={() => { setSection('students'); setAdding(true); setEditing(null); setForm({}); }}><Plus size={17} /> Novo aluno</button>
                <button className="secondary" onClick={() => { setSection('payments'); setAdding(true); setEditing(null); setForm({}); }}><CreditCard size={17} /> Registrar pagamento</button>
                <button className="secondary" onClick={() => { setSection('lessons'); setAdding(true); setEditing(null); setForm({}); }}><CalendarDays size={17} /> Registrar aula</button>
                <button className="secondary" onClick={() => setSection('modalities')}><Layers size={17} /> Ver modalidades</button>
              </div>
            </section>
            <section className="panel dashboard-summary">
              <h2>Resumo dos cadastros</h2>
              <div className="summary-list">
                {sections.filter(s => s.id !== 'reports').map(s => (
                  <button key={s.id} onClick={() => setSection(s.id)}><span><s.icon size={17} /> {s.label}</span><strong>{counts[s.id] ?? '—'}</strong></button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={'Buscar ' + current.label.toLowerCase()}
                  aria-label={'Buscar ' + current.label.toLowerCase()}
                />
              </div>
              {section === 'students' && (
                <select className="status-filter" value={studentStatusFilter} onChange={e => setStudentStatusFilter(e.target.value)} aria-label="Filtrar situação dos alunos">
                  <option value="all">Todos os alunos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              )}
              {section === 'payments' && (
                <select className="status-filter" value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)} aria-label="Filtrar pagamentos por situação">
                  <option value="all">Todos os pagamentos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="pago">Pagos</option>
                  <option value="parcial">Parciais</option>
                  <option value="overdue">Atrasados</option>
                </select>
              )}
              <div className="toolbar-actions">
                <button className="secondary export-button" onClick={exportCsv} disabled={loading || filtered.length === 0}>
                  <Download size={16} /> Exportar CSV
                </button>
                {section === 'payments' && (
                  <button className="secondary monthly-generate-button" onClick={() => void generateMonthlyPayments()} disabled={loading}>
                    <RefreshCw size={16} /> Gerar mensalidades do mês
                  </button>
                )}
                {section === 'students' && (
                  <>
                    <input className="file-input" id="student-csv" type="file" accept=".csv,text/csv" onChange={e => { void importStudents(e.target.files?.[0]); e.currentTarget.value = ''; }} />
                    <label className="secondary import-button" htmlFor="student-csv"><Upload size={17} /> {importing ? 'Importando…' : 'Importar CSV'}</label>
                  </>
                )}
                <button
                  className="primary"
                  onClick={() => {
                    const opening = !adding;
                    setAdding(opening);
                    setForm(opening && section === 'lessons'
                      ? { durationMinutes: '60', capacity: '1', recurrenceIntervalWeeks: '1', status: 'Agendada' }
                      : {});
                    setError('');
                  }}
                >
                  <Plus size={17} /> Novo cadastro
                </button>
              </div>
            </div>
            {adding && (
              <section className="panel form-panel">
                <h2>{editing ? 'Editar cadastro' : 'Novo registro'}</h2>
                {section === 'lessons' && (
                  <p className="muted">
                    Agenda: informe duração, profissional, local e capacidade. Para recorrência, use dias separados por vírgula
                    (SEG, TER, QUA, QUI, SEX, SAB, DOM) e intervalo em semanas. Sem dias, usa o dia da primeira aula.
                    A geração cria até 100 aulas por operação, em no máximo 366 dias, ignorando duplicidades e conflitos.
                  </p>
                )}
                <div className="form-grid">
                  {current.fields.map(([key, label]) => (
                    <label key={key}>
                      {label}
                      {key === 'status' ? (
                        <select
                          value={form[key] || (section === 'students' ? 'Ativo' : section === 'payments' ? 'Pendente' : '')}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        >
                          {(section === 'students' ? ['Ativo', 'Inativo'] : section === 'payments' ? ['Pendente', 'Pago', 'Parcial', 'Atrasado'] : ['Agendada', 'Realizada', 'Cancelada']).map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      ) : key === 'modality' ? (
                        <select
                          required={section === 'students' || section === 'lessons'}
                          value={form[key] || ''}
                          onChange={e => {
                            const value = e.target.value;
                            const selected = referenceModalities.find(item => String(item.name || '') === value);
                            setForm(p => ({
                              ...p,
                              [key]: value,
                              ...(section === 'students' && selected ? {
                                ...(selected.price != null && String(selected.price).trim() !== '' ? { monthlyFee: String(selected.price) } : {}),
                                ...(selected.frequency != null && String(selected.frequency).trim() !== '' ? { frequency: String(selected.frequency) } : {}),
                              } : {}),
                            }));
                          }}
                        >
                          <option value="">{referenceModalities.length ? 'Selecione uma modalidade cadastrada' : 'Nenhuma modalidade cadastrada'}</option>
                          {form[key] && !referenceModalities.some(item => String(item.name) === form[key]) && <option value={form[key]}>{form[key]} (atual)</option>}
                          {referenceModalities.map(item => (
                            <option key={item.id} value={String(item.name || '')}>
                              {String(item.name || 'Modalidade')}
                            </option>
                          ))}
                        </select>
                      ) : key === 'student' ? (
                        <select
                          required={section === 'lessons' || section === 'payments'}
                          value={form[key] || ''}
                          onChange={e => {
                            const value = e.target.value;
                            const selected = referenceStudents.find(item => String(item.name || '') === value);
                            setForm(p => ({
                              ...p,
                              [key]: value,
                              ...(selected && section === 'payments' ? {
                                ...(selected.monthlyFee != null ? { amount: String(selected.monthlyFee) } : {}),
                                ...(!p.dueDate ? { dueDate: (() => {
                                  const now = new Date();
                                  const day = Math.min(28, Math.max(1, Number(selected.dueDay) || 10));
                                  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-');
                                })() } : {}),
                                ...(!p.status ? { status: 'Pendente' } : {}),
                              } : {}),
                              ...(selected && section === 'lessons' && selected.modality ? { modality: String(selected.modality) } : {}),
                            }));
                          }}
                        >
                          <option value="">{referenceStudents.length ? 'Selecione um aluno cadastrado' : 'Nenhum aluno cadastrado'}</option>
                          {form[key] && !referenceStudents.some(item => String(item.name) === form[key]) && <option value={form[key]}>{form[key]} (atual)</option>}
                          {referenceStudents
                            .filter(item => section !== 'lessons' || !/^(inativo|inactive|false|0)$/i.test(String(item.status ?? 'Ativo').trim()))
                            .map(item => (
                              <option key={item.id} value={String(item.name || '')}>
                                {String(item.name || 'Aluno')}{/^(inativo|inactive|false|0)$/i.test(String(item.status ?? 'Ativo').trim()) ? ' · Inativo' : ''}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type={['startDate', 'date', 'dueDate', 'paidDate', 'repeatUntil'].includes(key) ? 'date' : key === 'time' ? 'time' : ['monthlyFee', 'amount', 'price', 'frequency', 'dueDay', 'durationMinutes', 'capacity', 'recurrenceIntervalWeeks'].includes(key) ? 'number' : 'text'}
                          inputMode={['monthlyFee', 'amount', 'price', 'frequency', 'dueDay', 'durationMinutes', 'capacity', 'recurrenceIntervalWeeks'].includes(key) ? 'decimal' : undefined}
                          min={['monthlyFee', 'amount', 'price', 'frequency', 'dueDay', 'durationMinutes', 'capacity', 'recurrenceIntervalWeeks'].includes(key) ? (key === 'durationMinutes' ? '15' : ['capacity', 'recurrenceIntervalWeeks'].includes(key) ? '1' : '0') : undefined}
                          max={key === 'durationMinutes' ? '240' : key === 'capacity' ? '200' : key === 'recurrenceIntervalWeeks' ? '52' : undefined}
                          step={['monthlyFee', 'amount', 'price'].includes(key) ? '0.01' : ['frequency', 'dueDay', 'durationMinutes', 'capacity', 'recurrenceIntervalWeeks'].includes(key) ? '1' : undefined}
                          required={section === 'lessons' && ['date', 'time'].includes(key)}
                          value={key === 'time' ? String(form[key] || '').slice(0, 5) : form[key] || ''}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={key === 'daysOfWeek' ? 'SEG, QUA, SEX' : label}
                        />
                      )}
                    </label>
                  ))}
                </div>
                <div className="form-actions">
                  <button
                    className="secondary"
                    onClick={() => { setAdding(false); setEditing(null); setForm({}); }}
                  >
                    Cancelar
                  </button>
                  <button className="primary" onClick={() => void save()}>
                    <Check size={16} /> {editing ? 'Salvar alterações' : 'Salvar cadastro'}
                  </button>
                </div>
              </section>
            )}
            <section className="panel table-panel">
              {loading ? (
                <div className="empty">Carregando registros…</div>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">
                    <current.icon size={22} />
                  </div>
                  <b>Nenhum registro encontrado</b>
                  <span>Adicione um cadastro para começar.</span>
                </div>
              ) : (
                <div className={section + '-table table-wrap'}>
                  <table>
                    <thead>
                      <tr>
                        {current.fields.map(([key, label]) => (
                          <th key={key}>{label}</th>
                        ))}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(item => (
                        <tr key={item.id}>
                          {current.fields.map(([key, label]) => (
                            <td key={key} data-label={label}>
                              {String(item[key] ?? '—')}
                            </td>
                          ))}
                          <td data-label="Ações" className="row-actions">
                            <button
                              className="edit-button"
                              onClick={() => startEditing(item)}
                              aria-label={'Editar ' + String(item.name ?? item.id)}
                            >
                              <Pencil size={15} /> <span>Editar</span>
                            </button>
                            {section === 'payments' && /^(pago|paid)$/i.test(String(item.status ?? '').trim()) && (
                              item.financeSyncStatus === 'synced' ? (
                                <span className="finance-sync-status" title={String(item.financeTransactionId || 'Lançamento confirmado no Finance')}>
                                  <Check size={14} /> Finance
                                </span>
                              ) : (
                                <button
                                  className="quick-payment-button"
                                  disabled={syncingPaymentId !== null}
                                  onClick={() => void syncPaymentWithFinance(item)}
                                  aria-label={'Sincronizar pagamento ' + String(item.id) + ' com o Finance'}
                                  title={String(item.financeSyncError || 'Enviar pagamento confirmado ao KOVIAN Finance')}
                                >
                                  <Wallet size={15} />
                                  <span>{syncingPaymentId === item.id ? 'Enviando…' : item.financeSyncStatus === 'pending' ? 'Tentar novamente' : 'Enviar ao Finance'}</span>
                                </button>
                              )
                            )}
                            {section === 'lessons' && item.recurrenceGenerated !== true && item.recurrenceGenerated !== 'true' && (
                              <button
                                className="quick-payment-button"
                                disabled={generatingLessonId !== null}
                                onClick={() => void generateRecurringLessons(item)}
                                aria-label={'Gerar recorrência da aula ' + String(item.id)}
                                title="Gerar próximas aulas com base nos dias e intervalo configurados"
                              >
                                <RefreshCw size={15} />
                                <span>{generatingLessonId === item.id ? 'Gerando…' : 'Gerar recorrência'}</span>
                              </button>
                            )}
                            {section === 'students' && (
                              <button
                                className="quick-payment-button"
                                onClick={() => startStudentPayment(item)}
                                aria-label={'Registrar pagamento de ' + String(item.name ?? item.id)}
                                title="Registrar pagamento"
                              >
                                <CreditCard size={15} /> <span>Pagamento</span>
                              </button>
                            )}
                            <button
                              className="delete"
                              onClick={() => void remove(item.id)}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
        <footer>
          KOVIAN Gestão <span>•</span> Dados privados da sua operação
        </footer>
      </main>
    </div>
  );
}
export default App;
