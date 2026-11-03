import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSiteUrl,
  getAbsoluteImageUrl,
  generateProductJsonLd,
  generateCollectionJsonLd,
  generateBreadcrumbJsonLd,
  generateWebSiteJsonLd,
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
    it("uses NEXT_PUBLIC_SITE_URL when defined", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://custom-drones.in/";
      expect(getSiteUrl()).toBe("https://custom-drones.in");
    });

    it("uses VERCEL_URL with https prefix when NEXT_PUBLIC_SITE_URL is not set", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.VERCEL_URL = "dronesz-preview.vercel.app";
      expect(getSiteUrl()).toBe("https://dronesz-preview.vercel.app");
    });

    it("falls back to default production URL when no environment variables are set in production", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_URL;
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
