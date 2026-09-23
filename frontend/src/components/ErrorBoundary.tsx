import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props={children:ReactNode}
type State={hasError:boolean}

export default class ErrorBoundary extends Component<Props,State>{
  state:State={hasError:false}
  static getDerivedStateFromError():State{return {hasError:true}}
  componentDidCatch(error:Error,info:ErrorInfo){console.error('KOVIAN UI error',error,info)}
  render(){
    if(!this.state.hasError)return this.props.children
    const pt=document.documentElement.lang.toLowerCase().startsWith('pt')
    return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,fontFamily:'Inter,system-ui,sans-serif',background:'#07110f',color:'#f5f7f7'}} role="alert"><section style={{width:'min(520px,100%)',border:'1px solid #20322c',borderRadius:16,padding:24,background:'#0d1916'}}><strong style={{display:'block',fontSize:18}}>{pt?'O KOVIAN encontrou um erro inesperado.':'KOVIAN encountered an unexpected error.'}</strong><p style={{margin:'8px 0 18px',color:'#91a7b5',lineHeight:1.5}}>{pt?'A interface foi protegida. Recarregue a página para continuar.':'The interface was protected. Reload the page to continue.'}</p><button type="button" onClick={()=>window.location.reload()} style={{minHeight:44,border:0,borderRadius:10,padding:'10px 14px',fontWeight:800,cursor:'pointer',background:'#25d39b',color:'#06100d'}}>{pt?'Recarregar':'Reload'}</button></section></main>
  }
}
