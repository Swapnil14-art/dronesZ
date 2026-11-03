import type { Metadata } from "next";
import { getSiteUrl, generateCollectionJsonLd } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Store & Multirotor Hardware Catalog",
  description:
    "Explore the DronesZ multirotor store: high-performance brushless motors, carbon airframes, avionics, recovery parachutes, and DGCA certified agricultural drones.",
  alternates: {
    canonical: "/store",
  },
  openGraph: {
    title: "Store & Multirotor Hardware Catalog | DronesZ India",
    description:
      "Explore the DronesZ multirotor store: high-performance brushless motors, carbon airframes, avionics, recovery parachutes, and DGCA certified agricultural drones.",
    url: `${siteUrl}/store`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Store & Multirotor Hardware Catalog | DronesZ India",
    description:
      "Explore the DronesZ multirotor store: high-performance brushless motors, carbon airframes, avionics, recovery parachutes, and DGCA certified agricultural drones.",
  },
};

const storeJsonLd = generateCollectionJsonLd({
  title: "DronesZ Store & Multirotor Hardware Catalog",
  description:
    "Explore the DronesZ multirotor store: high-performance brushless motors, carbon airframes, avionics, recovery parachutes, and DGCA certified agricultural drones.",
  url: "/store",
  siteUrl,
});

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      {children}
    </>
  );
}

