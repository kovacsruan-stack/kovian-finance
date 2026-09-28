import { ExternalLink, RefreshCw, ShieldCheck, Users } from 'lucide-react'

const gestaoUrl = (import.meta.env.VITE_KOVIAN_GESTAO_URL || 'https://kovian-gestao-33xv91.v2.appdeploy.ai/').trim()

export default function GestaoPage() {
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
          <button className="secondary" type="button" onClick={() => document.getElementById('kovian-gestao-frame') && (document.getElementById('kovian-gestao-frame') as HTMLIFrameElement).contentWindow?.location.reload()}>
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>
      </header>

      <section className="panel gestao-embed-notice" aria-label="Informações sobre o módulo Gestão">
        <span className="gestao-notice-icon"><ShieldCheck size={18} /></span>
        <div>
          <strong>Módulo Gestão integrado à navegação do Finance</strong>
          <p>O módulo mantém sua autenticação e seus dados atuais. Entre com a conta administradora se solicitado.</p>
        </div>
      </section>

      <section className="gestao-frame-wrap" aria-label="Aplicação KOVIAN Gestão">
        <div className="gestao-frame-loading"><Users size={18} /> Carregando módulo Gestão…</div>
        <iframe
          id="kovian-gestao-frame"
          title="KOVIAN Gestão"
          src={gestaoUrl}
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="clipboard-read; clipboard-write"
        />
      </section>
      <p className="gestao-frame-help">Se o módulo não carregar por uma restrição de incorporação do provedor, use “Abrir em nova aba”.</p>
    </main>
  )
}
