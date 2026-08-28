import { HeroSection } from "@/components/hero/HeroSection";
import { PreBuiltFramesSection } from "@/components/frames/PreBuiltFramesSection";
import { CustomAirframesSection } from "@/components/frames/CustomAirframesSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { Footer } from "@/components/footer/Footer";

/**
 * Frames-only cinematic spine (scope pivot 2026-06-30): Hero → the 4 pre-built frame stories as
 * pinned scrollytelling panels → Custom Airframes (two-path fork; its cards route to the /contact
 * form) → Contact → Footer. The pre-pivot multi-category sections (Pillars / Chapter / Lab) are
 * shelved, not deleted — their components remain on disk, unimported.
 */
export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <PreBuiltFramesSection />
      <CustomAirframesSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
