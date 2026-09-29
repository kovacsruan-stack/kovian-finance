import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getNotifications, getOwnerId, markNotificationRead } from '../lib/api'
import PageHeader from '../components/ui/PageHeader'

export default function NotificationsPage(){
 const {t}=useTranslation(); const qc=useQueryClient(); const ownerId=getOwnerId(); const [readingId,setReadingId]=useState<string|null>(null); const [actionError,setActionError]=useState<string|null>(null)
 const q=useQuery({queryKey:['finance','notifications',ownerId],queryFn:()=>getNotifications(false),enabled:Boolean(ownerId),staleTime:30_000})
 const unread=(q.data??[]).filter(x=>!x.readAt).length
 const read=async(id:string)=>{setReadingId(id);setActionError(null);try{await markNotificationRead(id);await qc.invalidateQueries({queryKey:['finance','notifications',ownerId]})}catch{setActionError(t('saveError'))}finally{setReadingId(null)}}
 return <main className="page"><PageHeader title={t('notificationsTitle')} description={t('notificationsDesc')} />
 {!ownerId&&<div className="notice">{t('loginToLoadData')}</div>}{q.isError&&<div className="notice">{t('notificationsError')}</div>}
 <div className="stat-grid"><article className="stat-card"><Bell size={17}/><span>{t('unreadNotifications')}</span><strong>{q.isLoading?'—':unread}</strong></article></div>
 <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('notifications')}</span><h2>{t('recentNotifications')}</h2></div></div>
 {(q.data??[]).map(n=><article className={`feature-card ${n.readAt?'':'is-unread'}`} key={n.id}><div className="feature-icon"><Bell size={18}/></div><div><strong>{n.title}</strong><span>{n.message}</span><small>{n.severity} · {new Date(n.createdAt).toLocaleString(document.documentElement.lang||'pt-BR')}</small></div>{!n.readAt&&<button className="secondary" type="button" disabled={readingId===n.id} onClick={()=>void read(n.id)}><Check size={15}/>{t('markRead')}</button>}</article>)}
 {!q.isLoading&&!q.data?.length&&<div className="empty-inline">{t('noNotifications')}</div>}
 </section></main>
}
