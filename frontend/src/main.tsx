import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app';
import './styles/global.css';

// Note: Strict Mode is disabled due to incompatibility with Leaflet's map container
// initialization in React 19. Leaflet doesn't handle React's double-mount behavior
// in development mode. Re-enable once Leaflet has better React 19 support.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <App />
  </BrowserRouter>
);
