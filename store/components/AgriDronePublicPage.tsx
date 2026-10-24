import React from 'react';
import Link from 'next/link';
import { AgriDronePageConfig } from '../services/agriDroneConfig';
import './agri-drone-page.css';

interface Props {
  config: AgriDronePageConfig;
}

export const AgriDronePublicPage: React.FC<Props> = ({ config }) => {
  const c = config;
  const ctaUrl = c.talkToUsUrl || '/contact';

  return (
    <div className="agri-drone-page" id="agri-drone-root">
      {/* ── BREADCRUMB STRIP ── */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
        <div className="agri-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}>
          <Link href="/store" style={{ color: '#0f172a', fontWeight: 600 }}>Store</Link>
          <span>/</span>
          <span style={{ color: '#15803d', fontWeight: 600 }}>Agricultural Spraying Drone</span>
        </div>
      </div>

      {/* ── 1. PRODUCT HERO ── */}
      <section className="agri-hero" aria-label="Agricultural Spraying Drone Overview">
        <div className="agri-wrap agri-hero-grid">
          <div>
            <div className="agri-hero-badge">
              <span className="agri-badge-dot" aria-hidden="true" />
              <span>{c.hero.eyebrow}</span>
            </div>

            <div className="agri-thread" aria-hidden="true">
              <span className="t-saffron" />
              <span className="t-white" />
              <span className="t-green" />
            </div>

            <h1 className="agri-hero-title">{c.hero.headline}</h1>
            <div className="agri-hero-tagline">{c.hero.tagline}</div>
            <p className="agri-hero-sub">{c.hero.subheading}</p>

            <div className="agri-hero-cta">
              <a href={ctaUrl} className="agri-btn agri-btn-green">
                <span>Request Commercial Quotation</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#agri-specs" className="agri-btn agri-btn-ghost">
                <span>Technical Specifications</span>
              </a>
            </div>

            <div className="agri-hero-meta">
              <div className="agri-hero-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>DGCA Type Certified</span>
              </div>
              <div className="agri-hero-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>23 Min Endurance</span>
              </div>
              <div className="agri-hero-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Indore Manufacturing Facility</span>
              </div>
            </div>
          </div>

          <div className="agri-hero-media">
            <img
              src="/agri-drone/hero_drone.png"
              alt="Agricultural Spraying Drone hexacopter configuration in flight over agricultural crop fields"
              className="agri-hero-img"
              width={1055}
              height={500}
            />
            <div className="agri-hero-overlay-tag">
              <span>HEXACOPTER • 10L SWATH ARCHITECTURE</span>
              <span>AUW 30.15 KG</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. KEY METRICS STRIP ── */}
      <section className="agri-section" aria-label="Core Performance Specifications">
        <div className="agri-wrap">
          <div className="agri-metrics-grid">
            {c.metrics.map((metric, i) => (
              <div key={i} className="agri-metric-card">
                <div className="agri-metric-val">
                  <span>{metric.value}</span>
                  {metric.unit && <small>{metric.unit}</small>}
                </div>
                <div className="agri-metric-label">{metric.label}</div>
                <p className="agri-metric-desc">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. DGCA CERTIFICATION BANNER ── */}
      <section className="agri-section agri-section-alt" aria-label="Regulatory Airworthiness Certification">
        <div className="agri-wrap">
          <div className="agri-cert-banner">
            <div>
              <div className="agri-cert-badge-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Civil Aviation Authority Certified</span>
              </div>
              <h2 className="agri-cert-title">{c.certification.title}</h2>
              <p className="agri-cert-info">
                Fully evaluated, flight tested, and certified for commercial agricultural operations across India in strict accordance with the Directorate General of Civil Aviation (DGCA) airworthiness guidelines.
              </p>

              <div className="agri-cert-meta-grid">
                <div className="agri-cert-meta-box">
                  <div className="k">Type Certificate No.</div>
                  <div className="v">{c.certification.certificateNo}</div>
                </div>
                <div className="agri-cert-meta-box">
                  <div className="k">Statutory Rule</div>
                  <div className="v">{c.certification.regulation}</div>
                </div>
                <div className="agri-cert-meta-box">
                  <div className="k">Aircraft Classification</div>
                  <div className="v">{c.certification.classType}</div>
                </div>
              </div>
            </div>

            <div className="agri-cert-seal-wrap">
              <img
                src="/agri-drone/dgca_cert_badge.png"
                alt="DGCA Type Certified Certificate No. T05260000094/00"
                className="agri-cert-seal-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SUBSYSTEM & FEATURE HIGHLIGHTS ── */}
      <section className="agri-section" aria-label="Subsystem Engineering Highlights">
        <div className="agri-wrap">
          <div className="agri-sec-head">
            <span className="agri-sec-eyebrow">Aeronautical Engineering</span>
            <h2 className="agri-sec-title">Built for Real Field Deployment</h2>
            <p className="agri-sec-subtitle">
              Every component is sized and integrated for precision droplet distribution, high duty cycles in harsh weather, and fast field turnarounds.
            </p>
          </div>

          <div className="agri-features-grid">
            {c.featureHighlights.map((feat, i) => (
              <div key={i} className="agri-feature-card">
                {feat.imageSrc && (
                  <div className="agri-feature-img-box">
                    <img src={feat.imageSrc} alt={feat.title} className="agri-feature-img" />
                    {feat.badge && <span className="agri-feature-badge">{feat.badge}</span>}
                  </div>
                )}
                <div className="agri-feature-body">
                  <h3 className="agri-feature-title">{feat.title}</h3>
                  <p className="agri-feature-desc">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TECHNICAL SPECIFICATIONS TABLE ── */}
      <section id="agri-specs" className="agri-section agri-section-alt" aria-label="Technical Specifications">
        <div className="agri-wrap">
          <div className="agri-sec-head">
            <span className="agri-sec-eyebrow">Verified Flight Specifications</span>
            <h2 className="agri-sec-title">Comprehensive Product Specifications</h2>
            <p className="agri-sec-subtitle">
              Accurate technical ratings and configurations published directly from type-certified design documentation.
            </p>
          </div>

          <div className="agri-specs-grid">
            {c.specifications.map((group, i) => (
              <div key={i} className="agri-spec-category">
                <h3 className="agri-spec-cat-title">{group.category}</h3>
                <div className="agri-spec-list">
                  {group.items.map((item, j) => (
                    <div key={j} className="agri-spec-row">
                      <span className="agri-spec-label">{item.label}</span>
                      <span className="agri-spec-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FLIGHT SAFETY & FAILSAFE AVIONICS ── */}
      <section className="agri-section" aria-label="Avionics and Flight Safety Systems">
        <div className="agri-wrap">
          <div className="agri-sec-head">
            <span className="agri-sec-eyebrow">Avionics &amp; Failsafe Systems</span>
            <h2 className="agri-sec-title">Redundant Safety by Design</h2>
            <p className="agri-sec-subtitle">
              Ensuring pilot confidence, crop protection, and strict airspace compliance with certified automatic intervention systems.
            </p>
          </div>

          <div className="agri-safety-grid">
            {c.flightSafetyFeatures.map((safety, i) => (
              <div key={i} className="agri-safety-card">
                <div className="agri-safety-icon-wrap" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <circle cx="12" cy="11" r="3" />
                  </svg>
                </div>
                <h4>{safety.title}</h4>
                <p>{safety.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. ENQUIRY / CTA BAND ── */}
      <section className="agri-cta-band" aria-label="Request Commercial Deployment Quotation">
        <div className="agri-wrap">
          <div className="agri-cta-content">
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div className="agri-thread" aria-hidden="true">
                <span className="t-saffron" />
                <span className="t-white" />
                <span className="t-green" />
              </div>
            </div>
            <h2 className="agri-cta-title">Deploy Agricultural UAV Technology for Your Operations</h2>
            <p className="agri-cta-sub">
              Connect with our aerospace engineering and field deployment team in Indore to schedule an operational demonstration, request technical datasheets, or discuss fleet procurement.
            </p>

            <div className="agri-cta-actions">
              <a href={ctaUrl} className="agri-btn agri-btn-green">
                <span>Talk to Technical Sales</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <Link href="/store" className="agri-btn agri-btn-ghost">
                <span>Back to Store Catalogue</span>
              </Link>
            </div>

            <div className="agri-cta-email-tag">
              Direct Enquiry Desk:{' '}
              <a href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a>
              {' · '}DronesZ Indore Facility
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
