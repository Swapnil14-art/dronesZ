import { SectionLabel } from "@/components/ui/SectionLabel";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { LinkButton } from "@/components/ui/Button";
import "@/components/sections.css";

/** Home-page contact teaser → routes to /contact (design-brief §4, §8). */
export function ContactSection() {
  return (
    <section className="section" aria-labelledby="contact-teaser-title">
      <div className="contact-teaser">
        <SectionLabel>Get in touch</SectionLabel>
        <AnimatedText as="h2" className="contact-teaser__title">
          <span id="contact-teaser-title">
            Have a mission? Let&apos;s build for it.
          </span>
        </AnimatedText>
        <LinkButton href="/contact" variant="primary">
          Talk to us →
        </LinkButton>
      </div>
    </section>
  );
}
