import React from 'react';
import { ParachutePageConfig } from '../services/parachuteConfig';
import './parachute-page.css';

/**
 * Public-facing Parachute Recovery Systems page.
 * Renders inside <PublicStore>'s layout (StitchHeader + StitchFooter already present).
 * All content driven by admin-edited config; layout is fixed to match the reference design.
 */

const FeatureIcons = [
  /* shield */  <svg key="0" className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /></svg>,
  /* hexagon */ <svg key="1" className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12l4-8h10l4 8-4 8H7l-4-8z" /><path d="M8 12h8" /></svg>,
  /* nodes */   <svg key="2" className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 8v6M12 16v-6M18 11v4" /></svg>,
  /* grid */    <svg key="3" className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
];

const Thread = () => (
  <span className="p-thread"><span className="s1"></span><span className="s2"></span><span className="s3"></span></span>
);

interface Props {
  config: ParachutePageConfig;
}

export const ParachutePublicPage: React.FC<Props> = ({ config }) => {
  const c = config;
  const ctaUrl = c.talkToUsUrl || '/contact';

  return (
    <div className="parachute-page">
      {/* ── HERO ── */}
      <section className="p-hero">
        <div className="p-wrap p-hero-grid">
          <div>
            <div className="p-eyebrow">
              <Thread />
              {c.hero.eyebrow}
            </div>
            <h1 className="p-headline">
              {c.hero.headline.replace(/\.$/, '')}<span className="dot">.</span>
            </h1>
            <p className="p-hero-sub">{c.hero.subheading}</p>
            <div className="p-hero-cta">
              <a href={ctaUrl} className="p-btn p-btn-primary">Talk to us</a>
              <a href="#p-range" className="p-btn p-btn-ghost">See the product range</a>
            </div>
          </div>
          <div className="p-stage-panel">
            <h3>Recovery sequence</h3>
            <div className="p-stage-list">
              {c.recoverySequence.map((stage, i) => (
                <div key={i} className={`p-stage-item ${i < 3 ? 'active' : ''}`}>
                  <span className="dot-marker"></span>
                  <span className="label">{stage.label}</span>
                  <span className="desc">{stage.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE STRIP ── */}
      <section className="p-section">
        <div className="p-wrap">
          <div className="p-feature-strip">
            {c.featureStrip.map((feat, i) => (
              <div key={i} className="p-feature">
                {FeatureIcons[i] || FeatureIcons[0]}
                <h4>{feat.title}</h4>
                <p>{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT RANGE ── */}
      <section id="p-range" className="p-section alt">
        <div className="p-wrap">
          <div className="p-sec-head">
            <div>
              <span className="p-sec-label">Product range</span>
              <h2 className="p-sec-title">Off-the-shelf 5–15&nbsp;kg. Custom beyond.</h2>
            </div>
            <p className="p-sec-note">
              {c.productRange.length} MTOW {c.productRange.length === 1 ? 'class' : 'classes'} covering rapid dispatch through fully custom, mission-sized systems.
            </p>
          </div>
          <div className="p-range-rows">
            {c.productRange.filter(r => r.visible).map((row, i) => (
              <div key={i} className="p-range-row">
                <div className="mtow">
                  {row.mtow}<small>kg</small>
                </div>
                <div className="rdesc">{row.description}</div>

                <span className={`p-status-pill ${row.status === 'In stock' ? 'stock' : 'custom'}`}>
                  {row.status}
                </span>

              </div>
            ))}
          </div>

          {/* Engineer split */}
          <div className="p-engineer-split">
            <div className="p-engineer-col">
              <h4>What can be engineered around your UAV?</h4>
              <ul>
                {c.engineerChecklist.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="p-engineer-col callout">
              <h4>Recovery performance is airframe-specific</h4>
              <p>{c.recoveryCallout.paragraph1}</p>
              <p>{c.recoveryCallout.paragraph2}</p>
              <a href={ctaUrl} className="p-btn p-btn-primary p-btn-sm">Talk to us</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CASE STUDIES ── */}
      <section className="p-section">
        <div className="p-wrap">
          <div className="p-sec-head">
            <div>
              <span className="p-sec-label">Case studies</span>
              <h2 className="p-sec-title">Proven on real drones, real missions.</h2>
            </div>
            <p className="p-sec-note">
              Selected deployments where recovery systems have been sized, integrated and drop-tested on Indian UAV platforms.
            </p>
          </div>

          <div className="p-case-rows">
            {c.caseStudies.map((cs, i) => (
              <div key={i} className="p-case-row">
                <div className="p-case-num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="p-case-context">{cs.context}</div>
                  <div className="p-case-title">{cs.title}</div>
                  <p className="p-case-desc">{cs.description}</p>
                </div>
                <div className="p-case-stats">
                  <div className="p-stat-block"><div className="v">{cs.mtow}</div><div className="k">MTOW</div></div>
                  <div className="p-stat-block"><div className="v">{cs.canopy}</div><div className="k">Canopy</div></div>
                  <div className="p-stat-block"><div className="v">{cs.descent}</div><div className="k">Descent</div></div>
                  <div className="p-stat-block"><div className="v">{cs.drops}</div><div className="k">Drops</div></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-case-footnote">
            <p>Detailed technical case reports are available under NDA.</p>
            <a href={ctaUrl} className="p-btn p-btn-ghost p-btn-sm">Talk to engineering →</a>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="p-section alt">
        <div className="p-wrap">
          <div className="p-sec-head">
            <div>
              <span className="p-sec-label">What we do</span>
              <h2 className="p-sec-title">Engineered for the mission.</h2>
            </div>
          </div>
          <div className="p-capability-grid">
            {c.capabilitiesGrid.map((cap, i) => (
              <div key={i} className="p-capability">
                <h4>{cap.title}</h4>
                <p>{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATION PROCESS ── */}
      <section className="p-section">
        <div className="p-wrap">
          <div className="p-sec-head">
            <div>
              <span className="p-sec-label">Integration</span>
              <h2 className="p-sec-title">From airframe assessment to packed unit.</h2>
            </div>
            <p className="p-sec-note">
              DronesZ coordinates the UAV-side requirement while the recovery partner handles system engineering and manufacturing.
            </p>
          </div>

          <div className="p-process-list">
            {c.integrationProcess.map((step, i) => (
              <div key={i} className="p-process-step">
                <div className="pnum">{String(i + 1).padStart(2, '0')}</div>
                <h5>{step.title}</h5>
                <p>{step.description}</p>
              </div>
            ))}
          </div>

          <div className="p-who-row">
            <span className="who-label">Who this is for</span>
            {c.whoTags.map((tag, i) => (
              <span key={i} className="p-pill">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="p-cta-band">
        <div className="p-wrap">
          <Thread />
          <h2>{c.ctaBand.heading}</h2>
          <p>{c.ctaBand.subtext}</p>
          <div className="p-hero-cta">
            <a href={ctaUrl} className="p-btn p-btn-primary">Talk to us</a>
            <a href={ctaUrl} className="p-btn p-btn-ghost">Talk to engineering</a>
          </div>
        </div>
      </section>
    </div>
  );
};
