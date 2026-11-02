import { ProductDto } from './api';

export const STORE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes freshness window

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Module-level in-memory cache to ensure instant, zero-flicker transitions and back navigation
let cachedMainCatalog: ProductDto[] | null = null;
let cachedMainCatalogTimestamp: number = 0;

const cachedParentMap = new Map<string, ProductDto>();
const cachedChildrenMap = new Map<number, ProductDto[]>();
const cachedChildrenTimestamps = new Map<number, number>();
const cachedProductDetailMap = new Map<number, ProductDto>();

export function clearStoreCache(): void {
  cachedMainCatalog = null;
  cachedMainCatalogTimestamp = 0;
  cachedParentMap.clear();
  cachedChildrenMap.clear();
  cachedChildrenTimestamps.clear();
  cachedProductDetailMap.clear();
}

/**
 * Returns true if the main catalog cache exists and was fetched within the freshness period.
 */
export function isMainCatalogFresh(maxAgeMs: number = STORE_CACHE_TTL_MS): boolean {
  if (!cachedMainCatalog || cachedMainCatalog.length === 0) return false;
  return Date.now() - cachedMainCatalogTimestamp < maxAgeMs;
}

export function getCachedMainCatalog(): ProductDto[] | null {
  return cachedMainCatalog;
}

export function cacheMainCatalog(products: ProductDto[]): void {
  cachedMainCatalog = products;
  cachedMainCatalogTimestamp = Date.now();
  for (const p of products) {
    if (p.productType === 'PARENT') {
      cacheParent(p);
    }
  }
}

export function getCachedParent(slugOrId: string | number): ProductDto | null {
  const key = String(slugOrId).toLowerCase().trim();
  if (cachedParentMap.has(key)) {
    return cachedParentMap.get(key)!;
  }
  for (const p of cachedParentMap.values()) {
    if (
      slugify(p.name) === key ||
      `${slugify(p.name)}-${p.id}` === key ||
      String(p.id) === key
    ) {
      return p;
    }
  }
  return null;
}

export function cacheParent(parent: ProductDto): void {
  cachedParentMap.set(String(parent.id), parent);
  cachedParentMap.set(slugify(parent.name), parent);
  cachedParentMap.set(`${slugify(parent.name)}-${parent.id}`, parent);
}

/**
 * Returns true if child products for the given parent are cached and fresh.
 */
export function isChildrenFresh(parentId: number, maxAgeMs: number = STORE_CACHE_TTL_MS): boolean {
  if (!cachedChildrenMap.has(parentId)) return false;
  const ts = cachedChildrenTimestamps.get(parentId) || 0;
  return Date.now() - ts < maxAgeMs;
}

export function getCachedChildren(parentId: number): ProductDto[] | null {
  return cachedChildrenMap.get(parentId) || null;
}

export function cacheChildren(parentId: number, children: ProductDto[]): void {
  cachedChildrenMap.set(parentId, children);
  cachedChildrenTimestamps.set(parentId, Date.now());
  for (const c of children) {
    cachedProductDetailMap.set(c.id, c);
  }
}

export function getCachedProductDetail(id: number): ProductDto | null {
  return cachedProductDetailMap.get(id) || null;
}

export function cacheProductDetail(id: number, product: ProductDto): void {
  cachedProductDetailMap.set(id, product);
}

