import { getDbPool } from "@/lib/db";
import { slugify } from "@/store/services/storeCache";
import { isStandaloneException } from "@/store/services/dynamicStoreTabs";
import { getEffectiveProductStatus, ProductStatus, ProductType } from "@/store/services/api";

export interface SeoProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  status: ProductStatus;
  productType: ProductType;
  parentId: number | null;
  image: string | null;
  images: Array<{ url: string; isPrimary: boolean; displayOrder?: number }>;
  updatedAt?: string;
  createdAt?: string;
}

export const CANONICAL_PRODUCTION_DOMAIN = "https://dronesz.in";

/**
 * Resolves the canonical base URL of the site.
 * 1. Honors explicit NEXT_PUBLIC_SITE_URL if configured.
 * 2. In non-production preview environments (e.g. pull requests on Vercel where VERCEL_ENV === 'preview'),
 *    uses VERCEL_URL so preview deployments can be tested independently.
 * 3. In local development (NODE_ENV === 'development' and not on Vercel), uses http://localhost:3000.
 * 4. In all production builds and deployments, strictly returns the canonical production domain (https://dronesz.in),
 *    preventing any Vercel deployment hashes or cross-domain URLs from entering sitemaps or canonical metadata.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, "");
  }

  // Only use VERCEL_URL on ephemeral branch previews, never in production
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL && process.env.VERCEL_URL.trim()) {
    const raw = process.env.VERCEL_URL.trim().replace(/\/+$/, "");
    return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  }

  // Local development
  const isDev = process.env.NODE_ENV === "development" && !process.env.VERCEL;
  if (isDev) {
    return "http://localhost:3000";
  }

  // Canonical production domain
  return CANONICAL_PRODUCTION_DOMAIN;
}

/**
 * Resolves the internal/external backend API URL for server-side fetches.
 */
export function getBackendApiUrl(): string {
  if (process.env.BACKEND_INTERNAL_URL && process.env.BACKEND_INTERNAL_URL.trim()) {
    return process.env.BACKEND_INTERNAL_URL.trim().replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.trim()) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.trim().replace(/\/+$/, "");
  }
  const isDev = process.env.NODE_ENV !== "production";
  return isDev ? "http://127.0.0.1:8070" : "https://droneszwebsite.onrender.com";
}

/**
 * Converts a relative or absolute product image URL into an absolute URL for SEO & OpenGraph.
 */
export function getAbsoluteImageUrl(imagePath?: string | null, siteUrl: string = getSiteUrl()): string {
  if (!imagePath || !imagePath.trim()) {
    return `${siteUrl}/brand/drone-mark.png`;
  }
  const trimmed = imagePath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${siteUrl}${normalizedPath}`;
}

/**
 * Maps a raw API or DB product row into a typed SeoProduct.
 */
function mapToSeoProduct(p: any, fromDb = false): SeoProduct {
  return {
    id: Number(fromDb ? p.id : p.id),
    name: String(p.name || ""),
    description: p.description ? String(p.description) : null,
    price: Number(p.price || 0),
    quantity: Number(p.quantity || 0),
    status: (fromDb ? p.status : p.status) as ProductStatus || "AVAILABLE",
    productType: (fromDb ? p.product_type : p.productType) as ProductType || "STANDALONE",
    parentId: fromDb
      ? (p.parent_id ? Number(p.parent_id) : null)
      : (p.parentId ? Number(p.parentId) : null),
    image: p.image || null,
    images: Array.isArray(p.images) ? p.images : [],
    updatedAt: fromDb
      ? (p.updated_at ? new Date(p.updated_at).toISOString() : undefined)
      : p.updatedAt,
    createdAt: fromDb
      ? (p.created_at ? new Date(p.created_at).toISOString() : undefined)
      : p.createdAt,
  };
}

/**
 * Resiliently fetches all non-archived products for SEO, sitemap, and category indexation.
 *
 * The backend's public /api/products endpoint returns only top-level (PARENT) products.
 * Child products are only accessible via /api/products/{parentId}/children.
 * This function fetches parents first, then fetches children for each parent in parallel,
 * and merges all results so the sitemap contains every publicly accessible product page.
 *
 * Falls back to a direct PostgreSQL query (which returns all products in one query) when
 * the REST API is unavailable. Never throws — returns [] on total failure.
 */
export async function getProductsForSeo(): Promise<SeoProduct[]> {
  // Strategy 1: Try backend REST API
  try {
    const backendUrl = getBackendApiUrl();

    // 1a. Fetch all top-level (parent) products
    const parentController = new AbortController();
    const parentTimeout = setTimeout(() => parentController.abort(), 5000);

    const parentRes = await fetch(`${backendUrl}/api/products?size=1000`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: parentController.signal,
      next: { revalidate: 300 }, // 5 minutes cache in Next.js
    });
    clearTimeout(parentTimeout);

    if (parentRes.ok) {
      const data = await parentRes.json();
      const parentItems: any[] = Array.isArray(data) ? data : data?.content || [];
      const nonArchivedParents = parentItems.filter((p: any) => p && p.status !== "ARCHIVED");

      // 1b. For every parent, fetch its children via the dedicated children endpoint.
      //     The public /api/products listing only returns top-level products; child
      //     products only appear under /api/products/{parentId}/children.
      const childFetches = nonArchivedParents.map(async (parent: any) => {
        try {
          const childController = new AbortController();
          const childTimeout = setTimeout(() => childController.abort(), 5000);
          const childRes = await fetch(`${backendUrl}/api/products/${parent.id}/children`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: childController.signal,
            next: { revalidate: 300 },
          });
          clearTimeout(childTimeout);
          if (childRes.ok) {
            const children: any[] = await childRes.json();
            return Array.isArray(children)
              ? children.filter((c: any) => c && c.status !== "ARCHIVED")
              : [];
          }
        } catch {
          // Individual child fetch failed — skip this parent's children
        }
        return [];
      });

      const childArrays = await Promise.all(childFetches);
      const allChildren = childArrays.flat();

      const allProducts = [
        ...nonArchivedParents.map((p: any) => mapToSeoProduct(p)),
        ...allChildren.map((p: any) => mapToSeoProduct(p)),
      ];

      if (allProducts.length > 0) return allProducts;
    }
  } catch {
    // Backend API unreachable or timed out; proceed to PostgreSQL direct fallback
  }

  // Strategy 2: Direct PostgreSQL connection via existing getDbPool
  try {
    const pool = getDbPool();
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.quantity, 
        p.status, 
        p.product_type, 
        p.parent_id, 
        p.image, 
        p.updated_at, 
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'url', pi.url, 
              'isPrimary', pi.is_primary, 
              'displayOrder', pi.display_order
            ) ORDER BY pi.display_order ASC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) AS images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.status != 'ARCHIVED'
      GROUP BY p.id
      ORDER BY p.id ASC;
    `;
    const res = await pool.query(query);
    if (res && Array.isArray(res.rows)) {
      return res.rows.map((r: any) => mapToSeoProduct(r, true));
    }
  } catch {
    // Database direct connection unavailable (e.g. offline sandbox or missing DB credentials)
  }

  return [];
}

/**
 * Fetches a single product by numeric or string ID for product detail SEO & structured data.
 */
export async function getProductByIdForSeo(id: number | string): Promise<SeoProduct | null> {
  const numericId = Number(id);
  if (isNaN(numericId) || numericId <= 0) return null;

  // Strategy 1: REST API
  try {
    const backendUrl = getBackendApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${backendUrl}/api/products/${numericId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const p = await res.json();
      if (p && p.status !== "ARCHIVED") {
        return {
          id: Number(p.id),
          name: String(p.name || ""),
          description: p.description ? String(p.description) : null,
          price: Number(p.price || 0),
          quantity: Number(p.quantity || 0),
          status: (p.status as ProductStatus) || "AVAILABLE",
          productType: (p.productType as ProductType) || "STANDALONE",
          parentId: p.parentId ? Number(p.parentId) : null,
          image: p.image || null,
          images: Array.isArray(p.images) ? p.images : [],
          updatedAt: p.updatedAt,
          createdAt: p.createdAt,
        };
      }
    }
  } catch {
    // API failed, fallback to DB
  }

  // Strategy 2: Direct PostgreSQL connection
  try {
    const pool = getDbPool();
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.quantity, 
        p.status, 
        p.product_type, 
        p.parent_id, 
        p.image, 
        p.updated_at, 
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'url', pi.url, 
              'isPrimary', pi.is_primary, 
              'displayOrder', pi.display_order
            ) ORDER BY pi.display_order ASC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) AS images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = $1 AND p.status != 'ARCHIVED'
      GROUP BY p.id;
    `;
    const res = await pool.query(query, [numericId]);
    if (res && res.rows.length > 0) {
      const r = res.rows[0];
      return {
        id: Number(r.id),
        name: String(r.name || ""),
        description: r.description ? String(r.description) : null,
        price: Number(r.price || 0),
        quantity: Number(r.quantity || 0),
        status: (r.status as ProductStatus) || "AVAILABLE",
        productType: (r.product_type as ProductType) || "STANDALONE",
        parentId: r.parent_id ? Number(r.parent_id) : null,
        image: r.image || null,
        images: Array.isArray(r.images) ? r.images : [],
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      };
    }
  } catch {
    // Fallback failure
  }

  return null;
}

/**
 * Resolves a parent product series matching a URL slug or ID string.
 */
export async function getParentSeriesBySlugForSeo(slug: string): Promise<SeoProduct | null> {
  if (!slug || !slug.trim()) return null;
  const cleanSlug = slug.trim().toLowerCase();
  const allProducts = await getProductsForSeo();

  const parent = allProducts.find(
    (p) =>
      p.productType === "PARENT" &&
      p.status !== "ARCHIVED" &&
      (slugify(p.name) === cleanSlug ||
        `${slugify(p.name)}-${p.id}` === cleanSlug ||
        String(p.id) === cleanSlug)
  );

  return parent || null;
}

/**
 * Generates Schema.org Product structured data (JSON-LD)
 */
export function generateProductJsonLd(product: SeoProduct, siteUrl: string = getSiteUrl()) {
  const effectiveStatus = getEffectiveProductStatus(product);
  const isComingSoon = product.status === "COMING_SOON" || effectiveStatus === "COMING_SOON";
  const isAvailable = !isComingSoon && effectiveStatus === "AVAILABLE";

  let availability = "https://schema.org/InStock";
  if (isComingSoon) {
    availability = "https://schema.org/PreOrder";
  } else if (!isAvailable) {
    availability = "https://schema.org/OutOfStock";
  }

  // Collect all image URLs
  const imageUrls: string[] = [];
  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      if (img.url) imageUrls.push(getAbsoluteImageUrl(img.url, siteUrl));
    }
  }
  if (imageUrls.length === 0 && product.image) {
    imageUrls.push(getAbsoluteImageUrl(product.image, siteUrl));
  }
  if (imageUrls.length === 0) {
    imageUrls.push(`${siteUrl}/brand/drone-mark.png`);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description && product.description.trim()
        ? product.description.trim()
        : `${product.name} — high-performance multirotor hardware by DronesZ India. Engineered in Indore, India.`,
    image: imageUrls,
    sku: `DZ-PRD-${product.id}`,
    mpn: `DZ-${product.id}`,
    brand: {
      "@type": "Brand",
      name: "DronesZ",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability,
      seller: {
        "@type": "Organization",
        name: "DronesZ India",
        url: siteUrl,
      },
    },
  };
}

/**
 * Generates Schema.org CollectionPage / ItemList JSON-LD
 */
export function generateCollectionJsonLd(params: {
  title: string;
  description: string;
  url: string;
  siteUrl?: string;
  items?: Array<{ name: string; url: string }>;
}) {
  const siteUrl = params.siteUrl || getSiteUrl();
  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.title,
    description: params.description,
    url: params.url.startsWith("http") ? params.url : `${siteUrl}${params.url}`,
    isPartOf: {
      "@type": "WebSite",
      name: "DronesZ India",
      url: siteUrl,
    },
  };

  if (params.items && params.items.length > 0) {
    jsonLd.mainEntity = {
      "@type": "ItemList",
      itemListElement: params.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
      })),
    };
  }

  return jsonLd;
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(
  breadcrumbs: Array<{ name: string; path: string }>,
  siteUrl: string = getSiteUrl()
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.path.startsWith("http") ? crumb.path : `${siteUrl}${crumb.path}`,
    })),
  };
}

/**
 * Generates Schema.org WebSite structured data with SearchAction
 */
export function generateWebSiteJsonLd(siteUrl: string = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DronesZ India",
    alternateName: "DronesZ",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/store?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export { slugify, isStandaloneException };
