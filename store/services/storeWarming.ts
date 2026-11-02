import {
  ProductDto,
  fetchPublicProducts,
  fetchPublicChildProducts,
  getProductImageUrl,
} from './api';
import {
  isMainCatalogFresh,
  getCachedMainCatalog,
  cacheMainCatalog,
  isChildrenFresh,
  getCachedChildren,
  cacheChildren,
  STORE_CACHE_TTL_MS,
} from './storeCache';

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

/**
 * Returns true if background speculative warming should be avoided:
 * - Running in SSR
 * - User enabled Data Saver (saveData = true)
 * - Constrained / slow network (2g / slow-2g)
 * - Document is currently hidden
 */
export function shouldSkipWarming(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true;
  }

  // Avoid speculative work if tab is hidden
  if (document.visibilityState === 'hidden') {
    return true;
  }

  // Check network constraints if supported by the browser
  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (conn) {
    if (conn.saveData === true) {
      return true;
    }
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
      return true;
    }
  }

  return false;
}

/**
 * Resolves the primary image URL for a product DTO without external fallbacks.
 */
export function extractProductImageUrl(item?: ProductDto | null): string | null {
  if (!item) return null;

  // 1. Direct image property
  if (item.image && typeof item.image === 'string' && item.image.trim()) {
    const resolved = getProductImageUrl(item.image.trim());
    if (resolved) return resolved;
  }

  // 2. primaryImage object
  if (item.primaryImage?.url && item.primaryImage.url.trim()) {
    const resolved = getProductImageUrl(item.primaryImage.url.trim());
    if (resolved) return resolved;
  }

  // 3. images array
  if (item.images && item.images.length > 0) {
    const primary = item.images.find((img) => img.isPrimary) || item.images[0];
    if (primary?.url && primary.url.trim()) {
      const resolved = getProductImageUrl(primary.url.trim());
      if (resolved) return resolved;
    }
  }

  return null;
}

/**
 * Extracts selective primary image URLs from parent products and top child products
 * that are most likely to appear immediately on the Store landing page.
 */
export function extractWarmingImageUrls(
  parents: ProductDto[],
  childrenMap: Record<number, ProductDto[]>,
  maxImages: number = 8
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const addUrl = (url: string | null) => {
    if (!url) return;
    const cleanUrl = url.trim();
    if (!cleanUrl || seen.has(cleanUrl)) return;
    // Skip inline previews (blob/data) or external tracking
    if (cleanUrl.startsWith('blob:') || cleanUrl.startsWith('data:')) return;
    seen.add(cleanUrl);
    urls.push(cleanUrl);
  };

  // 1. Primary images of parent products
  for (const parent of parents) {
    if (urls.length >= maxImages) break;
    addUrl(extractProductImageUrl(parent));
  }

  // 2. Primary images of individual child hardware items
  for (const parent of parents) {
    if (urls.length >= maxImages) break;
    const children = childrenMap[parent.id] || [];
    for (const child of children) {
      if (urls.length >= maxImages) break;
      if (child.status === 'ARCHIVED') continue;
      addUrl(extractProductImageUrl(child));
    }
  }

  return urls.slice(0, maxImages);
}

export interface PreloadOptions {
  concurrency?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Preloads an array of image URLs using bounded concurrency and timeouts.
 * Populates browser HTTP cache (Cache-Control: public, max-age=86400) without
 * blocking or hanging.
 */
export async function preloadImagesBounded(
  urls: string[],
  options: PreloadOptions = {}
): Promise<number> {
  if (urls.length === 0) return 0;
  if (typeof window === 'undefined') return 0;

  const concurrency = Math.max(1, options.concurrency ?? 2);
  const timeoutMs = options.timeoutMs ?? 4000;
  const signal = options.signal;

  let warmedCount = 0;
  let currentIndex = 0;

  const preloadSingle = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (signal?.aborted) {
        resolve(false);
        return;
      }

      let settled = false;
      const img = new Image();
      img.decoding = 'async';

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          img.src = '';
          resolve(false);
        }
      }, timeoutMs);

      img.onload = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(true);
        }
      };

      img.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(false);
        }
      };

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              img.src = '';
              resolve(false);
            }
          },
          { once: true }
        );
      }

      img.src = url;
    });
  };

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }).map(
    async () => {
      while (currentIndex < urls.length) {
        if (signal?.aborted) break;
        const index = currentIndex++;
        const success = await preloadSingle(urls[index]);
        if (success) {
          warmedCount++;
        }
      }
    }
  );

  await Promise.all(workers);
  return warmedCount;
}

export interface WarmStoreResult {
  catalogWarmed: boolean;
  childrenCount: number;
  imagesWarmed: number;
  skipped: boolean;
}

// Session-level tracking to prevent recurring background loops
let lastWarmedTimestamp = 0;

/**
 * Opportunistically warms product catalog, active parent children, and primary images
 * with bounded concurrency and resource safeguards.
 */
export async function warmStoreDataAndImages(options: {
  signal?: AbortSignal;
  maxParents?: number;
  maxImages?: number;
  force?: boolean;
} = {}): Promise<WarmStoreResult> {
  const maxParents = options.maxParents ?? 3;
  const maxImages = options.maxImages ?? 8;
  const force = options.force ?? false;
  const signal = options.signal;

  if (shouldSkipWarming()) {
    return { catalogWarmed: false, childrenCount: 0, imagesWarmed: 0, skipped: true };
  }

  // Prevent repeated background work within the freshness window
  const now = Date.now();
  if (!force && now - lastWarmedTimestamp < STORE_CACHE_TTL_MS && isMainCatalogFresh()) {
    return { catalogWarmed: false, childrenCount: 0, imagesWarmed: 0, skipped: true };
  }

  try {
    let parents: ProductDto[] = [];
    let catalogWarmed = false;

    // 1. Warm main catalog if not already fresh
    if (isMainCatalogFresh() && !force) {
      const existing = getCachedMainCatalog() || [];
      parents = existing.filter(
        (p) => p.productType === 'PARENT' && p.status !== 'ARCHIVED'
      );
    } else {
      if (signal?.aborted) {
        return { catalogWarmed: false, childrenCount: 0, imagesWarmed: 0, skipped: true };
      }

      const res = await fetchPublicProducts({ size: 50 });
      if (res && res.content) {
        cacheMainCatalog(res.content);
        catalogWarmed = true;
        parents = res.content.filter(
          (p) => p.productType === 'PARENT' && p.status !== 'ARCHIVED'
        );
      }
    }

    if (signal?.aborted) {
      return { catalogWarmed, childrenCount: 0, imagesWarmed: 0, skipped: true };
    }

    // 2. Warm children for up to maxParents series (bounded concurrency = 2)
    const targetParents = parents.slice(0, maxParents);
    const childrenMap: Record<number, ProductDto[]> = {};
    let totalChildrenCount = 0;

    const fetchChildTasks = targetParents.map((parent) => async () => {
      if (signal?.aborted) return;
      if (isChildrenFresh(parent.id) && !force) {
        const cached = getCachedChildren(parent.id);
        if (cached) {
          childrenMap[parent.id] = cached;
          totalChildrenCount += cached.length;
          return;
        }
      }

      try {
        const children = await fetchPublicChildProducts(parent.id);
        if (children && children.length > 0) {
          cacheChildren(parent.id, children);
          childrenMap[parent.id] = children;
          totalChildrenCount += children.length;
        }
      } catch {
        // Silently skip child failures during background speculative warming
      }
    });

    // Execute parent child fetches with max concurrency = 2
    for (let i = 0; i < fetchChildTasks.length; i += 2) {
      if (signal?.aborted) break;
      const batch = fetchChildTasks.slice(i, i + 2).map((fn) => fn());
      await Promise.all(batch);
    }

    if (signal?.aborted) {
      return { catalogWarmed, childrenCount: totalChildrenCount, imagesWarmed: 0, skipped: true };
    }

    // 3. Extract primary images and preload with bounded concurrency
    const imageUrls = extractWarmingImageUrls(targetParents, childrenMap, maxImages);
    const imagesWarmed = await preloadImagesBounded(imageUrls, {
      concurrency: 2,
      timeoutMs: 4000,
      signal,
    });

    lastWarmedTimestamp = Date.now();

    return {
      catalogWarmed,
      childrenCount: totalChildrenCount,
      imagesWarmed,
      skipped: false,
    };
  } catch {
    // Fail silently without disrupting page or throwing unhandled rejections
    return { catalogWarmed: false, childrenCount: 0, imagesWarmed: 0, skipped: true };
  }
}

