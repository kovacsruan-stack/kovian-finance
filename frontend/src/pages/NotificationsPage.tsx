import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getNotifications, markNotificationRead } from '../lib/api'

export default function NotificationsPage(){
 const {t}=useTranslation(); const qc=useQueryClient()
 const q=useQuery({queryKey:['finance','notifications'],queryFn:()=>getNotifications(false),staleTime:30_000})
 const unread=(q.data??[]).filter(x=>!x.readAt).length
 const read=async(id:string)=>{await markNotificationRead(id);await qc.invalidateQueries({queryKey:['finance','notifications']})}
 return <main className="page"><section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{t('notificationsTitle')}</h1><p>{t('notificationsDesc')}</p></div></section>
 {q.isError&&<div className="notice">{t('notificationsError')}</div>}
 <div className="stat-grid"><article className="stat-card"><Bell size={17}/><span>{t('unreadNotifications')}</span><strong>{q.isLoading?'—':unread}</strong></article></div>
 <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('notifications')}</span><h2>{t('recentNotifications')}</h2></div></div>
 {(q.data??[]).map(n=><article className={`feature-card ${n.readAt?'':'is-unread'}`} key={n.id}><div className="feature-icon"><Bell size={18}/></div><div><strong>{n.title}</strong><span>{n.message}</span><small>{n.severity} · {new Date(n.createdAt).toLocaleString()}</small></div>{!n.readAt&&<button className="secondary" type="button" onClick={()=>void read(n.id)}><Check size={15}/>{t('markRead')}</button>}</article>)}
 {!q.isLoading&&!q.data?.length&&<div className="empty-inline">{t('noNotifications')}</div>}
 </section></main>
}
