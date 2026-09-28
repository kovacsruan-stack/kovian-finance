import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react'

const gestaoUrl = (import.meta.env.VITE_KOVIAN_GESTAO_URL || 'https://kovian-gestao-33xv91.v2.appdeploy.ai/').trim()

export default function GestaoPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (loaded) return
    setSlow(false)
    const timeout = window.setTimeout(() => setSlow(true), 12000)
    return () => window.clearTimeout(timeout)
  }, [reloadKey, loaded])

  const refresh = () => {
    setLoaded(false)
    setSlow(false)
    setReloadKey(value => value + 1)
  }

  return (
    <main className="page kovian-gestao-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">KOVIAN FINANCE · OPERAÇÃO</div>
          <h1>Gestão</h1>
          <p>Alunos, modalidades, aulas, pagamentos e relatórios.</p>
        </div>
        <div className="page-actions">
          <a className="secondary" href={gestaoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} /> Abrir em nova aba
          </a>
          <button className="secondary" type="button" onClick={refresh}>
            <RefreshCw size={16} /> Recarregar módulo
          </button>
        </div>
      </header>

      <section className="panel gestao-embed-notice" aria-label="Informações sobre o módulo Gestão">
        <span className="gestao-notice-icon"><ShieldCheck size={18} /></span>
        <div>
          <strong>Módulo Gestão</strong>
          <p>Esta área abre o módulo operacional existente. A autenticação e os dados permanecem no serviço de Gestão.</p>
        </div>
      </section>

      <section className="gestao-frame-wrap" aria-label="Aplicação KOVIAN Gestão" aria-busy={!loaded}>
        {!loaded && <div className="gestao-frame-status" role="status">
          <span className="gestao-frame-status-icon"><RefreshCw size={18} /></span>
          <strong>{slow ? 'O módulo está demorando para responder' : 'Conectando ao módulo Gestão…'}</strong>
          <span>{slow ? 'O provedor pode estar bloqueando a incorporação ou exigindo uma sessão. Abra em uma nova aba para continuar.' : 'Aguarde enquanto a aplicação é carregada.'}</span>
          {slow && <div className="gestao-frame-status-actions">
            <a className="primary" href={gestaoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Abrir Gestão</a>
            <button className="secondary" type="button" onClick={refresh}><RefreshCw size={15} /> Tentar novamente</button>
          </div>}
        </div>}
        <iframe
          key={reloadKey}
          id="kovian-gestao-frame"
          title="KOVIAN Gestão"
          src={gestaoUrl}
          loading="eager"
          onLoad={() => setLoaded(true)}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="clipboard-read; clipboard-write"
        />
      </section>
      <p className="gestao-frame-help"><AlertTriangle size={13} /> A incorporação depende das políticas de segurança do provedor. Se a tela não aparecer, abra o módulo em uma nova aba.</p>
    </main>
  )
}
