import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for cross-platform compatibility
 */

/**
 * Check if running on a native platform (iOS/Android)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on web
 */
export const isWeb = (): boolean => {
  return !Capacitor.isNativePlatform();
};

/**
 * Get the current platform name
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if a plugin is available
 */
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};

/**
 * Platform-specific actions handler
 */
export const runPlatformSpecific = <T>(options: {
  ios?: () => T;
  android?: () => T;
  web?: () => T;
  default?: () => T;
}): T | undefined => {
  const platform = getPlatform();
  
  if (platform === 'ios' && options.ios) {
    return options.ios();
  }
  
  if (platform === 'android' && options.android) {
    return options.android();
  }
  
  if (platform === 'web' && options.web) {
    return options.web();
  }
  
  if (options.default) {
    return options.default();
  }
  
  return undefined;
};
