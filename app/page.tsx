import { HeroSection } from "@/components/hero/HeroSection";
import { ManufacturingProcessSection } from "@/components/manufacturing/ManufacturingProcessSection";
import { CustomAirframesSection } from "@/components/frames/CustomAirframesSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { Footer } from "@/components/footer/Footer";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ManufacturingProcessSection />
      <CustomAirframesSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
