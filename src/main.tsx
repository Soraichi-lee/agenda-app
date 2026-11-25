import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { CloudProvider } from './lib/cloud'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CloudProvider>
      <App />
    </CloudProvider>
  </React.StrictMode>,
)
