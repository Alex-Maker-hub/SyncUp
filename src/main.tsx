import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ReactGA from 'react-ga4';
import * as Sentry from "@sentry/react"; // 1. Imported Sentry
import App from './App.tsx';
import './index.css';

// 2. Initialized Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://a55623c718f7a03a10b97f3241feef2a@o4511500705398784.ingest.us.sentry.io/4511500712607744",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

ReactGA.initialize('G-CEZEG72V6E');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
  
);