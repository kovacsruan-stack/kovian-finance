import { useMemo } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getOwnerId, getRecurring, getTransactions, type FinanceRecurring, type FinanceTransaction } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const money=(value:number)=>value.toLocaleString(document.documentElement.lang||'pt-BR',{style:'currency',currency:'BRL'})
const iso=(date:Date)=>{const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return y+'-'+m+'-'+d}
const startOfMonth=(date:Date)=>new Date(date.getFullYear(),date.getMonth(),1)
const endOfMonth=(date:Date)=>new Date(date.getFullYear(),date.getMonth()+1,0)
const daysInMonth=(date:Date)=>endOfMonth(date).getDate()
const mondayOffset=(date:Date)=>(date.getDay()+6)%7

type CalendarEvent={date:string;title:string;amount:number;kind:'INCOME'|'EXPENSE'|'TRANSFER'|'RECURRING'}

export default function CalendarPage(){
 const {t}=useTranslation()
 const ownerId=getOwnerId()
 const [month,setMonth]=useState(()=>startOfMonth(new Date()))
 const from=iso(startOfMonth(month));const to=iso(new Date(month.getFullYear(),month.getMonth()+1,1))
 const transactions=useQuery({queryKey:['finance','calendar','transactions',ownerId,from,to],queryFn:()=>getTransactions(new Date(from+'T00:00:00').toISOString(),new Date(to+'T00:00:00').toISOString()),enabled:Boolean(ownerId),staleTime:30_000})
 const recurring=useQuery({queryKey:['finance','calendar','recurring',ownerId],queryFn:getRecurring,enabled:Boolean(ownerId),staleTime:30_000})
 const events=useMemo<CalendarEvent[]>(()=>{
  const tx=(transactions.data??[]).filter((item:FinanceTransaction)=>item.status!=='CANCELLED').map(item=>({date:iso(new Date(item.occurredAt)),title:item.description,amount:Number(item.amount),kind:item.type}))
  const recurringEvents=(recurring.data??[]).filter((item:FinanceRecurring)=>item.active&&item.nextOccurrence>=from&&item.nextOccurrence<to).map(item=>({date:item.nextOccurrence,title:item.description,amount:Number(item.amount),kind:'RECURRING' as const}))
  return [...tx,...recurringEvents].sort((a,b)=>a.date.localeCompare(b.date))
 },[transactions.data,recurring.data,from,to])
 const byDay=useMemo(()=>events.reduce<Record<string,CalendarEvent[]>>((acc,event)=>{(acc[event.date]??=[]).push(event);return acc},{}),[events])
 const cells=useMemo(()=>Array.from({length:mondayOffset(month)+daysInMonth(month)},(_,index)=>index<mondayOffset(month)?null:index-mondayOffset(month)+1),[month])
 const locale=document.documentElement.lang||'pt-BR'
 const label=month.toLocaleDateString(locale,{month:'long',year:'numeric'})
 const monthEvents=events.filter(event=>event.date.startsWith(from.slice(0,7)))
 const loading=transactions.isLoading||recurring.isLoading
 return <main className="page">
  <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{locale.startsWith('pt')?'Calendário financeiro':'Financial calendar'}</h1><p>{locale.startsWith('pt')?'Visualize movimentações e recorrências por data.':'Visualize transactions and recurring items by date.'}</p></div><div className="header-actions"><button type="button" className="secondary" aria-label={locale.startsWith('pt')?'Mês anterior':'Previous month'} onClick={()=>setMonth(value=>new Date(value.getFullYear(),value.getMonth()-1,1))}><ChevronLeft size={16}/></button><button type="button" className="secondary" onClick={()=>setMonth(startOfMonth(new Date()))}>{locale.startsWith('pt')?'Hoje':'Today'}</button><button type="button" className="secondary" aria-label={locale.startsWith('pt')?'Próximo mês':'Next month'} onClick={()=>setMonth(value=>new Date(value.getFullYear(),value.getMonth()+1,1))}><ChevronRight size={16}/></button></div></section>
  {!ownerId&&<div className="notice"><CircleDollarSign size={17}/><span>{t('loginToLoadData')}</span></div>}
  {transactions.isError&&<div className="notice"><CircleDollarSign size={17}/><span>{t('financeLoadError')}</span></div>}
  <section className="panel finance-calendar"><div className="calendar-toolbar"><strong>{label.charAt(0).toUpperCase()+label.slice(1)}</strong><span>{loading?t('loading'):(locale.startsWith('pt')?events.length+' eventos':' '+events.length+' events')}</span></div>
   <div className="calendar-weekdays">{(locale.startsWith('pt')?['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map(day=><span key={day}>{day}</span>)}</div>
   <div className="calendar-grid">{cells.map((day,index)=>{const date=day?iso(new Date(month.getFullYear(),month.getMonth(),day)):'';const items=day?(byDay[date]??[]):[];return <div className={day?'calendar-cell':'calendar-cell calendar-cell-empty'} key={index}>{day&&<><span className="calendar-day">{day}</span><div className="calendar-events">{items.slice(0,3).map((event,i)=><div className={'calendar-event '+event.kind.toLowerCase()} key={event.title+i} title={event.title}><span>{event.title}</span><b>{money(event.amount)}</b></div>)}{items.length>3&&<small>+{items.length-3}</small>}</div></>}</div>})}</div>
  </section>
  <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow"><CalendarDays size={12}/></span><h2>{locale.startsWith('pt')?'Eventos do mês':'Month events'}</h2></div></div>{monthEvents.length?monthEvents.map((event,index)=><div className="account-row" key={event.date+event.title+index}><i/><span><strong>{event.title}</strong><small>{new Date(event.date+'T00:00:00').toLocaleDateString(locale)} · {event.kind==='RECURRING'?(locale.startsWith('pt')?'Recorrente':'Recurring'):event.kind==='INCOME'?(locale.startsWith('pt')?'Entrada':'Income'):event.kind==='TRANSFER'?(locale.startsWith('pt')?'Transferência':'Transfer'):(locale.startsWith('pt')?'Saída':'Expense')}</small></span><b className={event.kind==='INCOME'?'positive':event.kind==='EXPENSE'?'negative':''}>{money(event.amount)}</b></div>):<div className="empty-inline">{locale.startsWith('pt')?'Nenhum evento neste mês.':'No events this month.'}</div>}</section>
 </main>
}
