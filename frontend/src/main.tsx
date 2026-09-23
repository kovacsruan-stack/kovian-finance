import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './lib/queryClient'
import './i18n/config'
import './index.css'


class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[KOVIAN] render error', error, info.componentStack) }
  render() {
    if (!this.state.error) return this.props.children
    const english = typeof document !== 'undefined' && document.documentElement.lang === 'en'
    return <main className="page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><section className="panel" style={{ maxWidth: 680, width: '100%' }}><span className="eyebrow">KOVIAN</span><h1>{english ? 'Something went wrong' : 'Ocorreu um erro inesperado'}</h1><p>{english ? 'The application was protected. Reload to continue.' : 'A aplicação foi protegida. Recarregue para continuar.'}</p>{import.meta.env.DEV&&<pre style={{ whiteSpace: 'pre-wrap', opacity: .7 }}>{this.state.error.message}</pre>}<button type="button" className="primary" onClick={() => window.location.reload()}>{english ? 'Reload' : 'Recarregar'}</button></section></main>
  }
}

if ('serviceWorker' in navigator && window.location.protocol === 'https:') window.addEventListener('load', () => { void navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }) })

createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={queryClient}><BrowserRouter basename="/app"><AppErrorBoundary><App /></AppErrorBoundary></BrowserRouter></QueryClientProvider></StrictMode>,
)
