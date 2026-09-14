/**
 * Custom Navigation Configuration Service — localStorage-based configuration
 * for dynamic "Talk to us" destinations (Motors & Propellers).
 *
 * Provides real-time synchronization between the Admin Portal and public navigation.
 */
import { useEffect, useState } from 'react';

export interface CustomNavConfig {
  motorsTalkToUsUrl: string;
  propellersTalkToUsUrl: string;
}

const STORAGE_KEY = 'dronesz_custom_nav_config';
const EVENT_KEY = 'dronesz_custom_nav_updated';

export function getDefaultCustomNavConfig(): CustomNavConfig {
  return {
    motorsTalkToUsUrl: '/contact',
    propellersTalkToUsUrl: '/contact',
  };
}

export function loadCustomNavConfig(): CustomNavConfig {
  if (typeof window === 'undefined') return getDefaultCustomNavConfig();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CustomNavConfig>;
      return {
        ...getDefaultCustomNavConfig(),
        ...parsed,
      };
    }
  } catch {
    // Corrupted data fallback
  }
  return getDefaultCustomNavConfig();
}

export function saveCustomNavConfig(config: CustomNavConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // Broadcast update event to all instances on the same page
  window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: config }));
}

/**
 * React hook to reactively subscribe to CustomNavConfig updates
 */
export function useCustomNavConfig(): CustomNavConfig {
  const [config, setConfig] = useState<CustomNavConfig>(getDefaultCustomNavConfig());

  useEffect(() => {
    // Initial client-side load
    setConfig(loadCustomNavConfig());

    const handleUpdate = () => {
      setConfig(loadCustomNavConfig());
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return config;
}
