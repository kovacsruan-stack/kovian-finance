import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, BrainCircuit, CheckCircle2, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/ui/PageHeader'
import { getFinancialInsights, getOwnerId } from '../lib/api'
export default function InsightsPage(){
 const {t}=useTranslation(); const ownerId=getOwnerId(); const to=new Date(); const from=new Date(to); from.setDate(to.getDate()-90)
 const fromIso=from.toISOString().slice(0,10),toIso=to.toISOString().slice(0,10)
 const severityRank=(value:string)=>value==='HIGH'?3:value==='MEDIUM'?2:1
 const q=useQuery({queryKey:['finance','insights',ownerId,fromIso,toIso],queryFn:()=>getFinancialInsights(ownerId!,fromIso,toIso),enabled:Boolean(ownerId),staleTime:120000,retry:2})
 const icon=(s:string)=>s==='HIGH'?<AlertTriangle size={18}/>:s==='MEDIUM'?<Info size={18}/>:<CheckCircle2 size={18}/>
 return <main className="page"><PageHeader title={t('insightsTitle')} description={t('insightsDesc')} />
 {!ownerId&&<div className="notice">{t('loginToLoadData')}</div>}{q.isError&&<div className="notice">{t('insightsError')}</div>}
 <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow">{t('analysis')}</span><h2>{t('recentInsights')}</h2></div><BrainCircuit size={18}/></div>
 {q.isLoading&&<div className="empty-inline">{t('loading')}</div>}
 {q.data?.slice().sort((a,b)=>severityRank(b.severity)-severityRank(a.severity)||new Date(b.generatedAt).getTime()-new Date(a.generatedAt).getTime()).map(x=><article className="feature-card" key={x.type+'-'+x.generatedAt}><div className="feature-icon">{icon(x.severity)}</div><div><strong>{x.title}</strong><span>{x.explanation}</span><small>{new Date(x.generatedAt).toLocaleString(document.documentElement.lang||'pt-BR')}</small></div></article>)}
 {!q.isLoading&&!q.data?.length&&<div className="empty-inline">{t('noInsights')}</div>}</section></main>
}
