import { useMemo, useState } from 'react'
import { Bell, Check, CheckCheck, Filter, RefreshCw } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFinanceOwnerId } from '../lib/useFinanceOwnerId'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/ui/PageHeader'

type NotificationFilter = 'ALL' | 'UNREAD'
type SeverityFilter = 'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'

function notificationTarget(type: string, entityType: string | null) {
  if (entityType === 'BUDGET' || type.startsWith('BUDGET_')) return '/orcamentos'
  if (type.startsWith('RECURRING_')) return '/recorrentes'
  if (entityType === 'DebtInstallment' || type.startsWith('DEBT_')) return '/dividas'
  if (type.startsWith('CASH_FLOW') || type.startsWith('SPENDING_')) return '/relatorios'
  return null
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const ownerId = useFinanceOwnerId()
  const [view, setView] = useState<NotificationFilter>('ALL')
  const [severity, setSeverity] = useState<SeverityFilter>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['finance', 'notifications', ownerId, 'all'],
    queryFn: () => getNotifications(false),
    enabled: Boolean(ownerId),
    staleTime: 15_000,
  })

  const notifications = query.data ?? []
  const unread = notifications.filter(item => !item.readAt).length
  const filtered = useMemo(() => notifications.filter(item => {
    const matchesView = view === 'ALL' || !item.readAt
    const matchesSeverity = severity === 'ALL' || item.severity === severity
    return matchesView && matchesSeverity
  }), [notifications, severity, view])

  const markRead = async (id: string) => {
    setBusyId(id); setActionError(null)
    try {
      await markNotificationRead(id)
      await qc.invalidateQueries({ queryKey: ['finance', 'notifications', ownerId] })
    } catch {
      setActionError(t('saveError'))
    } finally {
      setBusyId(null)
    }
  }

  const markAll = async () => {
    if (!unread || markingAll) return
    setMarkingAll(true); setActionError(null)
    try {
      await markAllNotificationsRead()
      await qc.invalidateQueries({ queryKey: ['finance', 'notifications', ownerId] })
    } catch {
      setActionError(t('saveError'))
    } finally {
      setMarkingAll(false)
    }
  }

  return <main className="page">
    <PageHeader
      title={t('notificationsTitle')}
      description={t('notificationsDesc')}
      actions={<>
        <button className="secondary" type="button" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw size={16}/>{t('refresh')}</button>
        <button className="primary" type="button" onClick={() => void markAll()} disabled={!unread || markingAll}><CheckCheck size={16}/>{t('markAllRead')}</button>
      </>}
    />
    {!ownerId && <div className="notice" role="status">{t('loginToLoadData')}</div>}
    {query.isError && <div className="notice" role="alert">{t('notificationsError')}</div>}
    {actionError && <div className="notice" role="alert">{actionError}</div>}

    <div className="stat-grid">
      <article className="stat-card"><Bell size={17}/><span>{t('unreadNotifications')}</span><strong>{query.isLoading ? '—' : unread}</strong></article>
      <article className="stat-card"><Filter size={17}/><span>{t('visibleNotifications')}</span><strong>{query.isLoading ? '—' : filtered.length}</strong></article>
    </div>

    <section className="panel data-panel">
      <div className="section-title">
        <div><span className="eyebrow">{t('notifications')}</span><h2>{t('recentNotifications')}</h2></div>
        <div className="header-actions">
          <select aria-label={t('notificationView')} value={view} onChange={e => setView(e.target.value as NotificationFilter)}>
            <option value="ALL">{t('allNotifications')}</option>
            <option value="UNREAD">{t('unreadOnly')}</option>
          </select>
          <select aria-label={t('notificationSeverity')} value={severity} onChange={e => setSeverity(e.target.value as SeverityFilter)}>
            <option value="ALL">{t('allSeverities')}</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {query.isLoading && <div className="empty-inline">{t('loading')}</div>}
      {!query.isLoading && !query.isError && !filtered.length && <div className="empty-inline">{t('noNotifications')}</div>}
      {filtered.map(notification => {
        const target = notificationTarget(notification.type, notification.entityType)
        return <article className={`feature-card ${notification.readAt ? '' : 'is-unread'}`} key={notification.id}>
          <div className="feature-icon"><Bell size={18}/></div>
          <div>
            <strong>{notification.title}</strong>
            <span>{notification.message}</span>
            <small>{notification.severity} · {new Date(notification.createdAt).toLocaleString(document.documentElement.lang || 'pt-BR')}</small>
          </div>
          <div className="header-actions">
            {target && <NavLink className="secondary" to={target}>{t('open')}</NavLink>}
            {!notification.readAt && <button className="secondary" type="button" disabled={busyId === notification.id} onClick={() => void markRead(notification.id)}><Check size={15}/>{t('markRead')}</button>}
          </div>
        </article>
      })}
    </section>
  </main>
}
