import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Use a ref to track the current value to avoid stale closures
  const storedValueRef = useRef<T>(storedValue);
  useEffect(() => {
    storedValueRef.current = storedValue;
  }, [storedValue]);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          // Dispatch custom event so other components can react
          window.dispatchEvent(new CustomEvent("local-storage-update", { detail: { key } }));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };

    const handleLocalUpdate = (event: CustomEvent<{ key: string }>) => {
      if (event.detail.key === key) {
        setStoredValue(readValue());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage-update", handleLocalUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage-update", handleLocalUpdate as EventListener);
    };
  }, [key, readValue]);

  return [storedValue, setValue] as const;
}
