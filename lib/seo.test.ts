import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSiteUrl,
  getAbsoluteImageUrl,
  generateProductJsonLd,
  generateCollectionJsonLd,
  generateBreadcrumbJsonLd,
  generateWebSiteJsonLd,
  getProductsForSeo,
  SeoProduct,
} from "./seo";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { metadata as cartMetadata } from "../app/cart/layout";
import { metadata as checkoutMetadata } from "../app/checkout/layout";
import { metadata as dashboardMetadata } from "../app/dashboard/layout";
import { metadata as adminMetadata } from "../app/admin/layout";
import { generateMetadata as generateProductMetadata } from "../app/products/[id]/layout";
import { generateMetadata as generateSlugMetadata } from "../app/store/[slug]/layout";

describe("DronesZ SEO Foundation Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Site URL Resolution", () => {
    it("uses NEXT_PUBLIC_SITE_URL when defined and strips trailing slash", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://custom-drones.in/";
      expect(getSiteUrl()).toBe("https://custom-drones.in");
    });

    it("uses VERCEL_URL prefixed with https:// on VERCEL_ENV=preview when NEXT_PUBLIC_SITE_URL is not set", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_URL = "droneszwebsite-abc123-drones-z.vercel.app";
      expect(getSiteUrl()).toBe("https://droneszwebsite-abc123-drones-z.vercel.app");
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_URL;
    });

    it("returns canonical production domain in production regardless of VERCEL_URL", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.VERCEL_ENV = "production";
      process.env.VERCEL_URL = "droneszwebsite-ajij8wmm8w-drones-z.vercel.app";
      const prevNodeEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = "production";
      expect(getSiteUrl()).toBe("https://dronesz.in");
      (process.env as any).NODE_ENV = prevNodeEnv;
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_URL;
    });

    it("returns localhost in local development when no Vercel env is present", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_URL;
      delete process.env.VERCEL;
      const prevNodeEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = "development";
      expect(getSiteUrl()).toBe("http://localhost:3000");
      (process.env as any).NODE_ENV = prevNodeEnv;
    });

    it("falls back to canonical production domain when no environment variables are set", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_URL;
      delete process.env.VERCEL;
      const prevNodeEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = "production";
      expect(getSiteUrl()).toBe("https://dronesz.in");
      (process.env as any).NODE_ENV = prevNodeEnv;
    });
  });

  describe("Image URL Resolution", () => {
    it("converts relative image paths to absolute URLs", () => {
      const abs = getAbsoluteImageUrl("/api/products/12/image", "https://dronesz.in");
      expect(abs).toBe("https://dronesz.in/api/products/12/image");
    });

    it("preserves already absolute URLs", () => {
      const abs = getAbsoluteImageUrl("https://cdn.example.com/drone.jpg", "https://dronesz.in");
      expect(abs).toBe("https://cdn.example.com/drone.jpg");
    });

    it("falls back to brand logo when image is null or empty", () => {
      const abs = getAbsoluteImageUrl(null, "https://dronesz.in");
      expect(abs).toBe("https://dronesz.in/brand/drone-mark.png");
    });
  });

  describe("Product Structured Data (JSON-LD)", () => {
    const mockProduct: SeoProduct = {
      id: 42,
      name: "Mars 2207 1850KV Motor",
      description: "High-temperature curved N52SH arc magnets for extreme cinematic thrust.",
      price: 1899,
      quantity: 50,
      status: "AVAILABLE",
      productType: "STANDALONE",
      parentId: null,
      image: "/api/products/42/image",
      images: [
        { url: "/api/products/42/image", isPrimary: true, displayOrder: 0 },
        { url: "/api/products/42/gallery-1.jpg", isPrimary: false, displayOrder: 1 },
      ],
    };

    it("generates Schema.org Product compliant JSON-LD", () => {
      const jsonLd = generateProductJsonLd(mockProduct, "https://dronesz.in");

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Product");
      expect(jsonLd.name).toBe("Mars 2207 1850KV Motor");
      expect(jsonLd.description).toContain("N52SH arc magnets");
      expect(jsonLd.sku).toBe("DZ-PRD-42");
      expect(jsonLd.mpn).toBe("DZ-42");
      expect(jsonLd.brand).toEqual({ "@type": "Brand", name: "DronesZ" });

      expect(jsonLd.offers).toMatchObject({
        "@type": "Offer",
        priceCurrency: "INR",
        price: 1899,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: "https://dronesz.in/products/42",
      });
      expect(jsonLd.offers.seller).toEqual({
        "@type": "Organization",
        name: "DronesZ India",
        url: "https://dronesz.in",
      });
      expect(jsonLd.image).toHaveLength(2);
      expect(jsonLd.image[0]).toBe("https://dronesz.in/api/products/42/image");
    });

    it("marks OutOfStock when product quantity is 0", () => {
      const outOfStockProduct: SeoProduct = {
        ...mockProduct,
        quantity: 0,
        status: "AVAILABLE",
      };
      const jsonLd = generateProductJsonLd(outOfStockProduct, "https://dronesz.in");
      expect(jsonLd.offers.availability).toBe("https://schema.org/OutOfStock");
    });

    it("marks PreOrder when product status is COMING_SOON", () => {
      const comingSoonProduct: SeoProduct = {
        ...mockProduct,
        status: "COMING_SOON",
        quantity: 0,
      };
      const jsonLd = generateProductJsonLd(comingSoonProduct, "https://dronesz.in");
      expect(jsonLd.offers.availability).toBe("https://schema.org/PreOrder");
    });
  });

  describe("Collection & Breadcrumb Structured Data", () => {
    it("generates CollectionPage schema with ItemList", () => {
      const collection = generateCollectionJsonLd({
        title: "Motors & Stators",
        description: "Brushless propulsion for multirotors.",
        url: "/store/motors",
        siteUrl: "https://dronesz.in",
        items: [
          { name: "Mars 2207 1850KV", url: "/products/42" },
          { name: "Mars 2207 1950KV", url: "/products/43" },
        ],
      });

      expect(collection["@type"]).toBe("CollectionPage");
      expect(collection.name).toBe("Motors & Stators");
      expect(collection.mainEntity["@type"]).toBe("ItemList");
      expect(collection.mainEntity.itemListElement).toHaveLength(2);
      expect(collection.mainEntity.itemListElement[0]).toEqual({
        "@type": "ListItem",
        position: 1,
        name: "Mars 2207 1850KV",
        url: "https://dronesz.in/products/42",
      });
    });

    it("generates BreadcrumbList schema with hierarchical positions", () => {
      const crumbs = generateBreadcrumbJsonLd(
        [
          { name: "Home", path: "/" },
          { name: "Store", path: "/store" },
          { name: "Motors", path: "/store/motors" },
        ],
        "https://dronesz.in"
      );

      expect(crumbs["@type"]).toBe("BreadcrumbList");
      expect(crumbs.itemListElement).toHaveLength(3);
      expect(crumbs.itemListElement[2]).toEqual({
        "@type": "ListItem",
        position: 3,
        name: "Motors",
        item: "https://dronesz.in/store/motors",
      });
    });

    it("generates WebSite schema with SearchAction", () => {
      const webSite = generateWebSiteJsonLd("https://dronesz.in");
      expect(webSite["@type"]).toBe("WebSite");
      expect(webSite.potentialAction["@type"]).toBe("SearchAction");
      expect(webSite.potentialAction.target.urlTemplate).toBe(
        "https://dronesz.in/store?search={search_term_string}"
      );
    });
  });

  describe("Robots.txt Configuration", () => {
    it("allows public crawling while strictly disallowing private/admin/cart/checkout routes", () => {
      const config = robots();
      expect(config.rules).toBeDefined();

      const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      expect(rule.userAgent).toBe("*");

      // Verify public routes are allowed
      expect(rule.allow).toContain("/");
      expect(rule.allow).toContain("/store");
      expect(rule.allow).toContain("/products/");
      expect(rule.allow).toContain("/frames");
      expect(rule.allow).toContain("/build-your-own-drone");
      expect(rule.allow).toContain("/contact");

      // Verify private/admin routes are blocked
      expect(rule.disallow).toContain("/admin");
      expect(rule.disallow).toContain("/admin/");
      expect(rule.disallow).toContain("/dashboard");
      expect(rule.disallow).toContain("/dashboard/");
      expect(rule.disallow).toContain("/cart");
      expect(rule.disallow).toContain("/cart/");
      expect(rule.disallow).toContain("/checkout");
      expect(rule.disallow).toContain("/checkout/");
      expect(rule.disallow).toContain("/orders");
      expect(rule.disallow).toContain("/orders/");
      expect(rule.disallow).toContain("/api/");

      // Verify sitemap is linked
      expect(config.sitemap).toContain("/sitemap.xml");
    });
  });

  describe("XML Sitemap Generation", () => {
    it("includes all core static public pages with appropriate priorities and frequencies", async () => {
      const map = await sitemap();
      expect(map).toBeDefined();
      expect(Array.isArray(map)).toBe(true);

      const urls = map.map((entry) => entry.url);

      // Verify core static pages
      expect(urls.some((u) => u.endsWith("/"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/store"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/frames"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/build-your-own-drone"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/contact"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/store/parachute"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/store/agricultural-spraying-drone"))).toBe(true);

      // Verify NO private/admin/checkout routes leaked into sitemap
      expect(urls.some((u) => u.includes("/admin"))).toBe(false);
      expect(urls.some((u) => u.includes("/cart"))).toBe(false);
      expect(urls.some((u) => u.includes("/checkout"))).toBe(false);
      expect(urls.some((u) => u.includes("/dashboard"))).toBe(false);
      expect(urls.some((u) => u.includes("/orders"))).toBe(false);
      expect(urls.some((u) => u.includes("/api"))).toBe(false);
    });
  });

  describe("Private Routes Noindex Directives", () => {
    it("enforces noindex on Cart page", () => {
      expect(cartMetadata.robots).toMatchObject({
        index: false,
        follow: false,
      });
    });

    it("enforces noindex on Checkout page", () => {
      expect(checkoutMetadata.robots).toMatchObject({
        index: false,
        follow: false,
      });
    });

    it("enforces noindex on Dashboard page", () => {
      expect(dashboardMetadata.robots).toMatchObject({
        index: false,
        follow: false,
      });
    });

    it("enforces noindex on Admin portal", () => {
      expect(adminMetadata.robots).toMatchObject({
        index: false,
        follow: false,
      });
    });
  });

  describe("getProductsForSeo — child product fetching", () => {
    it("fetches children for each parent and returns a merged flat list", async () => {
      const parentProduct = {
        id: 9,
        name: "High-Performance Motors Series",
        description: "Motor series",
        price: 0,
        quantity: 0,
        status: "AVAILABLE",
        productType: "PARENT",
        parentId: null,
        image: "/api/products/9/images/37",
        images: [],
        updatedAt: "2026-10-27T21:17:16.846",
        createdAt: "2026-08-29T00:18:34.825",
      };
      const childProduct = {
        id: 30,
        name: "3110-900 KV",
        description: "Motor child",
        price: 3776,
        quantity: 500,
        status: "AVAILABLE",
        productType: "CHILD",
        parentId: 9,
        image: "/api/products/30/images/42",
        images: [],
        updatedAt: "2026-10-29T05:41:09.024",
        createdAt: "2026-09-14T16:14:56.407",
      };

      const fetchMock = vi.fn((url: string) => {
        if (url.includes("/api/products?")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ content: [parentProduct], totalElements: 1 }),
          });
        }
        if (url.includes("/api/products/9/children")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([childProduct]),
          });
        }
        return Promise.resolve({ ok: false });
      });
      vi.stubGlobal("fetch", fetchMock);

      const products = await getProductsForSeo();

      vi.unstubAllGlobals();

      expect(products.length).toBe(2);
      const ids = products.map((p) => p.id);
      expect(ids).toContain(9);
      expect(ids).toContain(30);

      const child = products.find((p) => p.id === 30);
      expect(child?.productType).toBe("CHILD");
      expect(child?.parentId).toBe(9);

      const childCall = fetchMock.mock.calls.find((args: any[]) =>
        String(args[0]).includes("/api/products/9/children")
      );
      expect(childCall).toBeDefined();
    });

    it("excludes ARCHIVED children from results", async () => {
      const parentProduct = {
        id: 9,
        name: "Motors",
        description: "",
        price: 0,
        quantity: 0,
        status: "AVAILABLE",
        productType: "PARENT",
        parentId: null,
        image: null,
        images: [],
        updatedAt: null,
        createdAt: null,
      };
      const archivedChild = {
        id: 55,
        name: "Old Motor",
        description: "",
        price: 100,
        quantity: 0,
        status: "ARCHIVED",
        productType: "CHILD",
        parentId: 9,
        image: null,
        images: [],
        updatedAt: null,
        createdAt: null,
      };

      const fetchMock = vi.fn((url: string) => {
        if (url.includes("/api/products?")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ content: [parentProduct] }),
          });
        }
        if (url.includes("/children")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([archivedChild]),
          });
        }
        return Promise.resolve({ ok: false });
      });
      vi.stubGlobal("fetch", fetchMock);

      const products = await getProductsForSeo();

      vi.unstubAllGlobals();

      const ids = products.map((p) => p.id);
      expect(ids).not.toContain(55);
      expect(ids).toContain(9);
    });
  });

  describe("Dynamic Metadata Generation", () => {
    it("generates tailored metadata for parachute landing page", async () => {
      const meta = await generateSlugMetadata({
        params: Promise.resolve({ slug: "parachute" }),
      });
      expect(meta.title).toBe("Drone Recovery Parachute Systems");
      expect(meta.description).toContain("ballistic parachute");
      expect(meta.alternates?.canonical).toBe("/store/parachute");
    });

    it("generates tailored metadata for agricultural spraying drone", async () => {
      const meta = await generateSlugMetadata({
        params: Promise.resolve({ slug: "agricultural-spraying-drone" }),
      });
      expect(meta.title).toBe("DGCA Type Certified Agricultural Spraying Drone");
      expect(meta.description).toContain("hexacopter");
      expect(meta.alternates?.canonical).toBe("/store/agricultural-spraying-drone");
    });

    it("generates fallback metadata gracefully when product is not found", async () => {
      const meta = await generateProductMetadata({
        params: Promise.resolve({ id: "999999" }),
      });
      expect(meta.title).toBe("Multirotor Hardware Component");
      expect(meta.alternates?.canonical).toBe("/products/999999");
    });
  });
});
