/**
 * Storage Abstraction - Capacitor Preferences / localStorage
 * 
 * Abstração unificada para armazenamento persistente.
 * Usa Capacitor Preferences no mobile e localStorage na web.
 */

import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform';

// ============================================
// TYPES
// ============================================

export interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Salva um valor no storage
 */
export const setItem = async <T>(key: string, value: T): Promise<void> => {
  const item: StorageItem<T> = {
    value,
    timestamp: Date.now(),
  };

  const serialized = JSON.stringify(item);

  if (isNativePlatform()) {
    await Preferences.set({ key, value: serialized });
  } else {
    localStorage.setItem(key, serialized);
  }
};

/**
 * Recupera um valor do storage
 */
export const getItem = async <T>(key: string): Promise<T | null> => {
  try {
    let serialized: string | null;

    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      serialized = value;
    } else {
      serialized = localStorage.getItem(key);
    }

    if (!serialized) return null;

    const item: StorageItem<T> = JSON.parse(serialized);

    // Check expiry
    if (item.expiry && Date.now() > item.timestamp + item.expiry) {
      await removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return null;
  }
};

/**
 * Remove um item do storage
 */
export const removeItem = async (key: string): Promise<void> => {
  if (isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

/**
 * Limpa todo o storage
 */
export const clear = async (): Promise<void> => {
  if (isNativePlatform()) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
};

/**
 * Lista todas as chaves do storage
 */
export const keys = async (): Promise<string[]> => {
  if (isNativePlatform()) {
    const { keys } = await Preferences.keys();
    return keys;
  } else {
    return Object.keys(localStorage);
  }
};

/**
 * Salva com expiração (TTL em milliseconds)
 */
export const setItemWithExpiry = async <T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> => {
  const item: StorageItem<T> = {
    value,
    timestamp: Date.now(),
    expiry: ttl,
  };

  const serialized = JSON.stringify(item);

  if (isNativePlatform()) {
    await Preferences.set({ key, value: serialized });
  } else {
    localStorage.setItem(key, serialized);
  }
};

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Salva um objeto JSON
 */
export const setJSON = async <T extends object>(key: string, value: T): Promise<void> => {
  return setItem(key, value);
};

/**
 * Recupera um objeto JSON
 */
export const getJSON = async <T extends object>(key: string): Promise<T | null> => {
  return getItem<T>(key);
};

/**
 * Verifica se uma chave existe
 */
export const hasKey = async (key: string): Promise<boolean> => {
  const value = await getItem(key);
  return value !== null;
};

/**
 * Atualiza um item existente (merge)
 */
export const updateItem = async <T extends object>(
  key: string,
  updates: Partial<T>
): Promise<T | null> => {
  const current = await getItem<T>(key);
  if (!current) return null;

  const updated = { ...current, ...updates };
  await setItem(key, updated);
  return updated;
};

// ============================================
// STORAGE KEYS CONSTANTS
// ============================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  LAST_SYNC: 'last_sync',
  OFFLINE_QUEUE: 'offline_queue',
  CACHE_PREFIX: 'cache_',
} as const;

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Salva dados em cache com TTL padrão de 5 minutos
 */
export const cacheData = async <T>(
  key: string,
  data: T,
  ttl: number = 5 * 60 * 1000
): Promise<void> => {
  const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
  return setItemWithExpiry(cacheKey, data, ttl);
};

/**
 * Recupera dados do cache
 */
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
  return getItem<T>(cacheKey);
};

/**
 * Invalida cache por chave
 */
export const invalidateCache = async (key: string): Promise<void> => {
  const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
  return removeItem(cacheKey);
};

/**
 * Limpa todo o cache
 */
export const clearCache = async (): Promise<void> => {
  const allKeys = await keys();
  const cacheKeys = allKeys.filter((k) => k.startsWith(STORAGE_KEYS.CACHE_PREFIX));

  await Promise.all(cacheKeys.map((k) => removeItem(k)));
};
