import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform';

/**
 * Cross-platform storage abstraction
 * Uses Capacitor Preferences on native platforms, localStorage on web
 */

export interface StorageResult<T> {
  value: T | null;
  error?: Error;
}

/**
 * Get a value from storage
 */
export const getItem = async <T = string>(key: string): Promise<StorageResult<T>> => {
  try {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      if (value === null) {
        return { value: null };
      }
      try {
        return { value: JSON.parse(value) as T };
      } catch {
        return { value: value as unknown as T };
      }
    } else {
      const value = localStorage.getItem(key);
      if (value === null) {
        return { value: null };
      }
      try {
        return { value: JSON.parse(value) as T };
      } catch {
        return { value: value as unknown as T };
      }
    }
  } catch (error) {
    return { value: null, error: error as Error };
  }
};

/**
 * Set a value in storage
 */
export const setItem = async <T>(key: string, value: T): Promise<boolean> => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (isNativePlatform()) {
      await Preferences.set({ key, value: stringValue });
    } else {
      localStorage.setItem(key, stringValue);
    }
    return true;
  } catch (error) {
    console.error('Storage setItem error:', error);
    return false;
  }
};

/**
 * Remove a value from storage
 */
export const removeItem = async (key: string): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
    return true;
  } catch (error) {
    console.error('Storage removeItem error:', error);
    return false;
  }
};

/**
 * Clear all storage
 */
export const clear = async (): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
    return true;
  } catch (error) {
    console.error('Storage clear error:', error);
    return false;
  }
};

/**
 * Get all keys from storage
 */
export const keys = async (): Promise<string[]> => {
  try {
    if (isNativePlatform()) {
      const { keys } = await Preferences.keys();
      return keys;
    } else {
      return Object.keys(localStorage);
    }
  } catch (error) {
    console.error('Storage keys error:', error);
    return [];
  }
};

/**
 * Sync wrapper for localStorage-only operations (web compatibility)
 * Use for non-critical operations where async is not required
 */
export const syncStorage = {
  getItem: <T = string>(key: string): T | null => {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch {
      return null;
    }
  },
  
  setItem: <T>(key: string, value: T): boolean => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch {
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};
