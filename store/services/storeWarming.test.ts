import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  clearStoreCache,
  cacheMainCatalog,
  getCachedMainCatalog,
  isMainCatalogFresh,
  cacheChildren,
  getCachedChildren,
  isChildrenFresh,
  cacheParent,
  getCachedParent,
  cacheProductDetail,
  getCachedProductDetail,
  STORE_CACHE_TTL_MS,
} from './storeCache';
import {
  shouldSkipWarming,
  extractProductImageUrl,
  extractWarmingImageUrls,
  preloadImagesBounded,
  warmStoreDataAndImages,
} from './storeWarming';
import * as api from './api';
import { ProductDto } from './api';

describe('Store Cache and Background Warming System', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    clearStoreCache();
    vi.restoreAllMocks();

    // Mock browser environment in Node test runtime
    (globalThis as any).window = {
      location: { hostname: 'localhost' },
    };
    (globalThis as any).document = {
      visibilityState: 'visible',
    };
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });
    (globalThis as any).Image = class {
      src = '';
      decoding = 'async';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    delete (globalThis as any).Image;
  });

  const mockParent: ProductDto = {
    id: 1,
    name: 'Frames Series',
    price: 0,
    quantity: 0,
    status: 'AVAILABLE',
    productType: 'PARENT',
    image: '/api/products/1/images/10?v=123',
    primaryImage: {
      id: 10,
      productId: 1,
      url: '/api/products/1/images/10?v=123',
      isPrimary: true,
      displayOrder: 0,
    },
  };

  const mockChild1: ProductDto = {
    id: 101,
    name: 'Apex 5" Freestyle Frame',
    price: 4500,
    quantity: 12,
    status: 'AVAILABLE',
    productType: 'CHILD',
    parentId: 1,
    image: '/api/products/101/image',
  };

  const mockChild2: ProductDto = {
    id: 102,
    name: 'Cinewhoop 3.5" Ducted Frame',
    price: 5200,
    quantity: 5,
    status: 'AVAILABLE',
    productType: 'CHILD',
    parentId: 1,
    primaryImage: {
      id: 12,
      productId: 102,
      url: '/api/products/102/images/12?v=456',
      isPrimary: true,
      displayOrder: 0,
    },
  };

  describe('storeCache Freshness & Invalidation', () => {
    it('reports main catalog as not fresh when empty', () => {
      expect(isMainCatalogFresh()).toBe(false);
      expect(getCachedMainCatalog()).toBeNull();
    });

    it('reports main catalog as fresh immediately after caching', () => {
      cacheMainCatalog([mockParent]);
      expect(isMainCatalogFresh()).toBe(true);
      expect(getCachedMainCatalog()).toHaveLength(1);
    });

    it('invalidates main catalog when maxAgeMs is exceeded', () => {
      cacheMainCatalog([mockParent]);
      expect(isMainCatalogFresh()).toBe(true);

      // Verify that checking with maxAge = 0 considers it expired
      expect(isMainCatalogFresh(0)).toBe(false);
    });

    it('manages children freshness and indexing accurately', () => {
      expect(isChildrenFresh(1)).toBe(false);
      expect(getCachedChildren(1)).toBeNull();

      cacheChildren(1, [mockChild1, mockChild2]);
      expect(isChildrenFresh(1)).toBe(true);
      expect(getCachedChildren(1)).toHaveLength(2);

      // Verify children are automatically indexed in product detail cache
      expect(getCachedProductDetail(101)?.name).toBe('Apex 5" Freestyle Frame');
      expect(getCachedProductDetail(102)?.name).toBe('Cinewhoop 3.5" Ducted Frame');

      // Test expiration with maxAge = 0
      expect(isChildrenFresh(1, 0)).toBe(false);
    });

    it('completely clears all data, parents, children, and timestamps on clearStoreCache', () => {
      cacheMainCatalog([mockParent]);
      cacheChildren(1, [mockChild1]);
      cacheProductDetail(999, { id: 999, name: 'Special Item', price: 100, quantity: 1, status: 'AVAILABLE', productType: 'STANDALONE' });

      clearStoreCache();
      expect(isMainCatalogFresh()).toBe(false);
      expect(getCachedMainCatalog()).toBeNull();
      expect(isChildrenFresh(1)).toBe(false);
      expect(getCachedChildren(1)).toBeNull();
      expect(getCachedParent(1)).toBeNull();
      expect(getCachedProductDetail(999)).toBeNull();
    });
  });

  describe('shouldSkipWarming Safeguards', () => {
    it('returns false under normal browser conditions', () => {
      expect(shouldSkipWarming()).toBe(false);
    });

    it('skips warming in SSR environment (when window is undefined)', () => {
      delete (globalThis as any).window;
      expect(shouldSkipWarming()).toBe(true);
    });

    it('skips warming when document is hidden', () => {
      (globalThis as any).document.visibilityState = 'hidden';
      expect(shouldSkipWarming()).toBe(true);
    });

    it('skips warming when saveData mode is active', () => {
      (globalThis as any).navigator.connection = { saveData: true, effectiveType: '4g' };
      expect(shouldSkipWarming()).toBe(true);
    });

    it('skips warming when effectiveType is slow-2g or 2g', () => {
      (globalThis as any).navigator.connection = { saveData: false, effectiveType: '2g' };
      expect(shouldSkipWarming()).toBe(true);

      (globalThis as any).navigator.connection = { saveData: false, effectiveType: 'slow-2g' };
      expect(shouldSkipWarming()).toBe(true);

      (globalThis as any).navigator.connection = { saveData: false, effectiveType: '4g' };
      expect(shouldSkipWarming()).toBe(false);
    });
  });

  describe('extractWarmingImageUrls', () => {
    it('extracts primary image URLs for parents and children and deduplicates', () => {
      const parents = [mockParent];
      const childrenMap = { 1: [mockChild1, mockChild2] };

      const urls = extractWarmingImageUrls(parents, childrenMap, 8);
      expect(urls).toHaveLength(3);
      // Parent's primary image
      expect(urls[0]).toBe('/api/products/1/images/10?v=123');
      // Child 1's direct image
      expect(urls[1]).toBe('/api/products/101/image');
      // Child 2's primary image
      expect(urls[2]).toBe('/api/products/102/images/12?v=456');
    });

    it('respects maxImages constraint and skips archived items', () => {
      const archivedChild: ProductDto = {
        id: 103,
        name: 'Archived Frame',
        price: 3000,
        quantity: 0,
        status: 'ARCHIVED',
        productType: 'CHILD',
        parentId: 1,
        image: '/api/products/103/image',
      };

      const parents = [mockParent];
      const childrenMap = { 1: [mockChild1, archivedChild, mockChild2] };

      // Limit to 2 images
      const urls = extractWarmingImageUrls(parents, childrenMap, 2);
      expect(urls).toHaveLength(2);
      expect(urls).not.toContain('/api/products/103/image');
    });

    it('skips blob and data URLs', () => {
      const blobParent: ProductDto = {
        ...mockParent,
        image: 'blob:http://localhost:3000/123-abc',
        primaryImage: undefined,
      };
      const urls = extractWarmingImageUrls([blobParent], {}, 5);
      expect(urls).toHaveLength(0);
    });
  });

  describe('preloadImagesBounded', () => {
    it('handles empty image list gracefully without doing work', async () => {
      const count = await preloadImagesBounded([]);
      expect(count).toBe(0);
    });

    it('respects AbortSignal by halting preloading', async () => {
      const controller = new AbortController();
      controller.abort();

      const count = await preloadImagesBounded(
        ['/api/products/1/image', '/api/products/2/image'],
        { signal: controller.signal }
      );
      expect(count).toBe(0);
    });

    it('successfully preloads images within concurrency bounds', async () => {
      const count = await preloadImagesBounded(
        ['/api/products/1/images/10?v=123', '/api/products/101/image'],
        { concurrency: 2, timeoutMs: 500 }
      );
      expect(count).toBe(2);
    });
  });

  describe('warmStoreDataAndImages full workflow', () => {
    it('successfully fetches and caches catalog and parent children', async () => {
      const fetchPublicProductsSpy = vi.spyOn(api, 'fetchPublicProducts').mockResolvedValue({
        content: [mockParent],
        page: 0,
        size: 50,
        totalElements: 1,
        totalPages: 1,
      });

      const fetchPublicChildProductsSpy = vi.spyOn(api, 'fetchPublicChildProducts').mockResolvedValue([
        mockChild1,
        mockChild2,
      ]);

      const result = await warmStoreDataAndImages({ force: true, maxParents: 2, maxImages: 5 });

      expect(result.skipped).toBe(false);
      expect(result.catalogWarmed).toBe(true);
      expect(result.childrenCount).toBe(2);

      // Verify cached in storeCache
      expect(isMainCatalogFresh()).toBe(true);
      expect(getCachedMainCatalog()).toHaveLength(1);
      expect(isChildrenFresh(1)).toBe(true);
      expect(getCachedChildren(1)).toHaveLength(2);

      expect(fetchPublicProductsSpy).toHaveBeenCalledTimes(1);
      expect(fetchPublicChildProductsSpy).toHaveBeenCalledWith(1);
    });

    it('avoids re-fetching if catalog and children are already fresh', async () => {
      cacheMainCatalog([mockParent]);
      cacheChildren(1, [mockChild1, mockChild2]);

      const fetchPublicProductsSpy = vi.spyOn(api, 'fetchPublicProducts');
      const fetchPublicChildProductsSpy = vi.spyOn(api, 'fetchPublicChildProducts');

      const result = await warmStoreDataAndImages({ force: false });

      // Skips because lastWarmedTimestamp or freshness is valid
      expect(fetchPublicProductsSpy).not.toHaveBeenCalled();
      expect(fetchPublicChildProductsSpy).not.toHaveBeenCalled();
    });

    it('handles network errors silently without throwing', async () => {
      vi.spyOn(api, 'fetchPublicProducts').mockRejectedValue(new Error('Network error (503)'));

      // Must not throw an unhandled exception
      const result = await warmStoreDataAndImages({ force: true });
      expect(result.catalogWarmed).toBe(false);
      expect(result.childrenCount).toBe(0);
      expect(result.skipped).toBe(true);
    });
  });
});
