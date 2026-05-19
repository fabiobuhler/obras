import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from '@/components/ErrorBoundary'
const params = new URLSearchParams(window.location.search);
const redirect = params.get('redirect');

if (redirect) {
  const cleanRedirect = redirect.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  window.history.replaceState(null, '', `${base}${cleanRedirect}`);
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
