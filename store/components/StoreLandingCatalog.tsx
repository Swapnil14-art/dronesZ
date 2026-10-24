import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ProductDto,
  fetchPublicChildProducts,
  getProductImageUrl,
  getEffectiveProductStatus
} from '../services/api';
import { ParachutePageConfig } from '../services/parachuteConfig';
import './store-landing.css';

interface StoreLandingCatalogProps {
  parentProducts: ProductDto[];
  search: string;
  setSearch: (val: string) => void;
  loading: boolean;
  error: string | null;
  parachuteConfig: ParachutePageConfig | null;
  navigateToParentSeries: (parent: ProductDto) => void;
  navigateToParachute: () => void;
  navigateToProductDetail: (id: number) => void;
}

export const StoreLandingCatalog: React.FC<StoreLandingCatalogProps> = ({
  parentProducts,
  search,
  setSearch,
  loading,
  error,
  parachuteConfig,
  navigateToParentSeries,
  navigateToParachute,
  navigateToProductDetail,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'motors' | 'frames' | 'parachute'>('all');
  const [childProductsMap, setChildProductsMap] = useState<Record<number, ProductDto[]>>({});
  const [loadingChildren, setLoadingChildren] = useState(false);

  // Pre-fetch children for parent series to showcase authentic hardware specimens & images
  useEffect(() => {
    let isMounted = true;
    const loadHardware = async () => {
      if (parentProducts.length === 0) return;
      setLoadingChildren(true);
      const map: Record<number, ProductDto[]> = {};

      try {
        await Promise.all(
          parentProducts.map(async (p) => {
            try {
              const children = await fetchPublicChildProducts(p.id);
              if (isMounted) {
                map[p.id] = children;
              }
            } catch (e) {
              // Graceful fallback if children endpoint is slow
            }
          })
        );
        if (isMounted) {
          setChildProductsMap(map);
        }
      } finally {
        if (isMounted) setLoadingChildren(false);
      }
    };

    loadHardware();
    return () => {
      isMounted = false;
    };
  }, [parentProducts]);

  // Aggregate all child hardware for quick spec display
  const allChildHardware: { product: ProductDto; categoryLabel: string; parentSlug: string }[] = [];
  parentProducts.forEach((parent) => {
    const children = childProductsMap[parent.id] || [];
    const isFrame = parent.name.toLowerCase().includes('frame');
    const categoryLabel = isFrame ? 'Carbon Airframe' : 'FPV Propulsion';
    const parentSlug = parent.name.toLowerCase().includes('frame') ? 'frames' : 'high-performance-motors-series';

    children.forEach((child) => {
      allChildHardware.push({ product: child, categoryLabel, parentSlug });
    });
  });

  // Identify featured motor (preferring 8017 ID 26 or first motor child)
  const motorsList = childProductsMap[9] || [];
  const featuredMotor = motorsList.find((m) => m.id === 26 || m.name.includes('8017')) || motorsList[0] || null;

  // Filter series based on search & category
  const filteredParents = parentProducts.filter((p) => {
    const isFrame = p.name.toLowerCase().includes('frame');
    const isMotor = p.name.toLowerCase().includes('motor');

    if (activeCategoryFilter === 'frames' && !isFrame) return false;
    if (activeCategoryFilter === 'motors' && !isMotor) return false;
    if (activeCategoryFilter === 'parachute') return false; // Handled separately

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  // Filter hardware list
  const filteredHardware = allChildHardware.filter(({ product, categoryLabel }) => {
    if (activeCategoryFilter === 'frames' && !categoryLabel.includes('Airframe')) return false;
    if (activeCategoryFilter === 'motors' && !categoryLabel.includes('Propulsion')) return false;
    if (activeCategoryFilter === 'parachute') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      (product.description && product.description.toLowerCase().includes(q)) ||
      categoryLabel.toLowerCase().includes(q)
    );
  });

  const isParachuteVisible =
    parachuteConfig &&
    parachuteConfig.isEnabled &&
    (activeCategoryFilter === 'all' || activeCategoryFilter === 'parachute') &&
    (!search.trim() ||
      (parachuteConfig.displayName && parachuteConfig.displayName.toLowerCase().includes(search.toLowerCase())) ||
      'parachute recovery systems for drones'.includes(search.toLowerCase()));

  const scrollToCatalog = () => {
    const el = document.getElementById('store-catalogue');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="store-landing">
      {/* ------------------------------------------------------------
          1. HERO SECTION
          ------------------------------------------------------------ */}
      <section className="store-landing__hero" aria-label="DronesZ Store Hero">
        <div className="store-landing__hero-grid" aria-hidden="true" />
        <div className="store-landing__hero-glow" aria-hidden="true" />

        <div className="store-landing__hero-content">
          <div>
            <div className="store-landing__eyebrow">
              <span className="store-landing__flag-badge">
                <svg
                  width="18"
                  height="12"
                  viewBox="0 0 24 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="store-landing__flag-svg"
                  aria-hidden="true"
                >
                  <rect width="24" height="5.33" fill="#FF9933" rx="1.5" />
                  <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
                  <rect y="10.66" width="24" height="5.33" fill="#138808" rx="1.5" />
                  <circle cx="12" cy="8" r="2.1" stroke="#000080" strokeWidth="0.6" fill="none" />
                  <circle cx="12" cy="8" r="0.6" fill="#000080" />
                </svg>
                Indore Facility
              </span>
              <span>•</span>
              <span>Precision UAV Systems</span>
            </div>

            <h1 className="store-landing__hero-title">
              Aerospace-Grade Drone Hardware.{' '}
              <span className="accent">Engineered in India.</span>
            </h1>

            <p className="store-landing__hero-desc">
              In-house designed carbon airframes, high-voltage brushless propulsion, and autonomous payload recovery systems.
              Engineered, bench-tested, and flight-validated in Indore for demanding mission profiles.
            </p>

            <div className="store-landing__hero-actions">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="store-landing__btn-primary"
              >
                <span>Explore Catalog</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </button>

              <Link href="/frames" className="store-landing__btn-secondary">
                <span>Custom Airframes</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Hardware Telemetry Spec Bar */}
            <div className="store-landing__telemetry-bar">
              <div className="store-landing__telemetry-item">
                <span className="store-landing__telemetry-val">17.1 kg</span>
                <span className="store-landing__telemetry-lbl">Peak Thrust</span>
              </div>
              <div className="store-landing__telemetry-item">
                <span className="store-landing__telemetry-val">5" – 13"</span>
                <span className="store-landing__telemetry-lbl">Carbon Frames</span>
              </div>
              <div className="store-landing__telemetry-item">
                <span className="store-landing__telemetry-val">12S HV</span>
                <span className="store-landing__telemetry-lbl">Power System</span>
              </div>
              <div className="store-landing__telemetry-item">
                <span className="store-landing__telemetry-val">Indore</span>
                <span className="store-landing__telemetry-lbl">Testing Bench</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card with High-Res Motor CAD Specimen */}
          <div className="store-landing__hero-visual">
            <div className="store-landing__visual-card">
              <div className="store-landing__chip-badge store-landing__chip-badge--top">
                <span className="store-landing__chip-dot" />
                <span>DZ-8017 UAV Stator • 120KV</span>
              </div>

              <img
                src={
                  featuredMotor?.image
                    ? getProductImageUrl(featuredMotor.image) || '/manufacturing/stage-2-hd.jpg'
                    : '/manufacturing/stage-2-hd.jpg'
                }
                alt="DronesZ Heavy-Lift UAV Motor Hardware"
                className="store-landing__visual-img"
              />

              <div className="store-landing__chip-badge store-landing__chip-badge--bottom">
                <span style={{ color: '#10b981', fontWeight: 700 }}>3.3 kW</span>
                <span style={{ color: '#94a3b8' }}>| 36N42P Architecture</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------
          2. INDIAN MANUFACTURING IDENTITY
          ------------------------------------------------------------ */}
      <section className="store-landing__mfg-section" aria-label="Indian Manufacturing Excellence">
        <div className="store-landing__section-header">
          <div className="store-landing__section-tag">
            <span style={{ fontSize: '13px' }}>🇮🇳</span>
            <span>Domestic Manufacturing Excellence</span>
          </div>
          <h2 className="store-landing__section-title">
            Advancing India&apos;s Drone Hardware Ecosystem
          </h2>
          <p className="store-landing__section-subtitle">
            In an industry historically reliant on foreign imports, DronesZ designs, machines, and bench-tests
            precision multirotor hardware directly in Indore. We establish domestic engineering capability with
            transparent specifications and flight-proven reliability.
          </p>
        </div>

        <div className="store-landing__mfg-grid">
          {/* Pillar 1 */}
          <div className="store-landing__mfg-card">
            <div className="store-landing__mfg-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2}" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3 className="store-landing__mfg-card-title">
              In-House CAD &amp; Airframe Architecture
            </h3>
            <p className="store-landing__mfg-card-desc">
              From 5-inch cinematic quadcopters to 13-inch heavy-lift geometries, our airframes are modelled,
              FEA-simulated, and CNC-cut from aerospace-grade carbon fiber for maximum payload rigidity and minimum resonance.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="store-landing__mfg-card">
            <div className="store-landing__mfg-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h3 className="store-landing__mfg-card-title">
              Dynamometer Bench Calibration
            </h3>
            <p className="store-landing__mfg-card-desc">
              Every motor series is benchmarked on calibrated thrust stands. We record real-world voltage, RPM, current draw,
              and thermal efficiency across varying throttle curves before publishing exact specifications.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="store-landing__mfg-card">
            <div className="store-landing__mfg-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="store-landing__mfg-card-title">
              Indore Assembly &amp; Flight Testing
            </h3>
            <p className="store-landing__mfg-card-desc">
              Final assembly, stator inspection, balance testing, and parachute ejection checks occur under our direct supervision.
              Hardware is validated in real flight environments to verify reliability in mission-critical deployments.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------
          3. FEATURED ENGINEERING PRODUCT SPOTLIGHT
          ------------------------------------------------------------ */}
      {featuredMotor && (
        <section className="store-landing__spotlight" aria-label="Featured Engineering Product">
          <div className="store-landing__spotlight-grid">
            <div className="store-landing__spotlight-media">
              <img
                src={getProductImageUrl(featuredMotor.image) || '/manufacturing/stage-2-hd.jpg'}
                alt={featuredMotor.name}
                className="store-landing__spotlight-img"
              />
            </div>

            <div>
              <div className="store-landing__spotlight-badge">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e52b31' }} />
                <span>Hardware Spotlight • Heavy-Lift Stator</span>
              </div>

              <h2 className="store-landing__spotlight-title">
                {featuredMotor.name}
              </h2>

              <p className="store-landing__spotlight-desc">
                {featuredMotor.description ||
                  'The DronesZ 8017 120KV is a high-performance heavy-lift UAV motor engineered for demanding industrial drone applications. Designed for 12S systems, it delivers up to 3.3 kW of power and maximum thrust of 17.1 kg.'}
              </p>

              <div className="store-landing__spec-chips-grid">
                <div className="store-landing__spec-chip">
                  <span className="store-landing__spec-chip-val">17,178 g</span>
                  <span className="store-landing__spec-chip-lbl">Max Thrust</span>
                </div>
                <div className="store-landing__spec-chip">
                  <span className="store-landing__spec-chip-val">3,313 W</span>
                  <span className="store-landing__spec-chip-lbl">Peak Power (12S)</span>
                </div>
                <div className="store-landing__spec-chip">
                  <span className="store-landing__spec-chip-val">36N42P</span>
                  <span className="store-landing__spec-chip-lbl">Framework Config</span>
                </div>
                <div className="store-landing__spec-chip">
                  <span className="store-landing__spec-chip-val">28&quot; – 30&quot;</span>
                  <span className="store-landing__spec-chip-lbl">Recommended Prop</span>
                </div>
              </div>

              <div className="store-landing__spotlight-footer">
                <div>
                  <span className="store-landing__spotlight-price">
                    ₹{featuredMotor.price > 0 ? featuredMotor.price.toFixed(2) : '26,200.00'}
                  </span>
                  <span className="store-landing__spotlight-price-sub">
                    GST &amp; Express Dispatch Included
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigateToProductDetail(featuredMotor.id)}
                  className="store-landing__btn-primary"
                  style={{ marginLeft: 'auto' }}
                >
                  <span>Inspect Engineering Specifications</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------
          4. PRODUCT DISCOVERY & CATALOGUE
          ------------------------------------------------------------ */}
      <section id="store-catalogue" className="store-landing__catalogue-section" aria-label="Product Catalogue">
        <div className="store-landing__section-header">
          <div className="store-landing__section-tag">
            <span>Hardware Catalogue</span>
          </div>
          <h2 className="store-landing__section-title">
            Flight Specs &amp; Precision Components
          </h2>
          <p className="store-landing__section-subtitle">
            Browse our core UAV architectures below. Click any series to access full variant configurations,
            cad blueprints, and live ordering options.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="store-landing__filter-bar">
          <div className="store-landing__category-chips">
            <button
              type="button"
              className={`store-landing__chip-btn ${activeCategoryFilter === 'all' ? 'store-landing__chip-btn--active' : ''}`}
              onClick={() => setActiveCategoryFilter('all')}
            >
              All Hardware Systems
            </button>
            <button
              type="button"
              className={`store-landing__chip-btn ${activeCategoryFilter === 'motors' ? 'store-landing__chip-btn--active' : ''}`}
              onClick={() => setActiveCategoryFilter('motors')}
            >
              Propulsion &amp; Motors
            </button>
            <button
              type="button"
              className={`store-landing__chip-btn ${activeCategoryFilter === 'frames' ? 'store-landing__chip-btn--active' : ''}`}
              onClick={() => setActiveCategoryFilter('frames')}
            >
              Carbon Airframes
            </button>
            {parachuteConfig && parachuteConfig.isEnabled && (
              <button
                type="button"
                className={`store-landing__chip-btn ${activeCategoryFilter === 'parachute' ? 'store-landing__chip-btn--active' : ''}`}
                onClick={() => setActiveCategoryFilter('parachute')}
              >
                Recovery Parachutes
              </button>
            )}
          </div>

          <div className="store-landing__search-box">
            <svg
              className="store-landing__search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="store-landing__search-input"
              placeholder="Search components or specs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Flagship Product Series Cards */}
        {loading ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Loading DronesZ Storefront Architecture...
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Connecting to verified database catalog</div>
          </div>
        ) : (
          <>
            <div className="store-landing__series-grid">
              {/* Motors Parent Series */}
              {filteredParents
                .filter((p) => p.name.toLowerCase().includes('motor'))
                .map((parent) => (
                  <div
                    key={parent.id}
                    className="store-landing__series-card"
                    onClick={() => navigateToParentSeries(parent)}
                  >
                    <div className="store-landing__series-thumb-area">
                      <span className="store-landing__series-tag-badge">12S HV Propulsion</span>
                      <img
                        src={
                          featuredMotor?.image
                            ? getProductImageUrl(featuredMotor.image) || '/manufacturing/stage-2-hd.jpg'
                            : '/manufacturing/stage-2-hd.jpg'
                        }
                        alt={parent.name}
                        className="store-landing__series-thumb-img"
                      />
                    </div>
                    <div className="store-landing__series-body">
                      <h3 className="store-landing__series-title">{parent.name}</h3>
                      <p className="store-landing__series-desc">
                        {parent.description ||
                          'Industrial-grade multirotor propulsion stators engineered for high efficiency, high torque, and low thermal load.'}
                      </p>
                      <div className="store-landing__series-footer">
                        <div className="store-landing__series-status">
                          <span className="store-landing__series-status-dot" />
                          <span>Active Series ({childProductsMap[parent.id]?.length || 2} Variants)</span>
                        </div>
                        <button
                          type="button"
                          className="store-landing__series-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToParentSeries(parent);
                          }}
                        >
                          <span>Explore Series</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Frames Parent Series */}
              {filteredParents
                .filter((p) => p.name.toLowerCase().includes('frame'))
                .map((parent) => (
                  <div
                    key={parent.id}
                    className="store-landing__series-card"
                    onClick={() => navigateToParentSeries(parent)}
                  >
                    <div className="store-landing__series-thumb-area">
                      <span className="store-landing__series-tag-badge">CNC 3K Carbon Fiber</span>
                      <img
                        src="/frames/7.webp"
                        alt={parent.name}
                        className="store-landing__series-thumb-img"
                      />
                    </div>
                    <div className="store-landing__series-body">
                      <h3 className="store-landing__series-title">{parent.name}</h3>
                      <p className="store-landing__series-desc">
                        {parent.description ||
                          'Precision-engineered drone frames built for strength, stability, vibration damping, and flight endurance.'}
                      </p>
                      <div className="store-landing__series-footer">
                        <div className="store-landing__series-status">
                          <span className="store-landing__series-status-dot" />
                          <span>Active Series ({childProductsMap[parent.id]?.length || 4} Geometries)</span>
                        </div>
                        <button
                          type="button"
                          className="store-landing__series-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToParentSeries(parent);
                          }}
                        >
                          <span>Explore Series</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Autonomous Parachute Recovery Systems Card */}
              {isParachuteVisible && (
                <div
                  className="store-landing__series-card"
                  onClick={navigateToParachute}
                >
                  <div className="store-landing__series-thumb-area">
                    <span className="store-landing__series-tag-badge">Payload Safety</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#e52b31' }}>
                      <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                  </div>
                  <div className="store-landing__series-body">
                    <h3 className="store-landing__series-title">
                      {parachuteConfig.displayName || 'Parachute systems for drones'}
                    </h3>
                    <p className="store-landing__series-desc">
                      {parachuteConfig.hero.subheading ||
                        'Engineered autonomous recovery systems for critical payload protection and emergency airframe descent.'}
                    </p>
                    <div className="store-landing__series-footer">
                      <div className="store-landing__series-status">
                        <span className="store-landing__series-status-dot" />
                        <span>Autonomous System</span>
                      </div>
                      <button
                        type="button"
                        className="store-landing__series-link-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToParachute();
                        }}
                      >
                        <span>Explore Recovery Systems</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Individual Hardware Components & Specs Section */}
            {filteredHardware.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}>
                    Hardware Components &amp; Stators
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    {filteredHardware.length} verified item{filteredHardware.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="store-landing__hardware-grid">
                  {filteredHardware.map(({ product, categoryLabel }) => {
                    const status = getEffectiveProductStatus(product);
                    const isAvailable = status === 'AVAILABLE';

                    return (
                      <div
                        key={product.id}
                        className="store-landing__hw-card"
                        onClick={() => navigateToProductDetail(product.id)}
                      >
                        <div className="store-landing__hw-media">
                          <img
                            src={
                              product.image
                                ? getProductImageUrl(product.image) || '/frames/5.webp'
                                : product.name.includes('5')
                                  ? '/frames/5.webp'
                                  : product.name.includes('7')
                                    ? '/frames/7.webp'
                                    : product.name.includes('10')
                                      ? '/frames/10.webp'
                                      : product.name.includes('13')
                                        ? '/frames/13.webp'
                                        : '/manufacturing/stage-2-hd.jpg'
                            }
                            alt={product.name}
                            className="store-landing__hw-img"
                            loading="lazy"
                          />
                        </div>

                        <div className="store-landing__hw-info">
                          <span className="store-landing__hw-category">{categoryLabel}</span>
                          <h4 className="store-landing__hw-title">{product.name}</h4>

                          <div className="store-landing__hw-price-row">
                            <div>
                              <span className="store-landing__hw-price">
                                {product.price > 0 ? `₹${product.price.toFixed(2)}` : 'Spec-Based'}
                              </span>
                              <span style={{
                                display: 'block',
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: isAvailable ? '#059669' : '#dc2626',
                                marginTop: '2px'
                              }}>
                                ● {status.replace('_', ' ')}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="store-landing__hw-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToProductDetail(product.id);
                              }}
                            >
                              Inspect Specs
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredParents.length === 0 && !isParachuteVisible && filteredHardware.length === 0 && (
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))',
                borderRadius: '0.5rem',
                padding: '3rem 2rem',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                  No Hardware Found
                </div>
                <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                  No products match &quot;{search}&quot;. Try searching for &quot;motor&quot;, &quot;frame&quot;, or &quot;8017&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="store-landing__btn-secondary"
                  style={{ color: '#0f172a', borderColor: '#cbd5e1' }}
                >
                  Clear Search Filter
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ------------------------------------------------------------
          5. CLOSING CONSULTATION SECTION
          ------------------------------------------------------------ */}
      <section className="store-landing__closing" aria-label="Custom Engineering Consultation">
        <div className="store-landing__closing-text">
          <h3 className="store-landing__closing-title">
            Need Custom UAV Architecture or Fleet Hardware?
          </h3>
          <p className="store-landing__closing-desc">
            Whether you require tailored stator windings, custom airframe geometry, or comprehensive
            payload integration, our engineering lab in Indore provides end-to-end consulting and prototyping.
          </p>
        </div>

        <div className="store-landing__closing-actions">
          <Link href="/contact?source=store" className="store-landing__btn-primary">
            <span>Consult Our Engineering Team</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={scrollToCatalog}
            className="store-landing__btn-secondary"
            style={{ color: '#0f172a', borderColor: '#cbd5e1' }}
          >
            <span>Back to Top</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
};
