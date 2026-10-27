import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ProductDto,
  CategoryDto,
  fetchPublicChildProducts,
  fetchPublicCategories,
  getProductImageUrl,
  getEffectiveProductStatus
} from '../services/api';
import { ParachutePageConfig } from '../services/parachuteConfig';
import { getDefaultAgriDroneConfig, AgriDronePageConfig } from '../services/agriDroneConfig';
import { getProductTaxLabel } from '../services/productTax';
import {
  DynamicCategoryTab,
  buildDynamicTabs,
  buildAllIndividualProducts,
  filterHardwareProducts,
} from '../services/dynamicStoreTabs';
import {
  LayoutGrid,
  Cog,
  Frame,
  Drone,
  Layers,
  Camera,
  Battery,
  Cpu,
  Package,
} from 'lucide-react';
import './store-landing.css';

const renderTabIcon = (tab: DynamicCategoryTab) => {
  if (tab.type === 'all') {
    return <LayoutGrid size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }
  if (tab.type === 'parachute') {
    return <ParachuteIcon size={15} strokeWidth={2} className="store-landing__chip-icon" />;
  }
  if (tab.type === 'agri') {
    return <Drone size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }

  const norm = tab.name.trim().toLowerCase();
  if (norm.includes('motor')) {
    return <Cog size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }
  if (norm.includes('frame')) {
    return <Frame size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }
  if (norm.includes('propeller') || norm.includes('prop')) {
    return <Layers size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }
  if (norm.includes('drone') || norm.includes('uav')) {
    return <Drone size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }
  if (norm.includes('camera') || norm.includes('gimbal')) {
    return <Camera size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }
  if (norm.includes('battery') || norm.includes('power')) {
    return <Battery size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }
  if (norm.includes('electronic') || norm.includes('esc') || norm.includes('sensor')) {
    return <Cpu size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
  }
  return <Package size={15} strokeWidth={2} className="store-landing__chip-icon" aria-hidden="true" />;
};

// Parachute Recovery Icon matching Lucide 24x24 stroke aesthetic
const ParachuteIcon: React.FC<{ size?: number; className?: string; strokeWidth?: number }> = ({
  size = 15,
  className,
  strokeWidth = 2,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3a9 9 0 0 0-9 9c3-1 6-1 9-1s6 0 9 1a9 9 0 0 0-9-9z" />
    <path d="M3 12c2.5 3.5 6.5 8 9 9" />
    <path d="M21 12c-2.5 3.5-6.5 8-9 9" />
    <path d="M12 11v10" />
    <circle cx="12" cy="21" r="1" fill="currentColor" />
  </svg>
);

interface StoreLandingCatalogProps {
  parentProducts: ProductDto[];
  standaloneProducts?: ProductDto[];
  search: string;
  setSearch: (val: string) => void;
  loading: boolean;
  error: string | null;
  parachuteConfig: ParachutePageConfig | null;
  agriDroneConfig?: AgriDronePageConfig | null;
  navigateToParentSeries: (parent: ProductDto) => void;
  navigateToParachute: () => void;
  navigateToAgriDrone?: () => void;
  navigateToProductDetail: (id: number) => void;
}

export const StoreLandingCatalog: React.FC<StoreLandingCatalogProps> = ({
  parentProducts,
  standaloneProducts,
  search,
  setSearch,
  loading,
  error,
  parachuteConfig,
  agriDroneConfig,
  navigateToParachute,
  navigateToAgriDrone,
  navigateToProductDetail,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [childProductsMap, setChildProductsMap] = useState<Record<number, ProductDto[]>>({});
  const [loadingChildren, setLoadingChildren] = useState(false);

  // Fetch official database categories dynamically
  useEffect(() => {
    let isMounted = true;
    fetchPublicCategories()
      .then((cats) => {
        if (isMounted) setCategories(cats);
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Dynamically derive all category tabs from database categories and parent series
  const dynamicTabs = useMemo(() => {
    return buildDynamicTabs(
      categories,
      parentProducts,
      Boolean(parachuteConfig && parachuteConfig.isEnabled),
      true
    );
  }, [categories, parentProducts, parachuteConfig]);

  // Keep active category filter valid if a selected category is deleted or renamed in admin
  useEffect(() => {
    const exists = dynamicTabs.some((t) => t.id === activeCategoryFilter);
    if (!exists) {
      setActiveCategoryFilter('all');
    }
  }, [dynamicTabs, activeCategoryFilter]);

  // Aggregate individual purchasable products across all parent series and categories
  const allIndividualProducts = useMemo(() => {
    return buildAllIndividualProducts(
      parentProducts,
      childProductsMap,
      categories,
      dynamicTabs,
      standaloneProducts
    );
  }, [parentProducts, childProductsMap, categories, dynamicTabs, standaloneProducts]);

  // Filter individual hardware products based on active tab and search query
  const filteredHardware = useMemo(() => {
    return filterHardwareProducts(allIndividualProducts, activeCategoryFilter, search);
  }, [allIndividualProducts, activeCategoryFilter, search]);

  const activeAgriConfig = agriDroneConfig || getDefaultAgriDroneConfig();

  // Standalone Parachute Card visibility (only on the Recovery Parachutes tab)
  const isParachuteVisible =
    Boolean(parachuteConfig && parachuteConfig.isEnabled) &&
    activeCategoryFilter === 'parachute' &&
    (!search.trim() ||
      (parachuteConfig?.displayName && parachuteConfig.displayName.toLowerCase().includes(search.toLowerCase())) ||
      'parachute recovery systems for drones'.includes(search.toLowerCase()));

  // Standalone Agricultural Drone Card visibility (only on the Agricultural Drones tab)
  const isAgriDroneVisible =
    activeCategoryFilter === 'agri' &&
    (!search.trim() ||
      (activeAgriConfig.displayName && activeAgriConfig.displayName.toLowerCase().includes(search.toLowerCase())) ||
      'agricultural spraying drone hexacopter rpas 10l precision spraying'.includes(search.toLowerCase()));

  const handleAgriDroneClick = () => {
    if (navigateToAgriDrone) {
      navigateToAgriDrone();
    } else {
      const targetSlug = activeAgriConfig.slug || 'agricultural-spraying-drone';
      window.location.href = `/store/${targetSlug}`;
    }
  };
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
      <br></br><br></br><br></br>
      {/* ------------------------------------------------------------
          1. HERO SECTION — MADE IN BHARAT · INDIGENOUS TECHNOLOGY
          Aerospace HUD / Mission Control aesthetic (Full-Bleed Landscape)
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
        <span className="store-landing__hud-coord store-landing__hud-coord--tl" aria-hidden="true">22.7196° N · LAB-01</span>
        <span className="store-landing__hud-coord store-landing__hud-coord--tr" aria-hidden="true">75.8577° E · INDORE</span>
        <span className="store-landing__hud-coord store-landing__hud-coord--bl" aria-hidden="true">ALT 553m · AS9100D</span>
        <span className="store-landing__hud-coord store-landing__hud-coord--br" aria-hidden="true">SYS-OK · DZ–MFG–01</span>

        {/* Main content layer — 3-zone widescreen landscape layout */}
        <div className="store-landing__hero-content">
          {/* Left Flank: Indigenous R&D punchlines */}
          <div className="store-landing__hero-flank store-landing__hero-flank--left">
            <div className="store-landing__flank-tag">
              <span className="store-landing__flank-pulse store-landing__flank-pulse--saffron" aria-hidden="true" />
              <span>// INDIGENOUS UAV PLATFORMS</span>
            </div>
            <div className="store-landing__flank-headline">
              Zero Import Dependency
            </div>
            <div className="store-landing__flank-sub">
              100% In-House R&amp;D · Stators, ESCs &amp; Airframes
            </div>
            <div className="store-landing__flank-chips">
              <span className="store-landing__flank-chip">12S HV Propulsion</span>
              <span className="store-landing__flank-chip">CNC 3K Carbon</span>
            </div>
          </div>

          {/* Center Stage: Core Made In Bharat display */}
          <div className="store-landing__hero-center">
            {/* Facility & performance badge */}
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
              <span>Precision Under Extreme Conditions</span>
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
            </p>
          </div>

          {/* Right Flank: Operational & Certification punchlines */}
          <div className="store-landing__hero-flank store-landing__hero-flank--right">
            <div className="store-landing__flank-tag">
              <span className="store-landing__flank-pulse store-landing__flank-pulse--green" aria-hidden="true" />
              <span>// OPERATIONAL ENDURANCE</span>
            </div>
            <div className="store-landing__flank-headline">
              Built For Extreme Missions
            </div>
            <div className="store-landing__flank-sub">
              High Altitude, Severe Thermals &amp; Heavy Payloads
            </div>
            <div className="store-landing__flank-chips">
              <span className="store-landing__flank-chip">DGCA Certified Platform</span>
              <span className="store-landing__flank-chip">Ballistic Safety</span>
            </div>
          </div>
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
            {dynamicTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`store-landing__chip-btn ${activeCategoryFilter === tab.id ? 'store-landing__chip-btn--active' : ''}`}
                onClick={() => setActiveCategoryFilter(tab.id)}
              >
                {renderTabIcon(tab)}
                <span>{tab.name}</span>
              </button>
            ))}
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

        {/* Loading State */}
        {loading && filteredHardware.length === 0 && !isParachuteVisible && !isAgriDroneVisible && (
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Synchronizing DronesZ verified propulsion and airframe series...
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Connecting to hardware catalog</div>
          </div>
        )}

        {/* Standalone Exception Systems Grid (Recovery Parachutes & Agricultural Drones) */}
        {(isParachuteVisible || isAgriDroneVisible) && (
          <div className="store-landing__series-grid">
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
                    {parachuteConfig?.displayName || 'Parachute systems for drones'}
                  </h3>
                  <p className="store-landing__series-desc">
                    {parachuteConfig?.hero?.subheading ||
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
                onClick={handleAgriDroneClick}
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
                    {activeAgriConfig.displayName || 'Agricultural Spraying Drone'}
                  </h3>
                  <p className="store-landing__series-desc">
                    {activeAgriConfig.hero?.tagline ||
                      activeAgriConfig.hero?.subheading ||
                      'Medium class hexacopter RPAS with 10L tank, 4 flat-jet nozzles, 6x 2399W heavy-lift BLDC motors, and 23-minute endurance.'}
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
                        handleAgriDroneClick();
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
        )}

        {/* Individual Hardware Components & Specs Section */}
        {filteredHardware.length > 0 && (
          <div style={{ marginTop: (isParachuteVisible || isAgriDroneVisible) ? '2rem' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{
                fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0f172a'
              }}>
                {activeCategoryFilter === 'motors'
                  ? 'High-Performance Motors & Stators'
                  : activeCategoryFilter === 'frames'
                    ? 'Precision Drone Frames'
                    : 'Hardware Components & Stators'}
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                {filteredHardware.length} verified item{filteredHardware.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="store-landing__hardware-grid">
              {filteredHardware.map(({ product, categoryLabel }) => {
                const status = getEffectiveProductStatus(product);
                const isAvailable = status === 'AVAILABLE';
                const isFrame = categoryLabel.toLowerCase().includes('frame') || product.name.toLowerCase().includes('frame');
                const defaultFallback = isFrame ? '/frames/7.webp' : '/manufacturing/stage-2-hd.jpg';

                return (
                  <div
                    key={product.id}
                    className="store-landing__hw-card"
                    onClick={() => navigateToProductDetail(product.id)}
                  >
                    <div className="store-landing__hw-media">
                      <img
                        src={resolveProductImage(product, defaultFallback)}
                        alt={product.name}
                        className="store-landing__hw-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = defaultFallback;
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
                          {product.price > 0 && getProductTaxLabel(product) && (
                            <span className="store-landing__hw-tax-label">
                              {getProductTaxLabel(product)}
                            </span>
                          )}
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

        {!isParachuteVisible && !isAgriDroneVisible && filteredHardware.length === 0 && !loading && !loadingChildren && (
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
              {search
                ? `No products match "${search}". Try searching for "motor", "frame", or "8017".`
                : 'No products are currently available in this category.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="store-landing__btn-secondary"
                style={{ color: '#0f172a', borderColor: '#cbd5e1' }}
              >
                Clear Search Filter
              </button>
            )}
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
