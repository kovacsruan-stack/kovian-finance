import { NavLink, Route, Routes } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ensureFinanceSession } from './lib/api'
import Shell from './components/layout/FinanceShell'
import { Dashboard, Header } from './pages/FinancePage'
import { pageConfig, FinancePage } from './pages/FinancePage'
import ForecastPage from './pages/ForecastPage'
import NetWorthPage from './pages/NetWorthPage'
import InsightsPage from './pages/InsightsPage'
import DebtsPage from './pages/DebtsPage'
import NotificationsPage from './pages/NotificationsPage'
import TransferPage from './pages/TransferPage'
import ImportExportPage from './pages/import-export/ImportExportPage'
import CalendarPage from './pages/CalendarPage'
import ManagementPage from './pages/ManagementPage'
import GoalsPage from './pages/goals/GoalsPage'
import BudgetsPage from './pages/budgets/BudgetsPage'
import RecurringPage from './pages/recurring/RecurringPage'

function App() {
  const { t } = useTranslation()
  const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [sessionError, setSessionError] = useState('')

  const initializeSession = useCallback(() => {
    setSessionState('loading')
    setSessionError('')
    void ensureFinanceSession()
      .then(() => setSessionState('ready'))
      .catch(error => {
        setSessionError(error instanceof Error ? error.message : 'Não foi possível iniciar o acesso automático.')
        setSessionState('error')
      })
  }, [])

  useEffect(() => { initializeSession() }, [initializeSession])

  if (sessionState === 'loading') {
    return <main className="page"><section className="panel empty-state"><strong>Preparando seu Finance...</strong><p>Seu acesso é criado automaticamente, sem e-mail ou senha.</p></section></main>
  }

  if (sessionState === 'error') {
    return <main className="page"><section className="panel empty-state"><strong>Não foi possível abrir o Finance</strong><p>{sessionError}</p><button className="primary" type="button" onClick={initializeSession}>Tentar novamente</button></section></main>
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/previsao" element={<ForecastPage />} />
        <Route path="/patrimonio" element={<NetWorthPage />} />
        <Route path="/inteligencia" element={<InsightsPage />} />
        <Route path="/dividas" element={<DebtsPage />} />
        <Route path="/notificacoes" element={<NotificationsPage />} />
        <Route path="/transferencias" element={<TransferPage />} />
        <Route path="/import-export" element={<ImportExportPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/gestao" element={<ManagementPage />} />
        <Route path="/metas" element={<GoalsPage />} />
        <Route path="/orcamentos" element={<BudgetsPage />} />
        <Route path="/recorrentes" element={<RecurringPage />} />
        {Object.entries(pageConfig).map(([path, config]) => <Route key={path} path={path} element={<FinancePage config={config} />} />)}
        <Route path="*" element={<main className="page"><Header title={t('notFoundTitle')} desc={t('notFoundDesc')} action={<NavLink className="secondary" to="/">{t('backHome')}</NavLink>} /><section className="panel empty-state"><FileText size={30} /><div><strong>{t('notFoundRoute')}</strong><p>{t('notFoundHelp')}</p></div></section></main>} />
      </Routes>
    </Shell>
  )
}

export default App
