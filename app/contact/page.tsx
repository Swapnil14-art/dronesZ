import type { Metadata } from "next";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CustomBuildForm } from "@/components/custom/CustomBuildForm";
import { CONTACT, SITE } from "@/data/site";
import "@/components/sections.css";
import "./contact.css";

export const metadata: Metadata = {
  title: `Contact — ${SITE.name}`,
  description:
    "Talk to DronesZ India about custom builds, counter-UAS, and lab setup.",
};

/**
 * Contact page. Path-aware: the Custom Airframes fork links here with `?path=design|idea`,
 * so the intent carries through into tailored copy + a pre-addressed email brief.
 * The validated form mounts in the right panel once storage/email-provider are chosen;
 * until then the panel is a working email path so custom-build leads are never lost.
 */

type PathKey = "design" | "idea";

interface ContactCopy {
  chip: string | null;
  title: string;
  lead: string;
  /** What to include so a first email is actually useful. */
  checklist: string[];
  /** Pre-filled email subject, so replies land in the right bucket. */
  subject: string;
  ctaLabel: string;
}

const PATH_COPY: Record<PathKey, ContactCopy> = {
  design: {
    chip: "Option A · I have a design",
    title: "Send us your design.",
    lead: "Share your CAD or STEP files and the mission they're built for. We validate them, optimize for manufacturability, and come back with a build plan.",
    checklist: [
      "CAD or STEP files (or a link to them)",
      "Target frame size and payload",
      "Timeline and quantity",
    ],
    subject: "Custom build — I have a design",
    ctaLabel: "Email us your brief",
  },
  idea: {
    chip: "Option B · I have an idea",
    title: "Let's engineer your idea.",
    lead: "Tell us the mission and what you have so far — even a rough sketch. Our team takes it from requirements to a finished, flight-ready airframe.",
    checklist: [
      "The mission the airframe needs to fly",
      "Any sketches, references, or constraints",
      "Timeline and quantity",
    ],
    subject: "Custom build — I have an idea",
    ctaLabel: "Email us your brief",
  },
};

const DEFAULT_COPY: ContactCopy = {
  chip: null,
  title: "Tell us about the mission.",
  lead: "Custom builds, counter-UAS, consumer drones, or standing up a lab — we'll call you back.",
  checklist: [
    "What you're building, or need built",
    "Timeline and quantity",
    "The best way to reach you",
  ],
  subject: "DronesZ enquiry",
  ctaLabel: "Email us",
};

// Validate the param at the boundary — anything but the two known paths → default.
function resolveCopy(path?: string): ContactCopy {
  return path === "design" || path === "idea" ? PATH_COPY[path] : DEFAULT_COPY;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const { path } = await searchParams;
  const copy = resolveCopy(path);
  const formPath = path === "design" || path === "idea" ? path : "general";

  return (
    <main style={{ paddingTop: "5rem" }}>
      <section className="section contact-page" aria-labelledby="contact-title">
        <div className="contact-page__intro">
          <SectionLabel>Get in touch</SectionLabel>
          {copy.chip && <p className="contact-page__chip">{copy.chip}</p>}
          <h1 id="contact-title" className="contact-page__title">
            {copy.title}
          </h1>
          <p className="contact-page__lead">{copy.lead}</p>
          <ul className="contact-page__details">
            <li>
              <span>Email</span>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            <li>
              <span>Phone</span>
              <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
                {CONTACT.phone}
              </a>
            </li>
            <li>
              <span>Studio</span>
              <p>{CONTACT.address}</p>
            </li>
          </ul>
        </div>

        <div className="contact-page__form">
          <p className="contact-panel__eyebrow">What to include</p>
          <ul className="contact-panel__checklist">
            {copy.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <CustomBuildForm path={formPath} />
        </div>
      </section>
    </main>
  );
}
