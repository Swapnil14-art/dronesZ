import type { MetadataRoute } from "next";
import { getSiteUrl, getProductsForSeo, slugify, isStandaloneException } from "@/lib/seo";

export const revalidate = 3600; // Revalidate sitemap dynamically every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  // 1. Core static marketing & utility pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/store`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/frames`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/build-your-own-drone`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/store/parachute`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/store/agricultural-spraying-drone`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 2. Dynamic products and parent series
  const products = await getProductsForSeo();
  const seenUrls = new Set<string>(staticRoutes.map((r) => r.url));
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  for (const product of products) {
    if (product.status === "ARCHIVED") continue;

    const lastModified = product.updatedAt
      ? new Date(product.updatedAt)
      : product.createdAt
      ? new Date(product.createdAt)
      : now;

    if (product.productType === "PARENT") {
      // Exclude standalone exception series that already have dedicated routes
      if (!isStandaloneException(product.name)) {
        const slug = slugify(product.name);
        const parentUrl = `${siteUrl}/store/${slug}`;
        if (!seenUrls.has(parentUrl)) {
          seenUrls.add(parentUrl);
          dynamicRoutes.push({
            url: parentUrl,
            lastModified,
            changeFrequency: "daily",
            priority: 0.8,
          });
        }
      }
    } else {
      // STANDALONE and CHILD variant items
      const productUrl = `${siteUrl}/products/${product.id}`;
      if (!seenUrls.has(productUrl)) {
        seenUrls.add(productUrl);
        dynamicRoutes.push({
          url: productUrl,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}

