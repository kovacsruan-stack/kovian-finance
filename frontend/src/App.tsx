import { NavLink, Route, Routes } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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

function App() {
  const { t, i18n } = useTranslation()
  useEffect(() => { document.documentElement.lang = i18n.language }, [i18n.language])
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
        {Object.entries(pageConfig).map(([path, config]) => <Route key={path} path={path} element={<FinancePage config={config} />} />)}
        <Route path="*" element={<main className="page"><Header title={t('notFoundTitle')} desc={t('notFoundDesc')} action={<NavLink className="secondary" to="/">{t('backHome')}</NavLink>} /><section className="panel empty-state"><FileText size={30} /><div><strong>{t('notFoundRoute')}</strong><p>{t('notFoundHelp')}</p></div></section></main>} />
      </Routes>
    </Shell>
  )
}

export default App
