import type { Metadata } from "next";
import { CustomProcess, CustomFork } from "@/components/frames/CustomAirframesSection";
import { Footer } from "@/components/footer/Footer";
import { SITE } from "@/data/site";
import "@/components/sections.css";

export const metadata: Metadata = {
  title: `Custom Airframes & Frames — ${SITE.name}`,
  description:
    "Bespoke drone airframes, precision carbon fabrication, counter-UAS platforms, and engineering from CAD to flight-ready hardware.",
};

export default function FramesPage() {
  return (
    <main style={{ paddingTop: "5rem" }}>
      <CustomProcess />
      <CustomFork />
      <Footer />
    </main>
  );
}
