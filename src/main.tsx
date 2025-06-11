import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

function initCollectorApp() {
  const container = document.getElementById('zone-snap-filter-app');
  if (!container) {
    console.error('[Collector App] Container "#zone-snap-filter-app" not found');
    return;
  }
  createRoot(container).render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollectorApp);
} else {
  initCollectorApp();
}