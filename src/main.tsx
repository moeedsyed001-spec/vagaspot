import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { AppRoutes } from './app/routes';
import { registerPwaServiceWorker } from './lib/pwa';
import './styles/index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

registerPwaServiceWorker();

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
