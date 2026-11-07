import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ContentContext } from './lib/content-context'

let initialContent = {}
try { initialContent = JSON.parse(document.getElementById('initial-content')?.textContent || '{}') } catch { /* Fetch public content normally if unavailable. */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ContentContext.Provider value={initialContent}><App /></ContentContext.Provider>
    </BrowserRouter>
  </React.StrictMode>,
)
