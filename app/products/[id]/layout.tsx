import type { Metadata } from "next";
import {
  getSiteUrl,
  getProductByIdForSeo,
  getAbsoluteImageUrl,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = getSiteUrl();
  const product = await getProductByIdForSeo(id);

  if (!product) {
    return {
      title: "Multirotor Hardware Component",
      description: "Explore precision multirotor drone components, stators, and airframes engineered by DronesZ India.",
      alternates: { canonical: `/products/${id}` },
    };
  }

  const title = product.name;
  const description =
    product.description && product.description.trim()
      ? product.description.trim().slice(0, 160)
      : `${product.name} — high-performance drone hardware by DronesZ India. Available for fast dispatch. Engineered in Indore, India.`;
  const canonicalPath = `/products/${product.id}`;
  const fullUrl = `${siteUrl}${canonicalPath}`;

  let primaryImageUrl = `${siteUrl}/brand/drone-mark.png`;
  if (product.images && product.images.length > 0) {
    const primary = product.images.find((img) => img.isPrimary) || product.images[0];
    if (primary?.url) {
      primaryImageUrl = getAbsoluteImageUrl(primary.url, siteUrl);
    }
  } else if (product.image) {
    primaryImageUrl = getAbsoluteImageUrl(product.image, siteUrl);
  }

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | DronesZ India`,
      description,
      url: fullUrl,
      type: "website",
      images: [
        {
          url: primaryImageUrl,
          alt: `${product.name} product preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DronesZ India`,
      description,
      images: [primaryImageUrl],
    },
  };
}

export default async function ProductDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const siteUrl = getSiteUrl();
  const product = await getProductByIdForSeo(id);

  const breadcrumbs: Array<{ name: string; path: string }> = [
    { name: "Home", path: "/" },
    { name: "Store", path: "/store" },
  ];

  let productJsonLd: Record<string, any> | null = null;
  if (product) {
    breadcrumbs.push({ name: product.name, path: `/products/${product.id}` });
    productJsonLd = generateProductJsonLd(product, siteUrl);
  }

  const breadcrumbsJsonLd = generateBreadcrumbJsonLd(breadcrumbs, siteUrl);

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      {children}
    </>
  );
}

