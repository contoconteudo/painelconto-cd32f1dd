import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b57cd4b811a642739262ee0200dad886',
  appName: 'painelconto',
  webDir: 'dist',
  
  // Configuração do servidor para desenvolvimento com hot-reload
  // IMPORTANTE: Remova ou comente o bloco 'server' para build de produção
  server: {
    url: 'https://b57cd4b8-11a6-4273-9262-ee0200dad886.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  
  // Configurações Android
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false // Defina como true para debug
  },
  
  // Plugins nativos
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#141414',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#141414'
    }
  }
};

export default config;
