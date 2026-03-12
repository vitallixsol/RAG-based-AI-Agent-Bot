import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111520',
            color: '#dde4f5',
            border: '1px solid #1c2438',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '13px',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#00d9a3', secondary: '#111520' } },
          error: { iconTheme: { primary: '#ff6b6b', secondary: '#111520' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
