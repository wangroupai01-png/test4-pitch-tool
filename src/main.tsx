import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
      <PwaUpdatePrompt />
    </AppErrorBoundary>
  </StrictMode>,
)
