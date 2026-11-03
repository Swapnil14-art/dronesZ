import type { Metadata } from "next";
import {
  getSiteUrl,
  getParentSeriesBySlugForSeo,
  getAbsoluteImageUrl,
  generateCollectionJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = getSiteUrl();

  const isParachute = slug === "parachute";
  const isAgriDrone = slug === "agricultural-spraying-drone" || slug === "agri-drone";

  if (isParachute) {
    const title = "Drone Recovery Parachute Systems";
    const description =
      "Autonomous ballistic parachute recovery systems and flight termination for multirotor and fixed-wing UAVs. Protect payloads and ensure regulatory safety.";
    const url = `${siteUrl}/store/parachute`;

    return {
      title,
      description,
      alternates: { canonical: "/store/parachute" },
      openGraph: {
        title: `${title} | DronesZ India`,
        description,
        url,
        type: "website",
        images: [{ url: `${siteUrl}/brand/drone-mark.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | DronesZ India`,
        description,
      },
    };
  }

  if (isAgriDrone) {
    const title = "DGCA Type Certified Agricultural Spraying Drone";
    const description =
      "Medium-class hexacopter RPAS featuring 10L capacity, 2399W motors, dual centimetre-level RTK GPS, and 23-minute mission endurance. Engineered in Indore, India.";
    const url = `${siteUrl}/store/agricultural-spraying-drone`;

    return {
      title,
      description,
      alternates: { canonical: "/store/agricultural-spraying-drone" },
      openGraph: {
        title: `${title} | DronesZ India`,
        description,
        url,
        type: "website",
        images: [{ url: `${siteUrl}/agri-drone/hero_drone.png`, width: 1055, height: 500 }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | DronesZ India`,
        description,
      },
    };
  }

  // Dynamic Parent Series
  const parent = await getParentSeriesBySlugForSeo(slug);
  const formattedSlug = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const seriesName = parent ? parent.name : formattedSlug;
  const title = `${seriesName}`;
  const description =
    parent?.description && parent.description.trim()
      ? parent.description.trim()
      : `Explore ${seriesName} multirotor hardware specifications, precision variants, and engineering documentation. Engineered by DronesZ India.`;
  const canonicalPath = `/store/${slug}`;
  const fullUrl = `${siteUrl}${canonicalPath}`;
  const imageUrl = getAbsoluteImageUrl(parent?.image, siteUrl);

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | DronesZ India`,
      description,
      url: fullUrl,
      type: "website",
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DronesZ India`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function StoreSlugLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const siteUrl = getSiteUrl();

  const isParachute = slug === "parachute";
  const isAgriDrone = slug === "agricultural-spraying-drone" || slug === "agri-drone";

  let jsonLd: Record<string, any>;
  let breadcrumbs: Array<{ name: string; path: string }> = [
    { name: "Home", path: "/" },
    { name: "Store", path: "/store" },
  ];

  if (isParachute) {
    breadcrumbs.push({ name: "Recovery Parachutes", path: "/store/parachute" });
    jsonLd = generateCollectionJsonLd({
      title: "Drone Recovery Parachute Systems",
      description:
        "Autonomous ballistic parachute recovery systems and emergency flight termination for multirotor and fixed-wing UAVs.",
      url: "/store/parachute",
      siteUrl,
    });
  } else if (isAgriDrone) {
    breadcrumbs.push({ name: "Agricultural Spraying Drone", path: "/store/agricultural-spraying-drone" });
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "DronesZ Agricultural Spraying Drone (Hexacopter)",
      description:
        "DGCA Type Certified medium-class agricultural hexacopter RPAS with 10L spraying payload, autonomous dual RTK GNSS, and terrain-following radar.",
      image: [`${siteUrl}/agri-drone/hero_drone.png`, `${siteUrl}/agri-drone/dgca_cert_badge.png`],
      sku: "DZ-AGRI-HEXA-10L",
      brand: {
        "@type": "Brand",
        name: "DronesZ",
      },
      offers: {
        "@type": "Offer",
        url: `${siteUrl}/store/agricultural-spraying-drone`,
        priceCurrency: "INR",
        price: 499999,
        itemCondition: "https://schema.org/NewCondition",
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "DronesZ India",
          url: siteUrl,
        },
      },
    };
  } else {
    const parent = await getParentSeriesBySlugForSeo(slug);
    const seriesName = parent ? parent.name : slug.replace(/-/g, " ");
    breadcrumbs.push({ name: seriesName, path: `/store/${slug}` });
    jsonLd = generateCollectionJsonLd({
      title: `${seriesName} Series`,
      description:
        parent?.description ||
        `High-performance ${seriesName} multirotor series, stators, and hardware components by DronesZ India.`,
      url: `/store/${slug}`,
      siteUrl,
    });
  }

  const breadcrumbsJsonLd = generateBreadcrumbJsonLd(breadcrumbs, siteUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      {children}
    </>
  );
}

