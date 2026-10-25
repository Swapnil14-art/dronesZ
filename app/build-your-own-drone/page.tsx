import type { Metadata } from "next";
import { BuildYourOwnDrone } from "@/components/drone-builder/BuildYourOwnDrone";
import { Footer } from "@/components/footer/Footer";
import { SITE } from "@/data/site";
import "@/components/sections.css";

export const metadata: Metadata = {
  title: `Build Your Own Drone — ${SITE.name}`,
  description:
    "Configure bespoke multi-rotor, VTOL, and fixed-wing UAV architectures tailored to your operational specifications. In-house engineering, payload tuning, and flight testing in Indore, India.",
  alternates: {
    canonical: "/build-your-own-drone",
  },
  openGraph: {
    title: `Build Your Own Drone — ${SITE.name}`,
    description:
      "Configure custom multi-rotor, VTOL, and fixed-wing UAV architectures with tailored payloads, range, flight endurance, and EO/IR sensor suites.",
  },
};

export default function BuildYourOwnDronePage() {
  return (
    <main style={{ paddingTop: "5rem" }}>
      <BuildYourOwnDrone />
      <Footer />
    </main>
  );
}
