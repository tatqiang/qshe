import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import debug utilities for development
import './utils/debugDatabase';
// Import iOS PWA debugger for production debugging
import './utils/iosPwaDebugger';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
