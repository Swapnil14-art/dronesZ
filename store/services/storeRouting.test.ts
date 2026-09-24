import { describe, it, expect, beforeEach } from 'vitest';
import {
  slugify,
  clearStoreCache,
  cacheParent,
  getCachedParent,
  cacheChildren,
  getCachedChildren,
  cacheProductDetail,
  getCachedProductDetail,
  cacheMainCatalog,
  getCachedMainCatalog,
} from '../pages/PublicStore';
import { ProductDto } from './api';

describe('PublicStore in-memory routing cache', () => {
  beforeEach(() => {
    clearStoreCache();
  });

  const mockParent: ProductDto = {
    id: 10,
    name: 'Mars Series Cinematic Propulsion',
    price: 4999,
    quantity: 25,
    status: 'AVAILABLE',
    productType: 'PARENT',
  };

  const mockChild: ProductDto = {
    id: 101,
    name: 'Mars 2207 1850KV Motor',
    price: 1299,
    quantity: 15,
    status: 'AVAILABLE',
    productType: 'CHILD',
    parentId: 10,
  };

  it('slugifies product names accurately for URL slugs', () => {
    expect(slugify('Mars Series Cinematic Propulsion')).toBe('mars-series-cinematic-propulsion');
    expect(slugify('DZ-M2207 / 1850KV (Pro Edition)')).toBe('dz-m2207-1850kv-pro-edition');
  });

  it('caches parent series and enables instantaneous retrieval by slug and by id', () => {
    cacheParent(mockParent);

    // Retrieve by slug
    const bySlug = getCachedParent('mars-series-cinematic-propulsion');
    expect(bySlug).not.toBeNull();
    expect(bySlug?.id).toBe(10);
    expect(bySlug?.name).toBe('Mars Series Cinematic Propulsion');

    // Retrieve by numeric ID string
    const byId = getCachedParent('10');
    expect(byId).not.toBeNull();
    expect(byId?.id).toBe(10);

    // Retrieve by slug-id format
    const bySlugId = getCachedParent('mars-series-cinematic-propulsion-10');
    expect(bySlugId).not.toBeNull();
    expect(bySlugId?.id).toBe(10);
  });

  it('caches child variants and automatically indexes them for product detail retrieval', () => {
    cacheChildren(10, [mockChild]);

    const children = getCachedChildren(10);
    expect(children).toHaveLength(1);
    expect(children?.[0].id).toBe(101);

    // Child should also be indexed in product detail cache
    const productDetail = getCachedProductDetail(101);
    expect(productDetail).not.toBeNull();
    expect(productDetail?.name).toBe('Mars 2207 1850KV Motor');
  });

  it('indexes parent series automatically when caching main catalog', () => {
    cacheMainCatalog([mockParent, mockChild]);

    const catalog = getCachedMainCatalog();
    expect(catalog).toHaveLength(2);

    // Parent should be automatically indexed in parent map
    const parent = getCachedParent('mars-series-cinematic-propulsion');
    expect(parent).not.toBeNull();
    expect(parent?.id).toBe(10);
  });

  it('clears cache completely when clearStoreCache is called', () => {
    cacheParent(mockParent);
    cacheChildren(10, [mockChild]);
    cacheProductDetail(101, mockChild);

    clearStoreCache();

    expect(getCachedMainCatalog()).toBeNull();
    expect(getCachedParent('mars-series-cinematic-propulsion')).toBeNull();
    expect(getCachedChildren(10)).toBeNull();
    expect(getCachedProductDetail(101)).toBeNull();
  });
});
