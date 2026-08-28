import { Inter, Space_Grotesk } from "next/font/google";

// Body / UI — neutral, highly legible. Placeholder pairing; /design brief confirms finals before Phase 6.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Display — geometric character for hero + section headings.
export const display = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "700"],
  variable: "--font-display",
});
