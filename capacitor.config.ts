import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b57cd4b811a642739262ee0200dad886',
  appName: 'Painel Conto',
  webDir: 'dist',
  
  // Server config for development hot-reload
  server: {
    url: 'https://b57cd4b8-11a6-4273-9262-ee0200dad886.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  
  // Android-specific configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  
  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  },
  
  // Plugins configuration
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
      style: 'DARK',
      backgroundColor: '#141414'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
