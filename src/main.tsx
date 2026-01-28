import { createRoot } from "react-dom/client";
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import App from "./App.tsx";
import "./index.css";

// Inicializar PWA Elements para Capacitor
defineCustomElements(window);

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed, but app still works
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
