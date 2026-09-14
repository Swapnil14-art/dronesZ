"use client";

import {
  Lock,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  type LucideIcon,
} from "lucide-react";
import "./mission-spec.css";

interface SpecItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const specs: SpecItem[] = [
  {
    icon: Lock,
    title: "Secured supply chain",
    description: "Vetted, traceable sourcing on every component.",
  },
  {
    icon: Clock,
    title: "Less lead time",
    description: "Production built to move faster than the industry norm.",
  },
  {
    icon: ShieldCheck,
    title: "Manufacturing in India",
    description: "Local assembly, local accountability.",
  },
  {
    icon: SlidersHorizontal,
    title: "Low MOQ, customisation available",
    description: "Small orders, still built to your spec.",
  },
  {
    icon: Target,
    title: "Built for every mission",
    description: "From survey flights to defence-grade deployment.",
  },
];

export function MissionSpecSection() {
  return (
    <section className="mission-spec-section">
      <div className="mission-spec-container">
        {/* Left column — headline + tagline */}
        <div className="mission-spec-left">
          <div className="mission-spec-badge">
            <span className="mission-spec-badge__line" />
            <span className="mission-spec-badge__text">
              Engineered in India
            </span>
          </div>

          <h2 className="mission-spec-heading">
            Build. Fly. <span className="mission-spec-heading__accent">Beyond.</span>
          </h2>

          <p className="mission-spec-lead">
            Drones, data and defence platforms engineered and manufactured under
            one roof — from airframe to deployment.
          </p>

          <p className="mission-spec-subhead">
            Engineering what takes flight.
          </p>
          <p className="mission-spec-subtext">
            Everything below is designed, sourced and assembled in-house.
          </p>
        </div>

        {/* Right column — spec panel */}
        <div className="mission-spec-card">
          <span className="mission-spec-card__label">
            DRONESZ / SYSTEM SPEC
          </span>

          {specs.map(({ icon: Icon, title, description }) => (
            <div key={title} className="mission-spec-item">
              <Icon
                className="mission-spec-item__icon"
                strokeWidth={1.6}
              />
              <div className="mission-spec-item__body">
                <h4 className="mission-spec-item__title">
                  {title}
                </h4>
                <p className="mission-spec-item__desc">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MissionSpecSection;
