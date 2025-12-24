
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('SmartStorage 3D: Iniciando carga de módulos...');

// Registro del Service Worker para PWA (Ruta absoluta para evitar 404 en subrutas)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('SmartStorage 3D: SW listo.', reg.scope))
      .catch(err => console.warn('SmartStorage 3D: SW no disponible.', err));
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('SmartStorage 3D: Renderizado inicial completado.');
  } catch (error) {
    console.error('SmartStorage 3D: Error crítico en el arranque:', error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error al iniciar la aplicación. Por favor, recarga la página.</div>`;
  }
}
