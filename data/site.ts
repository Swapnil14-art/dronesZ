/**
 * Site-wide copy: nav, metadata, pillars, footer, contact. PLACEHOLDER contact details —
 * the live-site values are placeholders too; swap real ones before launch.
 */

export interface NavItem {
  label: string;
  /** Route href, or "#anchor" resolved via Lenis scrollTo on the home page. */
  href: string;
}

/**
 * Order matters twice over: it is the visual order, and nav.css hides `li:first-child` below 380px
 * to reclaim width (the brand mark already links home). Keep "Home" first, or that rule hides the
 * wrong item.
 */
export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/store" },
  { label: "Process", href: "#manufacturing" },
  { label: "Custom", href: "#custom-airframes" },
  { label: "Contact", href: "/contact" },
];

export const SITE = {
  name: "DronesZ India",
  shortName: "DronesZ",
  tagline: "Redefining Flight. Assembling the Future.",
  description:
    "DronesZ India — custom airframes, counter-UAS systems, consumer drones, components, and drone-lab setup. Engineered in Indore.",
  location: "Indore, MP",
} as const;

export interface Pillar {
  title: string;
  body: string;
}

export const PILLARS: Pillar[] = [
  {
    title: "Innovation",
    body: "In-house design and fabrication — from airframe geometry to flight software.",
  },
  {
    title: "Security",
    body: "Counter-UAS and encrypted platforms built for environments that demand trust.",
  },
  {
    title: "Precision",
    body: "Every build flight-tested and validated before it leaves the bench.",
  },
];

export const CONTACT = {
  email: "enquiry.dronesz@gmail.com",
  phone: "+91 98273 44411",
  address: "Indore, Madhya Pradesh, India",
  /** Registered legal entity — shown on every custom-build form (contact + both fork paths) per
   *  the user's explicit request, distinct from the `SITE.name` consumer-facing brand. */
  legalName: "DronesZ Airborne Systems Pvt. Ltd.",
} as const;

export const FOOTER = {
  blurb: "Engineered in Indore. Assembled for the mission.",
  copyright: `© ${new Date().getFullYear()} DronesZ India. All rights reserved.`,
} as const;
