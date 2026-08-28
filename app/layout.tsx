import type { Metadata } from "next";
import "../styles/global.css";
import { inter, display } from "./fonts";
import { LenisGSAPProvider } from "@/components/providers/LenisGSAPProvider";
import { Nav } from "@/components/nav/Nav";
import { SoundToggle } from "@/components/audio/SoundToggle";

// Absolute base for OG/canonical URLs. Vercel injects VERCEL_URL per deploy; override with
// NEXT_PUBLIC_SITE_URL once the client's domain is connected.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

const title = "DronesZ India — Redefining Flight. Assembling the Future.";
const description =
  "DronesZ India: custom drones, counter-UAS systems, consumer drones, components, and lab setup services. Indore-based.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "DronesZ India",
  alternates: { canonical: "/" },
  // og:image / twitter:image are auto-wired from app/opengraph-image.tsx.
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_IN",
    siteName: "DronesZ India",
  },
  twitter: { card: "summary_large_image", title, description },
};

// Organization structured data — tells Google the correct entity name ("DronesZ", with the S)
// and location, so search results stop echoing the old site's mis-spelled description.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DronesZ India",
  alternateName: "DronesZ",
  url: siteUrl,
  logo: `${siteUrl}/brand/drone-mark.png`,
  description,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Indore",
    addressRegion: "MP",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <LenisGSAPProvider>
          <Nav />
          {children}
          <SoundToggle />
        </LenisGSAPProvider>
      </body>
    </html>
  );
}
