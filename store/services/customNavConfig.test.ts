import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDefaultCustomNavConfig,
  loadCustomNavConfig,
  saveCustomNavConfig,
  CustomNavConfig,
} from './customNavConfig';

describe('customNavConfig', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStore[key];
      }),
      clear: vi.fn(() => {
        mockStore = {};
      }),
    };

    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('returns default config when storage is empty', () => {
    const config = loadCustomNavConfig();
    expect(config).toEqual({
      motorsTalkToUsUrl: '/contact',
      propellersTalkToUsUrl: '/contact',
    });
  });

  it('saves and loads customized URLs correctly', () => {
    const customConfig: CustomNavConfig = {
      motorsTalkToUsUrl: 'https://example.com/motors-inquiry',
      propellersTalkToUsUrl: '/contact?topic=propellers',
    };

    saveCustomNavConfig(customConfig);
    const loaded = loadCustomNavConfig();

    expect(loaded.motorsTalkToUsUrl).toBe('https://example.com/motors-inquiry');
    expect(loaded.propellersTalkToUsUrl).toBe('/contact?topic=propellers');
  });

  it('falls back gracefully on invalid JSON', () => {
    mockStore['dronesz_custom_nav_config'] = 'invalid json string';
    const loaded = loadCustomNavConfig();
    expect(loaded).toEqual(getDefaultCustomNavConfig());
  });

  it('merges partial config with defaults', () => {
    mockStore['dronesz_custom_nav_config'] = JSON.stringify({
      motorsTalkToUsUrl: '/custom-motors',
    });
    const loaded = loadCustomNavConfig();
    expect(loaded.motorsTalkToUsUrl).toBe('/custom-motors');
    expect(loaded.propellersTalkToUsUrl).toBe('/contact');
  });
});
