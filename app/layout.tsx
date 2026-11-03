import type { Metadata } from "next";
import "../styles/global.css";
import { inter, display } from "./fonts";
import { LenisGSAPProvider } from "@/components/providers/LenisGSAPProvider";
import { Nav } from "@/components/nav/Nav";
import { SoundToggle } from "@/components/audio/SoundToggle";

import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

const defaultTitle = "DronesZ India — Redefining Flight. Assembling the Future.";
const description =
  "DronesZ India: custom drones, counter-UAS systems, consumer drones, components, and lab setup services. Indore-based.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | DronesZ India",
  },
  description,
  applicationName: "DronesZ India",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      process.env.GOOGLE_SITE_VERIFICATION ||
      undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // og:image / twitter:image are auto-wired from app/opengraph-image.tsx.
  openGraph: {
    title: defaultTitle,
    description,
    type: "website",
    locale: "en_IN",
    siteName: "DronesZ India",
  },
  twitter: { card: "summary_large_image", title: defaultTitle, description },
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

// WebSite structured data with SearchAction
const webSiteJsonLd = {
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

import React, { Suspense } from "react";
import { StoreProviders } from "@/components/providers/StoreProviders";
import { NavigationProgressBar } from "@/components/ui/NavigationProgressBar";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <StoreProviders>
          <LenisGSAPProvider>
            <Nav />
            {children}
            <SoundToggle />
          </LenisGSAPProvider>
        </StoreProviders>
      </body>
    </html>
  );
}
