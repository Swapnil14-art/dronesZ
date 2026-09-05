import React, { useState, useEffect } from 'react';
import {
  ProductDto,
  ProductContentSectionDto,
  fetchPublicProducts,
  fetchPublicChildProducts,
  fetchPublicProductById,
  getProductImageUrl
} from '../services/api';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from '../components/UserAuthModal';
import { StitchHeader } from '../components/StitchHeader';
import { StitchFooter } from '../components/StitchFooter';
import { ProductGallery } from '../components/ProductGallery';

const RenderContentSection: React.FC<{ section: ProductContentSectionDto }> = ({ section }) => {
  if (section.type === 'WORD') {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))',
        padding: '2rem',
        borderRadius: '0.75rem',
        marginBottom: '2rem',
        width: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'break-word',
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-on-surface, #0f172a)',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))',
        }}>
          {section.title}
        </h3>
        <div
          className="word-content-box"
          style={{
            fontSize: '1rem',
            color: 'var(--color-on-surface-variant, #475569)',
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      </div>
    );
  }

  // EXCEL Table Box
  let tableData: { headers: string[]; rows: string[][] } = { headers: [], rows: [] };
  try {
    if (section.content && section.content.trim()) {
      tableData = JSON.parse(section.content);
    }
  } catch (e) {
    // fallback
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))',
      padding: '2rem',
      borderRadius: '0.75rem',
      marginBottom: '2rem',
      width: '100%',
      boxSizing: 'border-box',
      overflowWrap: 'break-word',
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--color-on-surface, #0f172a)',
        marginBottom: '1.25rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))',
      }}>
        {section.title}
      </h3>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left',
        }}>
          {tableData.headers && tableData.headers.length > 0 && (
            <thead>
              <tr style={{ background: 'var(--color-surface-container-low, #f8fafc)', borderBottom: '2px solid var(--color-outline, #e2e8f0)' }}>
                {tableData.headers.map((header, idx) => (
                  <th key={idx} style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--color-on-surface, #0f172a)' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {tableData.rows && tableData.rows.map((row, rIdx) => (
              <tr key={rIdx} style={{
                borderBottom: '1px solid var(--color-outline, #e2e8f0)',
                background: rIdx % 2 === 1 ? 'rgba(248, 250, 252, 0.5)' : '#ffffff'
              }}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: '0.75rem 1rem', color: 'var(--color-on-surface-variant, #475569)' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CartIcon = ({ size = 18, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const ArrowRightIcon = ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ArrowLeftIcon = ({ size = 18, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CheckCircleIcon = ({ size = 18, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const PublicStore: React.FC = () => {
  const { isAuthenticated, addToCart } = useUserAuth();

  // Main catalog products (STANDALONE & PARENT)
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Parent Series Page State (when at /store/parent_name)
  const [activeParent, setActiveParent] = useState<ProductDto | null>(null);
  const [childProducts, setChildProducts] = useState<ProductDto[]>([]);
  const [loadingChildren, setLoadingChildren] = useState<boolean>(false);

  // Active Product Detail Page State (when at /products/:id)
  const [activeProductDetail, setActiveProductDetail] = useState<ProductDto | null>(null);
  const [loadingProductDetail, setLoadingProductDetail] = useState<boolean>(false);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Search & Availability Filters
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Customer Auth Modal State
  const [isUserAuthOpen, setIsUserAuthOpen] = useState<boolean>(false);
  const [userAuthMode, setUserAuthMode] = useState<'login' | 'signup'>('login');
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null);
  const [cartFeedbackMsg, setCartFeedbackMsg] = useState<string | null>(null);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  useEffect(() => {
    handleUrlRouting();
    const onPopState = () => handleUrlRouting();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!activeParent && !activeProductDetail) {
      loadMainCatalog();
    }
  }, [search, selectedStatus]);

  const handleUrlRouting = async () => {
    const pathname = window.location.pathname;

    if (pathname.startsWith('/store/') && pathname.length > 7) {
      const param = pathname.substring(7);
      setActiveProductDetail(null);
      await loadParentSeriesPage(param);
    } else if (pathname.startsWith('/products/') && pathname.length > 10) {
      const param = pathname.substring(10);
      setActiveParent(null);
      await loadProductDetailPage(param);
    } else {
      setActiveParent(null);
      setActiveProductDetail(null);
      await loadMainCatalog();
    }
  };

  const loadMainCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPublicProducts({
        search: search.trim() || undefined,
        status: selectedStatus || undefined,
        size: 50,
      });
      setProducts(res.content);
    } catch (err: any) {
      setError('Unable to load storefront catalog. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductDetailPage = async (param: string) => {
    setLoadingProductDetail(true);
    setError(null);
    setSelectedQuantity(1);
    try {
      const idMatch = param.match(/\d+$/);
      const id = idMatch ? Number(idMatch[0]) : Number(param);
      if (!isNaN(id)) {
        const prod = await fetchPublicProductById(id);
        if (prod) {
          setActiveProductDetail(prod);
        } else {
          setError(`Product ID "${param}" not found.`);
          setActiveProductDetail(null);
        }
      } else {
        setError(`Invalid product ID "${param}".`);
        setActiveProductDetail(null);
      }
    } catch (err: any) {
      setError('Failed to load product specifications page.');
      setActiveProductDetail(null);
    } finally {
      setLoadingProductDetail(false);
    }
  };

  const navigateToProductDetail = (productId: number) => {
    navigateTo(`/products/${productId}`);
  };

  const loadParentSeriesPage = async (param: string) => {
    setLoadingChildren(true);
    setError(null);
    try {
      const parentRes = await fetchPublicProducts({ size: 100 });
      const parents = parentRes.content.filter((p) => p.productType === 'PARENT');

      let matchedParent = parents.find((p) => slugify(p.name) === param || `${slugify(p.name)}-${p.id}` === param || p.id.toString() === param);

      if (!matchedParent) {
        const idMatch = param.match(/\d+$/);
        if (idMatch) {
          const id = Number(idMatch[0]);
          try {
            const prod = await fetchPublicProductById(id);
            if (prod && prod.productType === 'PARENT') {
              matchedParent = prod;
            }
          } catch (e) {
            // ignore
          }
        }
      }

      if (matchedParent) {
        setActiveParent(matchedParent);
        const children = await fetchPublicChildProducts(matchedParent.id);
        setChildProducts(children);
      } else {
        setError(`Product series "${param}" not found.`);
        setActiveParent(null);
      }
    } catch (err: any) {
      setError('Failed to load parent series webpage.');
    } finally {
      setLoadingChildren(false);
    }
  };

  const navigateToMainStore = () => {
    setActiveParent(null);
    setActiveProductDetail(null);
    setSearch('');
    setSelectedStatus('');
    navigateTo('/store');
  };

  const navigateToParentSeries = (parentProduct: ProductDto) => {
    const slug = slugify(parentProduct.name);
    navigateTo(`/store/${slug}`);
  };

  const handleAddToCart = async (product: ProductDto, quantity: number = 1) => {
    setCartFeedbackMsg(null);
    if (!isAuthenticated) {
      setUserAuthMode('login');
      setIsUserAuthOpen(true);
      return;
    }

    try {
      setAddingToCartId(product.id);
      await addToCart(product.id, quantity);
      setCartFeedbackMsg(`Added ${quantity > 1 ? `${quantity} × ` : ''}"${product.name}" to cart!`);
      setTimeout(() => setCartFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  const parentProducts = products.filter((p) => p.productType === 'PARENT');

  const filteredChildProducts = childProducts.filter((c) => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !selectedStatus || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Shared Stitch Header Navigation */}
      <StitchHeader activePage="store" />

      {/* Cart Feedback Toast */}
      {cartFeedbackMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--color-primary)',
            color: '#fff',
            padding: '1rem 1.5rem',
            borderRadius: '0.375rem',
            fontWeight: 700,
            boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircleIcon size={20} />
          {cartFeedbackMsg}
        </div>
      )}

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: 'var(--max-width)', width: '100%', margin: '0 auto', padding: '3rem 2rem 5rem 2rem' }}>
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem', borderRadius: '0.375rem', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {/* Hero Section (only on main store catalog view) */}
        {!activeParent && !activeProductDetail && (
          <section style={{ maxWidth: '800px', marginBottom: '4rem' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              marginBottom: '1rem'
            }}>
              — PRODUCT CATALOG
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 1.8rem + 2.5vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--color-on-surface)',
              marginBottom: '1.25rem',
              textWrap: 'balance'
            }}><br></br>
              DronesZ Flight Specs &amp; Components
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.6, maxWidth: '650px' }}>
              Engineering-grade multirotor systems designed for cinematic precision and high-performance tactical applications.
            </p>
          </section>
        )}
        {/* VIEW 1: DEDICATED FULL-PAGE E-COMMERCE PRODUCT DETAILS (/products/{id}) */}
        {loadingProductDetail ? (
          <div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Loading DronesZ Hardware Specifications...</div>
            <div style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>Fetching live database record for specimen ID</div>
          </div>
        ) : activeProductDetail ? (
          <div className="product-detail-page-container" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {/* Breadcrumb & Navigation Header */}
            <br></br>
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--color-outline)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', color: 'var(--color-on-surface-variant)', flexWrap: 'wrap' }}>
                <span
                  onClick={navigateToMainStore}
                  style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-primary)' }}
                >
                  Store Catalog
                </span>
                <span>/</span>
                <span style={{ textTransform: 'capitalize' }}>
                  {activeProductDetail.productType.toLowerCase().replace('_', ' ')}
                </span>
                <span>/</span>
                <span style={{ fontWeight: 700, color: 'var(--color-on-surface)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {activeProductDetail.name}
                </span>
              </div>

              <button
                onClick={navigateToMainStore}
                className="btn-stitch-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
              >
                <ArrowLeftIcon size={18} />
                Back to Store Catalog
              </button>
            </nav>

            {/* Primary Hero Section: 2-Column Responsive E-Commerce Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              marginBottom: '4rem',
              alignItems: 'start',
              width: '100%',
              minWidth: 0
            }}>
              {/* Left Column: Multi-Image Amazon-style Product Gallery */}
              <div style={{ width: '100%', minWidth: 0 }}>
                <ProductGallery
                  productId={activeProductDetail.id}
                  productName={activeProductDetail.name}
                  productType={activeProductDetail.productType}
                  images={activeProductDetail.images}
                  primaryImageUrl={activeProductDetail.image}
                />

                {/* Feature Badges Grid underneath image */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginTop: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ background: 'var(--color-surface-container-low)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Dispatched</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)', marginTop: '0.2rem' }}>{activeProductDetail.dispatchTime || '24-48 Hours'}</div>
                  </div>
                  <div style={{ background: 'var(--color-surface-container-low)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Warranty</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)', marginTop: '0.2rem' }}>{activeProductDetail.warranty || '1-Yr Factory'}</div>
                  </div>
                  <div style={{ background: 'var(--color-surface-container-low)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Grade</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)', marginTop: '0.2rem' }}>{activeProductDetail.grade || 'Aero Precision'}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: E-Commerce Product Meta & Purchasing Options */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  DRONESZ PRECISION MULTIROTOR
                </div>

                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 1.6rem + 1.8vw, 2.75rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-on-surface)',
                  marginBottom: '1rem',
                  lineHeight: 1.15,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word'
                }}>
                  {activeProductDetail.name}
                </h1>

                {/* Stock & Status Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: activeProductDetail.status === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: activeProductDetail.status === 'AVAILABLE' ? 'var(--color-tertiary)' : 'var(--color-error)',
                    border: `1px solid ${activeProductDetail.status === 'AVAILABLE' ? 'var(--color-tertiary)' : 'var(--color-error)'}`
                  }}>
                    ● {activeProductDetail.status.replace('_', ' ')}
                  </span>

                  <span style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Inventory Level: <strong style={{ color: 'var(--color-on-surface)' }}>{activeProductDetail.quantity} units in stock</strong>
                  </span>
                </div>

                {/* Price Card */}
                <div style={{
                  background: 'var(--color-surface-container-low)',
                  border: '1px solid var(--color-outline)',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Unit Retail Price
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2.75rem', fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                      ₹{activeProductDetail.price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>
                      ({activeProductDetail.taxNote || (activeProductDetail.taxInclusive !== false ? 'GST & Taxes Included' : 'Excl. Taxes')})
                    </span>
                  </div>
                </div>

                {/* Quantity Stepper & Add to Cart Action */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Select Quantity
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Quantity Stepper */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid var(--color-outline)',
                      borderRadius: '0.5rem',
                      background: '#fff',
                      overflow: 'hidden'
                    }}>
                      <button
                        disabled={selectedQuantity <= 1}
                        onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                        style={{
                          padding: '0.75rem 1rem',
                          border: 'none',
                          background: 'none',
                          cursor: selectedQuantity <= 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          color: 'var(--color-on-surface)'
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={activeProductDetail.quantity || 99}
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(Math.max(1, Math.min(activeProductDetail.quantity || 99, parseInt(e.target.value) || 1)))}
                        style={{
                          width: '50px',
                          textAlign: 'center',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '1rem',
                          outline: 'none',
                          color: 'var(--color-on-surface)'
                        }}
                      />
                      <button
                        disabled={selectedQuantity >= (activeProductDetail.quantity || 99)}
                        onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                        style={{
                          padding: '0.75rem 1rem',
                          border: 'none',
                          background: 'none',
                          cursor: selectedQuantity >= (activeProductDetail.quantity || 99) ? 'not-allowed' : 'pointer',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          color: 'var(--color-on-surface)'
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Total Price preview */}
                    <div style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                      Total: <strong style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>₹{(activeProductDetail.price * selectedQuantity).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                  <button
                    disabled={activeProductDetail.status !== 'AVAILABLE' || addingToCartId === activeProductDetail.id}
                    onClick={() => handleAddToCart(activeProductDetail, selectedQuantity)}
                    className="btn-stitch-primary"
                    style={{
                      width: '100%',
                      padding: '1.1rem 2rem',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <CartIcon size={22} />
                    {addingToCartId === activeProductDetail.id
                      ? 'Adding to Cart...'
                      : activeProductDetail.status === 'AVAILABLE'
                        ? `Add ${selectedQuantity} ${selectedQuantity > 1 ? 'Units' : 'Unit'} to Cart`
                        : 'Currently Out of Stock'}
                  </button>

                  {activeProductDetail.status === 'AVAILABLE' && (
                    <button
                      onClick={async () => {
                        await handleAddToCart(activeProductDetail, selectedQuantity);
                        navigateTo('/checkout');
                      }}
                      className="btn-stitch-ghost"
                      style={{
                        width: '100%',
                        padding: '0.85rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        border: '1px solid var(--color-outline)'
                      }}
                    >
                      Proceed directly to Buy Now &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Below Fold: Detailed Specifications & Technical Documentation */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2.5rem',
              marginBottom: '4rem',
              width: '100%',
              minWidth: 0
            }}>
              {/* Description Panel */}
              <div style={{
                background: '#fff',
                border: '1px solid var(--color-outline)',
                padding: '2rem',
                borderRadius: '0.75rem',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-outline)'
                }}>
                  Overview &amp; Product Description
                </h3>

                {activeProductDetail.description ? (
                  <p style={{
                    fontSize: '1rem',
                    color: 'var(--color-on-surface-variant)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                    margin: 0
                  }}>
                    {activeProductDetail.description}
                  </p>
                ) : (
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                    No additional text description provided for this product specimen in the database catalog.
                  </p>
                )}
              </div>

              {/* Specifications Table Panel */}
              <div style={{
                background: '#fff',
                border: '1px solid var(--color-outline)',
                padding: '2rem',
                borderRadius: '0.75rem',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-outline)'
                }}>
                  Technical Specifications Matrix
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '14px', width: '100%', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-outline)', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>System Product ID</span>
                    <strong style={{ color: 'var(--color-on-surface)' }}>#{activeProductDetail.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-outline)', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Classification Category</span>
                    <strong style={{ color: 'var(--color-on-surface)', textTransform: 'uppercase' }}>{activeProductDetail.productType.replace('_', ' ')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-outline)', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Inventory Quantity</span>
                    <strong style={{ color: 'var(--color-on-surface)' }}>{activeProductDetail.quantity} Units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-outline)', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Availability State</span>
                    <strong style={{ color: activeProductDetail.status === 'AVAILABLE' ? 'var(--color-tertiary)' : 'var(--color-error)' }}>
                      {activeProductDetail.status.replace('_', ' ')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Database Reference</span>
                    <strong style={{ color: 'var(--color-on-surface)' }}>Live Synchronized</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Product Content Boxes (WORD & EXCEL) */}
            {activeProductDetail.contentSections && activeProductDetail.contentSections.filter(s => s.enabled !== false).length > 0 && (
              <div style={{ marginTop: '1rem', marginBottom: '4rem', width: '100%' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--color-primary)',
                  textTransform: 'uppercase',
                  marginBottom: '1.25rem'
                }}>
                  Product Documentation &amp; Technical Reports
                </div>
                {activeProductDetail.contentSections
                  .filter(s => s.enabled !== false)
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((sec) => (
                    <RenderContentSection key={sec.id} section={sec} />
                  ))}
              </div>
            )}
          </div>
        ) : activeParent ? (
          /* VIEW 2: DEDICATED PARENT SERIES WEBPAGE (/store/parent_name) */
          <div>
            <div className="parent-series-card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="badge-parent" style={{ marginBottom: '0.75rem' }}>
                    PARENT SERIES
                  </span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-on-surface)', marginTop: '0.4rem' }}>
                    {activeParent.name}
                  </h2>
                  {activeParent.description && (
                    <p style={{ fontSize: '1rem', color: 'var(--color-on-surface-variant)', marginTop: '0.5rem', maxWidth: '800px', lineHeight: 1.5 }}>
                      {activeParent.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={navigateToMainStore}
                  className="btn-stitch-ghost"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowLeftIcon size={18} />
                  Back to Store Catalog
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
              <input
                type="text"
                className="stitch-input"
                placeholder={`Search models in ${activeParent.name}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: '1 1 300px' }}
              />

              <select
                className="stitch-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="">All Availability</option>
                <option value="AVAILABLE">Available</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="COMING_SOON">Coming Soon</option>
              </select>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              Series Variant Models ({filteredChildProducts.length})
            </div>

            {loadingChildren ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                Loading product variants for {activeParent.name}...
              </div>
            ) : filteredChildProducts.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid var(--color-outline)', padding: '4rem', textAlign: 'center', color: 'var(--color-muted)', borderRadius: '0.5rem' }}>
                No child variants listed for this parent series.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredChildProducts.map((child) => (
                  <div
                    key={child.id}
                    className="stitch-product-card"
                    onClick={() => navigateToProductDetail(child.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="image-void-stage">
                      {child.image ? (
                        <img src={getProductImageUrl(child.image)!} alt={child.name} className="product-img" />
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase' }}>
                          DRONESZ SPECIMEN
                        </span>
                      )}
                      <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <span className="badge-category">MODEL VARIANT</span>
                      </div>
                    </div>

                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.3rem', lineHeight: 1.3 }}>
                        {child.name}
                      </h4>

                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: child.status === 'AVAILABLE' ? 'var(--color-tertiary)' : (child.status === 'OUT_OF_STOCK' ? 'var(--color-error)' : 'var(--color-amber)'),
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase'
                      }}>
                        {child.status.replace('_', ' ')}
                      </div>

                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto', marginBottom: '1rem' }}>
                        ₹{child.price.toFixed(2)}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <button
                          disabled={child.status !== 'AVAILABLE' || addingToCartId === child.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(child);
                          }}
                          className="btn-stitch-primary"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <CartIcon size={18} />
                          {addingToCartId === child.id ? 'Adding...' : (child.status === 'AVAILABLE' ? 'Add to Cart' : 'Out of Stock')}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToProductDetail(child.id);
                          }}
                          className="btn-stitch-ghost"
                          title="View Product Details"
                        >
                          Specs
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 3: ROOT STORE CATALOG WEBPAGE (/ or /store) */
          <div>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '3rem' }}>
              <input
                type="text"
                className="stitch-input"
                placeholder="Search catalog products & flight components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: '1 1 300px' }}
              />

              <select
                className="stitch-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="">All Availability</option>
                <option value="AVAILABLE">Available</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="COMING_SOON">Coming Soon</option>
              </select>
            </div>

            {/* Parent Series Grid Section */}
            {parentProducts.length > 0 && (
              <section style={{ marginBottom: '4rem' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: 'var(--color-on-surface-variant)',
                  textTransform: 'uppercase',
                  marginBottom: '1.5rem'
                }}>
                  Parent Series
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {parentProducts.map((parent) => (
                    <div
                      key={parent.id}
                      className="parent-series-card"
                      onClick={() => navigateToParentSeries(parent)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="badge-parent" style={{ marginBottom: '1rem' }}>
                        PARENT SERIES
                      </div>

                      <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.4rem' }}>
                        {parent.name}
                      </h3>

                      {parent.description && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-on-surface-variant)', marginBottom: '1rem', lineHeight: 1.4 }}>
                          {parent.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-tertiary)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-tertiary)', textTransform: 'uppercase' }}>
                          AVAILABLE
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToParentSeries(parent);
                        }}
                        className="btn-stitch-secondary-link"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        Explore Variant Series
                        <ArrowRightIcon size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                Loading DronesZ storefront catalog...
              </div>
            ) : parentProducts.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid var(--color-outline)', padding: '4rem', textAlign: 'center', color: 'var(--color-muted)', borderRadius: '0.5rem' }}>
                No product series found matching your search query.
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Customer Account Modal */}
      <UserAuthModal
        isOpen={isUserAuthOpen}
        initialMode={userAuthMode}
        onClose={() => setIsUserAuthOpen(false)}
      />

      {/* Shared Stitch Footer */}
      <StitchFooter />
    </div>
  );
};
