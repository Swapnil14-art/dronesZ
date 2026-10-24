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
  navigateToAgriDrone?: () => void;
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
  navigateToAgriDrone,
  navigateToProductDetail,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'motors' | 'frames' | 'parachute' | 'agri'>('all');
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
    if (activeCategoryFilter === 'agri') return false; // Handled separately

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
    if (activeCategoryFilter === 'agri') return false;

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

  const isAgriDroneVisible =
    (activeCategoryFilter === 'all' || activeCategoryFilter === 'agri') &&
    (!search.trim() ||
      'agricultural spraying drone hexacopter rpas 10l precision spraying'.includes(search.toLowerCase()));
  const resolveProductImage = (
    item?: ProductDto | null,
    fallbackUrl: string = '/manufacturing/stage-2-hd.jpg'
  ): string => {
    if (!item) return fallbackUrl;

    // 1. Direct image property uploaded in admin parent/child class
    if (item.image && typeof item.image === 'string' && item.image.trim()) {
      const resolved = getProductImageUrl(item.image.trim());
      if (resolved) return resolved;
    }

    // 2. primaryImage object
    if (item.primaryImage?.url && item.primaryImage.url.trim()) {
      const resolved = getProductImageUrl(item.primaryImage.url.trim());
      if (resolved) return resolved;
    }

    // 3. images array
    if (item.images && item.images.length > 0) {
      const primary = item.images.find((img) => img.isPrimary) || item.images[0];
      if (primary?.url && primary.url.trim()) {
        const resolved = getProductImageUrl(primary.url.trim());
        if (resolved) return resolved;
      }
    }

    // 4. If this is a parent series without an image, check children
    if (item.id && childProductsMap[item.id] && childProductsMap[item.id].length > 0) {
      for (const child of childProductsMap[item.id]) {
        if (child.image && typeof child.image === 'string' && child.image.trim()) {
          const resolved = getProductImageUrl(child.image.trim());
          if (resolved) return resolved;
        }
        if (child.primaryImage?.url && child.primaryImage.url.trim()) {
          const resolved = getProductImageUrl(child.primaryImage.url.trim());
          if (resolved) return resolved;
        }
        if (child.images && child.images.length > 0 && child.images[0]?.url?.trim()) {
          const resolved = getProductImageUrl(child.images[0].url.trim());
          if (resolved) return resolved;
        }
      }
    }

    return fallbackUrl;
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('store-catalogue');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="store-landing">
      {/* ------------------------------------------------------------
          1. HERO SECTION — MADE IN BHARAT · INDIGENOUS TECHNOLOGY
          Aerospace HUD / Mission Control aesthetic
          ------------------------------------------------------------ */}
      <section className="store-landing__hero" aria-label="Made In Bharat — Indigenous Technology">
        {/* Layered background effects */}
        <div className="store-landing__hero-noise" aria-hidden="true" />
        <div className="store-landing__hero-grid" aria-hidden="true" />
        <div className="store-landing__hero-scanline" aria-hidden="true" />
        <div className="store-landing__hero-vignette" aria-hidden="true" />

        {/* Saffron & Green ambient light pools */}
        <div className="store-landing__hero-aura store-landing__hero-aura--saffron" aria-hidden="true" />
        <div className="store-landing__hero-aura store-landing__hero-aura--green" aria-hidden="true" />

        {/* Ashoka Chakra — animated radar-sweep SVG */}
        <div className="store-landing__chakra-wrap" aria-hidden="true">
          <svg className="store-landing__chakra" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Concentric rings */}
            <circle cx="100" cy="100" r="96" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="72" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="48" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="24" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            {/* Cross-hairs */}
            <line x1="100" y1="2" x2="100" y2="198" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <line x1="2" y1="100" x2="198" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            {/* 24-spoke Ashoka Chakra lines */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={100 + 20 * Math.cos(angle)}
                  y1={100 + 20 * Math.sin(angle)}
                  x2={100 + 96 * Math.cos(angle)}
                  y2={100 + 96 * Math.sin(angle)}
                  stroke="rgba(255,255,255,0.025)"
                  strokeWidth="0.5"
                />
              );
            })}
            {/* Radar sweep beam */}
            <line x1="100" y1="100" x2="100" y2="4" stroke="url(#sweepGrad)" strokeWidth="1.5" className="store-landing__radar-beam" />
            <defs>
              <linearGradient id="sweepGrad" x1="100" y1="100" x2="100" y2="4" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(255,153,51,0)" />
                <stop offset="60%" stopColor="rgba(255,153,51,0.25)" />
                <stop offset="100%" stopColor="rgba(255,153,51,0.6)" />
              </linearGradient>
            </defs>
            {/* Center pip */}
            <circle cx="100" cy="100" r="2.5" fill="#FF9933" className="store-landing__chakra-pip" />
          </svg>
        </div>

        {/* Indian tricolor bottom edge */}
        <div className="store-landing__hero-tricolor" aria-hidden="true" />

        {/* HUD corner coordinates */}
        <span className="store-landing__hud-coord store-landing__hud-coord--tl" aria-hidden="true">22.7196° N</span>
        <span className="store-landing__hud-coord store-landing__hud-coord--tr" aria-hidden="true">75.8577° E</span>
        <span className="store-landing__hud-coord store-landing__hud-coord--bl" aria-hidden="true">ALT 553m</span>
        <span className="store-landing__hud-coord store-landing__hud-coord--br" aria-hidden="true">DZ–MFG–01</span>

        {/* Main content layer */}
        <div className="store-landing__hero-content">
          {/* Facility badge */}
          <div className="store-landing__hero-badge">
            <span className="store-landing__badge-pulse" aria-hidden="true" />
            <svg
              width="16"
              height="11"
              viewBox="0 0 24 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="store-landing__flag-svg"
              aria-hidden="true"
            >
              <rect width="24" height="5.33" fill="#FF9933" rx="1" />
              <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
              <rect y="10.66" width="24" height="5.33" fill="#138808" rx="1" />
              <circle cx="12" cy="8" r="2" stroke="#000080" strokeWidth="0.5" fill="none" />
              <circle cx="12" cy="8" r="0.5" fill="#000080" />
            </svg>
            <span>Indore Manufacturing Facility</span>
          </div>

          {/* Main display — stacked typographic lockup */}
          <h1 className="store-landing__hero-display" aria-label="Made In Bharat">
            <span className="store-landing__hero-line-top">Made In</span>
            <span className="store-landing__hero-line-bottom">Bharat</span>
          </h1>

          {/* Divider rule with tricolor gradient */}
          <div className="store-landing__hero-rule" aria-hidden="true" />

          {/* Sub-tagline */}
          <p className="store-landing__hero-tagline">
            <span className="store-landing__tagline-label">Indigenous Technology</span>
            <span className="store-landing__tagline-sep" aria-hidden="true" />
            <span className="store-landing__tagline-detail">Precision UAV Engineering · Indore, MP</span>
          </p>
        </div>
      </section>
      {/* ------------------------------------------------------------
          2. PRODUCT DISCOVERY & CATALOGUE
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
              Motors
            </button>
            <button
              type="button"
              className={`store-landing__chip-btn ${activeCategoryFilter === 'frames' ? 'store-landing__chip-btn--active' : ''}`}
              onClick={() => setActiveCategoryFilter('frames')}
            >
              Frames
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
            <button
              type="button"
              className={`store-landing__chip-btn ${activeCategoryFilter === 'agri' ? 'store-landing__chip-btn--active' : ''}`}
              onClick={() => setActiveCategoryFilter('agri')}
            >
              Agricultural Drones
            </button>
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
        {loading && filteredParents.length === 0 && (
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Synchronizing DronesZ verified propulsion and airframe series...
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Connecting to hardware catalog</div>
          </div>
        )}

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
                    src={resolveProductImage(
                      parent,
                      featuredMotor?.image
                        ? getProductImageUrl(featuredMotor.image) || '/manufacturing/stage-2-hd.jpg'
                        : '/manufacturing/stage-2-hd.jpg'
                    )}
                    alt={parent.name}
                    className="store-landing__series-thumb-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/manufacturing/stage-2-hd.jpg';
                    }}
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
                    src={resolveProductImage(parent, '/frames/7.webp')}
                    alt={parent.name}
                    className="store-landing__series-thumb-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/frames/7.webp';
                    }}
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

          {/* Other Parent Categories uploaded via Admin */}
          {filteredParents
            .filter((p) => !p.name.toLowerCase().includes('motor') && !p.name.toLowerCase().includes('frame'))
            .map((parent) => (
              <div
                key={parent.id}
                className="store-landing__series-card"
                onClick={() => navigateToParentSeries(parent)}
              >
                <div className="store-landing__series-thumb-area">
                  <span className="store-landing__series-tag-badge">
                    {parent.categoryName || 'Aerospace System'}
                  </span>
                  <img
                    src={resolveProductImage(parent, '/manufacturing/stage-1-hd.jpg')}
                    alt={parent.name}
                    className="store-landing__series-thumb-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/manufacturing/stage-1-hd.jpg';
                    }}
                  />
                </div>
                <div className="store-landing__series-body">
                  <h3 className="store-landing__series-title">{parent.name}</h3>
                  <p className="store-landing__series-desc">
                    {parent.description ||
                      'Precision-engineered aerospace subsystem components built for high-reliability flight operations.'}
                  </p>
                  <div className="store-landing__series-footer">
                    <div className="store-landing__series-status">
                      <span className="store-landing__series-status-dot" />
                      <span>Active Series ({childProductsMap[parent.id]?.length || 0} Variants)</span>
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

          {/* Standalone Agricultural Spraying Drone Card */}
          {isAgriDroneVisible && (
            <div
              className="store-landing__series-card"
              onClick={() => {
                if (navigateToAgriDrone) navigateToAgriDrone();
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="store-landing__series-thumb-area">
                <span className="store-landing__series-tag-badge" style={{ background: '#15803d', color: '#ffffff' }}>
                  DGCA Type Certified
                </span>
                <img
                  src="/agri-drone/store_card_thumb.png"
                  alt="Agricultural Spraying Drone hexacopter platform"
                  className="store-landing__series-thumb-img"
                />
              </div>
              <div className="store-landing__series-body">
                <h3 className="store-landing__series-title">
                  Agricultural Spraying Drone
                </h3>
                <p className="store-landing__series-desc">
                  Medium class hexacopter RPAS with 10L tank, 4 flat-jet nozzles, 6x 2399W heavy-lift BLDC motors, and 23-minute endurance.
                </p>
                <div className="store-landing__series-footer">
                  <div className="store-landing__series-status">
                    <span className="store-landing__series-status-dot" style={{ background: '#16a34a', boxShadow: '0 0 6px rgba(22, 163, 74, 0.5)' }} />
                    <span>DGCA Type Certified RPAS</span>
                  </div>
                  <button
                    type="button"
                    className="store-landing__series-link-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigateToAgriDrone) navigateToAgriDrone();
                    }}
                  >
                    <span>Explore Drone</span>
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
                        src={resolveProductImage(
                          product,
                          product.name.includes('5')
                            ? '/frames/5.webp'
                            : product.name.includes('7')
                              ? '/frames/7.webp'
                              : product.name.includes('10')
                                ? '/frames/10.webp'
                                : product.name.includes('13')
                                  ? '/frames/13.webp'
                                  : '/manufacturing/stage-2-hd.jpg'
                        )}
                        alt={product.name}
                        className="store-landing__hw-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/manufacturing/stage-2-hd.jpg';
                        }}
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

        {filteredParents.length === 0 && !isParachuteVisible && !isAgriDroneVisible && filteredHardware.length === 0 && !loading && (
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
      </section>

      {/* ------------------------------------------------------------
          3. CLOSING CONSULTATION SECTION
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
