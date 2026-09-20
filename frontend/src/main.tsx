import React from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import App from './App'
import './index.css'

if('serviceWorker' in navigator && window.location.protocol === 'https:'){
  window.addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js',{scope:'/'})})
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>)
