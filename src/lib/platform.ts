/**
 * Platform Detection - Capacitor/PWA
 * 
 * Utilitários para detectar a plataforma de execução.
 * Distingue entre web, PWA instalado e app nativo (Capacitor).
 */

import { Capacitor } from '@capacitor/core';

// ============================================
// PLATFORM TYPES
// ============================================

export type Platform = 'web' | 'ios' | 'android' | 'pwa';

export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isWeb: boolean;
  isPWA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Verifica se está rodando como app nativo (Capacitor)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Verifica se está rodando na web
 */
export const isWeb = (): boolean => {
  return !Capacitor.isNativePlatform();
};

/**
 * Verifica se está rodando como PWA instalado
 */
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for display-mode: standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for iOS Safari standalone mode
  const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  
  return (isStandalone || isIOSStandalone) && !isNativePlatform();
};

/**
 * Obtém a plataforma atual
 */
export const getPlatform = (): Platform => {
  if (isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    return platform === 'ios' ? 'ios' : 'android';
  }
  
  if (isPWA()) {
    return 'pwa';
  }
  
  return 'web';
};

/**
 * Verifica se está rodando no iOS
 */
export const isIOS = (): boolean => {
  if (isNativePlatform()) {
    return Capacitor.getPlatform() === 'ios';
  }
  
  // Check for iOS browser
  if (typeof navigator === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Verifica se está rodando no Android
 */
export const isAndroid = (): boolean => {
  if (isNativePlatform()) {
    return Capacitor.getPlatform() === 'android';
  }
  
  // Check for Android browser
  if (typeof navigator === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
};

/**
 * Verifica se está em um dispositivo móvel
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth < 768 || isIOS() || isAndroid();
};

/**
 * Verifica se está em um desktop
 */
export const isDesktop = (): boolean => {
  return !isMobile();
};

/**
 * Obtém informações completas da plataforma
 */
export const getPlatformInfo = (): PlatformInfo => {
  const platform = getPlatform();
  
  return {
    platform,
    isNative: isNativePlatform(),
    isWeb: isWeb(),
    isPWA: isPWA(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isMobile: isMobile(),
    isDesktop: isDesktop(),
  };
};

/**
 * Obtém a versão do app (se disponível)
 */
export const getAppVersion = (): string => {
  // In native, this would come from Capacitor App plugin
  // For web/PWA, we use the build version
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
};

/**
 * Verifica se suporta notificações push
 */
export const supportsPushNotifications = (): boolean => {
  if (isNativePlatform()) return true;
  
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Verifica se suporta geolocalização
 */
export const supportsGeolocation = (): boolean => {
  return 'geolocation' in navigator;
};

/**
 * Verifica se suporta câmera
 */
export const supportsCamera = (): boolean => {
  return isNativePlatform() || ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
};
