import { useMemo } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAccounts, getOwnerId, getRecurring, getTransactions, type FinanceAccount, type FinanceRecurring, type FinanceTransaction } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const money=(value:number,currency='BRL')=>value.toLocaleString(document.documentElement.lang||'pt-BR',{style:'currency',currency})
const iso=(date:Date)=>{const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return y+'-'+m+'-'+d}
const startOfMonth=(date:Date)=>new Date(date.getFullYear(),date.getMonth(),1)
const endOfMonth=(date:Date)=>new Date(date.getFullYear(),date.getMonth()+1,0)
const daysInMonth=(date:Date)=>endOfMonth(date).getDate()
const mondayOffset=(date:Date)=>(date.getDay()+6)%7

type CalendarEvent={date:string;title:string;amount:number;currency:string;kind:'INCOME'|'EXPENSE'|'TRANSFER'|'RECURRING';time?:string}

export default function CalendarPage(){
 const {t}=useTranslation()
 const ownerId=getOwnerId()
 const [month,setMonth]=useState(()=>startOfMonth(new Date()))
 const [selectedDate,setSelectedDate]=useState(()=>iso(new Date()))
 const [visibleKinds,setVisibleKinds]=useState<Array<CalendarEvent['kind']>>(['INCOME','EXPENSE','TRANSFER','RECURRING'])
 const from=iso(startOfMonth(month));const to=iso(new Date(month.getFullYear(),month.getMonth()+1,1))
 const transactions=useQuery({queryKey:['finance','calendar','transactions',ownerId,from,to],queryFn:()=>getTransactions(new Date(from+'T00:00:00').toISOString(),new Date(to+'T00:00:00').toISOString()),enabled:Boolean(ownerId),staleTime:30_000})
 const recurring=useQuery({queryKey:['finance','calendar','recurring',ownerId],queryFn:getRecurring,enabled:Boolean(ownerId),staleTime:30_000})
 const accounts=useQuery({queryKey:['finance','calendar','accounts',ownerId],queryFn:()=>getAccounts(ownerId!),enabled:Boolean(ownerId),staleTime:60_000})
 const events=useMemo<CalendarEvent[]>(()=>{
  const currencyByAccount=new Map((accounts.data??[]).map((account:FinanceAccount)=>[account.id,account.currency]))
  const tx=(transactions.data??[]).filter((item:FinanceTransaction)=>item.status!=='CANCELLED').map(item=>({date:iso(new Date(item.occurredAt)),time:new Date(item.occurredAt).toLocaleTimeString(document.documentElement.lang||'pt-BR',{hour:'2-digit',minute:'2-digit'}),title:item.description,amount:Number(item.amount),currency:currencyByAccount.get(item.accountId)||'BRL',kind:item.type}))
  const recurringEvents=(recurring.data??[]).filter((item:FinanceRecurring)=>item.active&&item.nextOccurrence>=from&&item.nextOccurrence<to).map(item=>({date:item.nextOccurrence,title:item.description,amount:Number(item.amount),currency:currencyByAccount.get(item.accountId)||'BRL',kind:'RECURRING' as const}))
  return [...tx,...recurringEvents].sort((a,b)=>a.date.localeCompare(b.date))
 },[transactions.data,recurring.data,accounts.data,from,to])
 const filteredEvents=useMemo(()=>events.filter(event=>visibleKinds.includes(event.kind)),[events,visibleKinds])
 const byDay=useMemo(()=>filteredEvents.reduce<Record<string,CalendarEvent[]>>((acc,event)=>{(acc[event.date]??=[]).push(event);return acc},{}),[filteredEvents])
 const cells=useMemo(()=>Array.from({length:mondayOffset(month)+daysInMonth(month)},(_,index)=>index<mondayOffset(month)?null:index-mondayOffset(month)+1),[month])
 const locale=document.documentElement.lang||'pt-BR'
 const label=month.toLocaleDateString(locale,{month:'long',year:'numeric'})
 const monthEvents=filteredEvents.filter(event=>event.date.startsWith(from.slice(0,7)))
 const selectedEvents=filteredEvents.filter(event=>event.date===selectedDate)
 const toggleKind=(kind:CalendarEvent['kind'])=>setVisibleKinds(current=>current.includes(kind)?current.filter(item=>item!==kind):[...current,kind])
 const moveMonth=(delta:number)=>setMonth(value=>{const next=new Date(value.getFullYear(),value.getMonth()+delta,1);setSelectedDate(iso(next));return next})
 const loading=transactions.isLoading||recurring.isLoading||accounts.isLoading
 return <main className="page">
  <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{locale.startsWith('pt')?'Calendário financeiro':'Financial calendar'}</h1><p>{locale.startsWith('pt')?'Visualize movimentações e recorrências por data.':'Visualize transactions and recurring items by date.'}</p></div><div className="header-actions"><button type="button" className="secondary" aria-label={locale.startsWith('pt')?'Mês anterior':'Previous month'} onClick={()=>moveMonth(-1)}><ChevronLeft size={16}/></button><button type="button" className="secondary" onClick={()=>{const today=new Date();setMonth(startOfMonth(today));setSelectedDate(iso(today))}}>{locale.startsWith('pt')?'Hoje':'Today'}</button><button type="button" className="secondary" aria-label={locale.startsWith('pt')?'Próximo mês':'Next month'} onClick={()=>moveMonth(1)}><ChevronRight size={16}/></button></div></section>
  {!ownerId&&<div className="notice" role="status" aria-live="polite"><CircleDollarSign size={17}/><span>{t('loginToLoadData')}</span></div>}
  {(transactions.isError||recurring.isError||accounts.isError)&&<div className="notice" role="alert" aria-live="assertive"><CircleDollarSign size={17}/><span>{t('financeLoadError')}</span></div>}
  <section className="panel finance-calendar"><div className="calendar-toolbar"><strong>{label.charAt(0).toUpperCase()+label.slice(1)}</strong><span>{loading?t('loading'):(locale.startsWith('pt')?filteredEvents.length+' eventos':' '+filteredEvents.length+' events')}</span></div>
   <div className="calendar-filters" aria-label={locale.startsWith('pt')?'Filtros do calendário':'Calendar filters'}>{([{kind:'INCOME',label:locale.startsWith('pt')?'Entradas':'Income'},{kind:'EXPENSE',label:locale.startsWith('pt')?'Saídas':'Expenses'},{kind:'TRANSFER',label:locale.startsWith('pt')?'Transferências':'Transfers'},{kind:'RECURRING',label:locale.startsWith('pt')?'Recorrências':'Recurring'}] as const).map(item=><button type="button" key={item.kind} aria-pressed={visibleKinds.includes(item.kind)} className={visibleKinds.includes(item.kind)?'secondary calendar-filter active':'secondary calendar-filter'} onClick={()=>toggleKind(item.kind)}>{item.label}</button>)}</div>
   <div className="calendar-weekdays">{(locale.startsWith('pt')?['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map(day=><span key={day}>{day}</span>)}</div>
   <div className="calendar-grid">{cells.map((day,index)=>{const date=day?iso(new Date(month.getFullYear(),month.getMonth(),day)):'';const items=day?(byDay[date]??[]):[];const selected=date===selectedDate;return <div className={(day?'calendar-cell':'calendar-cell calendar-cell-empty')+(selected?' calendar-cell-selected':'')} key={index} role={day?'button':undefined} tabIndex={day?0:undefined} aria-pressed={day?selected:undefined} onClick={day?()=>setSelectedDate(date):undefined} onKeyDown={day?(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelectedDate(date)}}:undefined}>{day&&<><span className="calendar-day">{day}</span><div className="calendar-events">{items.slice(0,3).map((event,i)=><div className={'calendar-event '+event.kind.toLowerCase()} key={event.date+event.kind+event.title+i} title={event.title}><span>{event.title}</span><b>{money(event.amount,event.currency)}</b></div>)}{items.length>3&&<small>+{items.length-3}</small>}</div></>}</div>})}</div>
  </section>
  <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow"><CalendarDays size={12}/></span><h2>{locale.startsWith('pt')?'Agenda do dia':'Day agenda'}</h2><small>{new Date(selectedDate+'T00:00:00').toLocaleDateString(locale,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</small></div></div>{selectedEvents.length?selectedEvents.map((event,index)=><div className="account-row" key={event.date+event.title+index}><i/><span><strong>{event.title}</strong><small>{event.time?event.time+' · ':''}{event.kind==='RECURRING'?(locale.startsWith('pt')?'Recorrente':'Recurring'):event.kind==='INCOME'?(locale.startsWith('pt')?'Entrada':'Income'):event.kind==='TRANSFER'?(locale.startsWith('pt')?'Transferência':'Transfer'):(locale.startsWith('pt')?'Saída':'Expense')}</small></span><b className={event.kind==='INCOME'?'positive':event.kind==='EXPENSE'?'negative':''}>{money(event.amount,event.currency)}</b></div>):<div className="empty-inline">{locale.startsWith('pt')?'Nenhum evento para este dia com os filtros selecionados.':'No events for this day with the selected filters.'}</div>}</section>
  <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow"><CalendarDays size={12}/></span><h2>{locale.startsWith('pt')?'Eventos do mês':'Month events'}</h2></div></div>{monthEvents.length?monthEvents.map((event,index)=><div className="account-row" key={event.date+event.title+index}><i/><span><strong>{event.title}</strong><small>{new Date(event.date+'T00:00:00').toLocaleDateString(locale)} · {event.kind==='RECURRING'?(locale.startsWith('pt')?'Recorrente':'Recurring'):event.kind==='INCOME'?(locale.startsWith('pt')?'Entrada':'Income'):event.kind==='TRANSFER'?(locale.startsWith('pt')?'Transferência':'Transfer'):(locale.startsWith('pt')?'Saída':'Expense')}</small></span><b className={event.kind==='INCOME'?'positive':event.kind==='EXPENSE'?'negative':''}>{money(event.amount,event.currency)}</b></div>):<div className="empty-inline">{locale.startsWith('pt')?'Nenhum evento neste mês.':'No events this month.'}</div>}</section>
 </main>
}
