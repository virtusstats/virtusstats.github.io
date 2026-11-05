import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { LanguageProvider } from './context/LanguageContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)

// Fade out the splash from index.html once the app has mounted; keep it up at least 700 ms so it does not just flash.
const splash = document.getElementById('splash');
setTimeout(() => {
  splash?.classList.add('hide');
  setTimeout(() => splash?.remove(), 400);
}, Math.max(0, 700 - performance.now()));
