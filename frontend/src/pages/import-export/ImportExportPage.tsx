import { useEffect, useState } from 'react'
import { Download, FileUp, RefreshCw } from 'lucide-react'
import { getAccounts, getImportErrors, getImportHistory, importCsv, getTransactions, type FinanceAccount, type FinanceImport, type FinanceImportError, type FinanceTransaction } from '../../lib/api'
import { getOwnerId } from '../../lib/api'
import { useTranslation } from 'react-i18next'
import { buildCsv } from '../../lib/csv'
import PageHeader from '../../components/ui/PageHeader'


function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
export default function ImportExportPage() {
  const { t } = useTranslation()
  const ownerId=getOwnerId()
  const [accounts,setAccounts]=useState<FinanceAccount[]>([])
  const [history,setHistory]=useState<FinanceImport[]>([])
  const [accountId,setAccountId]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const [selectedImportId,setSelectedImportId]=useState<string|null>(null)
  const [importErrors,setImportErrors]=useState<FinanceImportError[]>([])
  const [loadingErrors,setLoadingErrors]=useState(false)
  const [exportRange,setExportRange]=useState(90)
  useEffect(()=>{if(!ownerId)return; void Promise.all([getAccounts(ownerId),getImportHistory()]).then(([a,h])=>{setAccounts(a);setHistory(h);if(a[0])setAccountId(a[0].id)}).catch(()=>setError(t('financeLoadError')))},[ownerId,t])
  const submit=async()=>{if(!accountId||!file)return setError(t('importRequired'));if(file.size>5*1024*1024)return setError(t('importTooLarge'));if(!/\.(csv|txt)$/i.test(file.name))return setError(t('importCsvOnly'));setBusy(true);setError('');try{const result=await importCsv(accountId,file);setHistory(h=>[result,...h.filter(x=>x.id!==result.id)]);setMessage(t('importCompleted',{count:result.importedRows}));setFile(null)}catch(e){setError(e instanceof Error?e.message:t('importFailed'))}finally{setBusy(false)}}
  const loadImportErrors=async(id:string)=>{setSelectedImportId(id);setLoadingErrors(true);setImportErrors([]);try{setImportErrors(await getImportErrors(id))}catch(e){setError(e instanceof Error?e.message:t('financeLoadError'))}finally{setLoadingErrors(false)}}
  const exportCsv=async()=>{if(!ownerId)return;setBusy(true);setError('');try{const end=new Date();const start=new Date(end);start.setUTCDate(start.getUTCDate()-exportRange);const rows=await getTransactions(start.toISOString(),end.toISOString());const header=['id','accountId','categoryId','description','amount','type','occurredAt','status'];const body=buildCsv(header,rows.map((x:FinanceTransaction)=>[x.id,x.accountId,x.categoryId,x.description,x.amount,x.type,x.occurredAt,x.status]));download(`kovian-transactions-${exportRange}d.csv`,body,'text/csv;charset=utf-8')}catch(e){setError(e instanceof Error?e.message:t('exportFailed'))}finally{setBusy(false)}}
  return <main className="page"><PageHeader title={t('importExportTitle')} description={t('importExportDesc')} />
    {error&&<div className="notice">{error}</div>}{message&&<div className="notice">{message}</div>}
    <div className="dashboard-grid"><section className="panel"><div className="section-title"><div><span className="eyebrow">{t('importTitle')}</span><h2>{t('importCsv')}</h2></div></div><div className="form-grid"><label className="field"><span>{t('account')}</span><select value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">{t('select')}</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.currency}</option>)}</select></label><label className="field"><span>{t('file')}</span><input type="file" accept=".csv,.txt,text/csv" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><button className="primary" type="button" disabled={busy||!file||!accountId} onClick={()=>void submit()}><FileUp size={16}/>{busy?t('saving'):t('importConfirm')}</button></div></section>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('exportTitle')}</span><h2>{t('exportCsv')}</h2></div></div><div className="form-grid"><label className="field"><span>{t('period')}</span><select value={exportRange} onChange={e=>setExportRange(Number(e.target.value))}><option value={30}>30 {t('days')}</option><option value={90}>90 {t('days')}</option><option value={180}>180 {t('days')}</option><option value={365}>365 {t('days')}</option></select></label><button className="secondary" type="button" disabled={busy||!ownerId} onClick={()=>void exportCsv()}><Download size={16}/>{t('downloadCsv')}</button></div></section></div>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('history')}</span><h2>{t('recentImports')}</h2></div><button type="button" className="icon-button" aria-label={t('refresh')} onClick={()=>{void getImportHistory().then(setHistory).catch(()=>setError(t('financeLoadError')))}}><RefreshCw size={16}/></button></div><div className="table-wrap"><table><thead><tr><th>{t('file')}</th><th>{t('status')}</th><th>{t('rows')}</th><th>{t('imported')}</th><th>{t('duplicates')}</th><th>{t('failed')}</th><th>{t('details')}</th></tr></thead><tbody>{history.map(item=><tr key={item.id}><td>{item.filename}</td><td>{item.status}</td><td>{item.totalRows}</td><td>{item.importedRows}</td><td>{item.duplicateRows}</td><td>{item.failedRows}</td><td>{item.failedRows>0?<button type="button" className="text-button" onClick={()=>void loadImportErrors(item.id)}>{t('details')}</button>:null}</td></tr>)}{!history.length&&<tr><td colSpan={7}>{t('noImports')}</td></tr>}</tbody></table></div></section>
    {selectedImportId&&<section className="panel"><div className="section-title"><div><span className="eyebrow">{t('importErrors')}</span><h2>{history.find(x=>x.id===selectedImportId)?.filename}</h2></div><button className="text-button" type="button" onClick={()=>{setSelectedImportId(null);setImportErrors([])}}>{t('close')}</button></div>{loadingErrors?<div className="empty-inline">{t('loading')}</div>:!importErrors.length?<div className="empty-inline">{t('noImportErrors')}</div>:<div className="table-wrap"><table><thead><tr><th>{t('row')}</th><th>{t('errorCode')}</th><th>{t('message')}</th></tr></thead><tbody>{importErrors.map((item,index)=><tr key={item.rowNumber+'-'+item.errorCode+'-'+index}><td>{item.rowNumber}</td><td>{item.errorCode}</td><td>{item.message}</td></tr>)}</tbody></table></div>}</section>}
  </main>
}
