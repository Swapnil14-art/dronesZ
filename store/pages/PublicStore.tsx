import React, { useState, useEffect } from 'react';
import {
  ProductDto,
  ProductContentSectionDto,
  fetchPublicProducts,
  fetchPublicChildProducts,
  fetchPublicProductById,
  getProductImageUrl,
  getEffectiveProductStatus
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
  const { isAuthenticated, addToCart, cart } = useUserAuth();

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
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'quad'>('single');

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
    setSelectedPackage('single');
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
      let matchedParent = products.find(
        (p) => p.productType === 'PARENT' && (slugify(p.name) === param || `${slugify(p.name)}-${p.id}` === param || p.id.toString() === param)
      );

      if (!matchedParent) {
        const idMatch = param.match(/\d+$/);
        const numericId = idMatch ? Number(idMatch[0]) : (!isNaN(Number(param)) ? Number(param) : null);

        if (numericId) {
          const [prod, children] = await Promise.all([
            fetchPublicProductById(numericId).catch(() => null),
            fetchPublicChildProducts(numericId).catch(() => [])
          ]);
          if (prod && prod.productType === 'PARENT') {
            setActiveParent(prod);
            setChildProducts(children);
            return;
          }
        }

        const parentRes = await fetchPublicProducts({ size: 50 });
        const parents = parentRes.content.filter((p) => p.productType === 'PARENT');
        matchedParent = parents.find(
          (p) => slugify(p.name) === param || `${slugify(p.name)}-${p.id}` === param || p.id.toString() === param
        );
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
    const effStatus = getEffectiveProductStatus(product);
    const availableStock = product.quantity !== undefined && product.quantity !== null ? product.quantity : 0;

    if (effStatus !== 'AVAILABLE' || availableStock <= 0) {
      alert(`"${product.name}" is currently out of stock.`);
      return;
    }

    const currentInCart = cart?.items?.find((i) => i.productId === product.id)?.quantity || 0;
    if (currentInCart + quantity > availableStock) {
      const remaining = Math.max(0, availableStock - currentInCart);
      if (remaining === 0) {
        alert(`You already have the maximum available stock (${availableStock} units) of "${product.name}" in your cart.`);
      } else {
        alert(`Cannot add ${quantity} units. Only ${remaining} more unit(s) available for "${product.name}" (you already have ${currentInCart} in your cart).`);
      }
      return;
    }

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
    const effStatus = getEffectiveProductStatus(c);
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !selectedStatus || effStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div
      className={`${activeProductDetail ? '' : 'blueprint-bg'} min-h-screen flex flex-col pt-24`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: activeProductDetail ? '#ffffff' : undefined
      }}
    >
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
            {/* Breadcrumb Navigation */}
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: '#64748b',
              gap: '0.45rem',
              marginBottom: '2rem',
              flexWrap: 'wrap',
            }}>
              <span
                onClick={navigateToMainStore}
                style={{ cursor: 'pointer', color: '#64748b', transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                Catalog
              </span>
              <span style={{ color: '#cbd5e1' }}>/</span>
              <span style={{ color: '#64748b' }}>
                {activeProductDetail.categoryName || 'FPV Propulsion'}
              </span>
              <span style={{ color: '#cbd5e1' }}>/</span>
              <span style={{ color: '#64748b' }}>
                {activeProductDetail.productType === 'CHILD' ? 'Stators & Motors' : (activeProductDetail.productType?.toLowerCase().replace('_', ' ') || 'Stators & Motors')}
              </span>
              <span style={{ color: '#cbd5e1' }}>/</span>
              <span style={{ fontWeight: 700, color: '#0f172a', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                {activeProductDetail.name}
              </span>
            </nav>

            {/* Primary Hero Section: 2-Column Responsive Blueprint & Spec Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              alignItems: 'start',
              width: '100%',
              minWidth: 0
            }}>
              {/* Left Column: CAD Specimen Image Showcase */}
              <div style={{ width: '100%', minWidth: 0 }}>
                <ProductGallery
                  productId={activeProductDetail.id}
                  productName={activeProductDetail.name}
                  productType={activeProductDetail.productType}
                  images={activeProductDetail.images}
                  primaryImageUrl={activeProductDetail.image}
                  sku={activeProductDetail.name.includes('DZ-') ? activeProductDetail.name : `DZ-M${activeProductDetail.id > 0 ? activeProductDetail.id : 2207}-1850-PRO`}
                />
              </div>

              {/* Right Column: Spec Metadata, Pricing & Order Execution */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
                {/* Class Badge & Series Line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    CINEMATIC CLASS
                  </span>
                  <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>
                    • {activeProductDetail.categoryName || (activeProductDetail.productType === 'CHILD' ? 'Series 7 Flight Stator' : 'Series 7 Flight Stator')}
                  </span>
                </div>

                {/* Title */}
                <h1 style={{
                  fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                  fontSize: 'clamp(1.85rem, 1.5rem + 1.6vw, 2.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#0f172a',
                  marginBottom: '0.6rem',
                  lineHeight: 1.15,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word'
                }}>
                  {activeProductDetail.name}
                </h1>

                {/* SKU & Spec Bar */}
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: '1.75rem',
                  lineHeight: 1.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                </div>

                {/* Stock & Purchasing Form Controls */}
                {(() => {
                  const effectiveStatus = getEffectiveProductStatus(activeProductDetail);
                  const availableStock = activeProductDetail.quantity !== undefined && activeProductDetail.quantity !== null ? activeProductDetail.quantity : 0;
                  const cartItem = cart?.items?.find((i) => i.productId === activeProductDetail.id);
                  const currentInCart = cartItem ? cartItem.quantity : 0;
                  const remainingStock = Math.max(0, availableStock - currentInCart);
                  const isOutOfStock = effectiveStatus !== 'AVAILABLE' || availableStock <= 0;
                  const isMaxInCart = remainingStock <= 0 && currentInCart > 0;

                  const multiplier = selectedPackage === 'quad' ? 4 : 1;
                  const singleUnitPrice = activeProductDetail.price;
                  const quadBundlePrice = activeProductDetail.price * 3.8; // ~5% quad bundle discount

                  return (
                    <>
                      {/* Big Price Display */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 'clamp(1.75rem, 1.75rem + 1vw, 2.2rem)',
                          fontWeight: 800,
                          color: '#0f172a',
                          fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                          lineHeight: 1,
                          letterSpacing: '-0.02em'
                        }}>
                          ${singleUnitPrice.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                          USD / Unit (Customs Duty Paid)
                        </span>
                      </div>
                      {/* Technical Specifications Section Header */}
                      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>

                          {/* Below Fold: Detailed Specifications & Technical Documentation */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%' }}>
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
                                Overview
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
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper + Add to Cart + Buy Now Action Row */}
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {/* Quantity Stepper */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: isOutOfStock || isMaxInCart ? '#f1f5f9' : '#ffffff',
                          height: '44px',
                          overflow: 'hidden',
                          opacity: isOutOfStock || isMaxInCart ? 0.6 : 1
                        }}>
                          <button
                            type="button"
                            disabled={isOutOfStock || isMaxInCart || selectedQuantity <= 1}
                            onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                            style={{
                              width: '38px',
                              height: '100%',
                              border: 'none',
                              background: 'none',
                              cursor: (isOutOfStock || isMaxInCart || selectedQuantity <= 1) ? 'not-allowed' : 'pointer',
                              fontWeight: 600,
                              fontSize: '1.1rem',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => { if (selectedQuantity > 1) e.currentTarget.style.color = '#0f172a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              minWidth: '32px',
                              textAlign: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              color: '#0f172a',
                              userSelect: 'none'
                            }}
                          >
                            {isOutOfStock ? 0 : selectedQuantity}
                          </span>
                          <button
                            type="button"
                            disabled={isOutOfStock || isMaxInCart || (selectedQuantity + 1) * multiplier > remainingStock}
                            onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                            style={{
                              width: '38px',
                              height: '100%',
                              border: 'none',
                              background: 'none',
                              cursor: (isOutOfStock || isMaxInCart || (selectedQuantity + 1) * multiplier > remainingStock) ? 'not-allowed' : 'pointer',
                              fontWeight: 600,
                              fontSize: '1.1rem',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                          >
                            +
                          </button>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          type="button"
                          disabled={isOutOfStock || isMaxInCart || remainingStock <= 0 || addingToCartId === activeProductDetail.id}
                          onClick={() => handleAddToCart(activeProductDetail, selectedQuantity * multiplier)}
                          style={{
                            flex: '1 1 170px',
                            height: '44px',
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            cursor: (isOutOfStock || isMaxInCart || remainingStock <= 0) ? 'not-allowed' : 'pointer',
                            opacity: (isOutOfStock || isMaxInCart || remainingStock <= 0) ? 0.6 : 1,
                            padding: '0 1.25rem',
                            boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isOutOfStock && !isMaxInCart && remainingStock > 0) {
                              e.currentTarget.style.background = '#b91c1c';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                          }}
                        >
                          <CartIcon size={18} style={{ stroke: '#ffffff' }} />
                          <span>
                            {addingToCartId === activeProductDetail.id
                              ? 'Adding...'
                              : isOutOfStock
                                ? 'Out of Stock'
                                : 'Add to Cart'}
                          </span>
                        </button>

                        {/* Buy Now Button */}
                        <button
                          type="button"
                          disabled={isOutOfStock || isMaxInCart || remainingStock <= 0}
                          onClick={async () => {
                            await handleAddToCart(activeProductDetail, selectedQuantity * multiplier);
                            navigateTo('/checkout');
                          }}
                          style={{
                            flex: '1 1 130px',
                            height: '44px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (isOutOfStock || isMaxInCart || remainingStock <= 0) ? 'not-allowed' : 'pointer',
                            opacity: (isOutOfStock || isMaxInCart || remainingStock <= 0) ? 0.6 : 1,
                            padding: '0 1.25rem',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isOutOfStock && !isMaxInCart && remainingStock > 0) {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.borderColor = '#94a3b8';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }}
                        >
                          Buy Now
                        </button>
                      </div>

                      {/* Trust Badges */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        marginTop: '0.75rem',
                        paddingTop: '0.5rem',
                        flexWrap: 'wrap',
                      }}>
                        {/* Free Express Dispatch */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13"></rect>
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                          </svg>
                          <span>Free Express Dispatch</span>
                        </div>

                        {/* 2-Year Warranty */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="M9 12l2 2 4-4"></path>
                          </svg>
                          <span>2-Year Precision Warranty</span>
                        </div>

                        {/* Flight Sim Profile Included */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                            <rect x="9" y="9" width="6" height="6"></rect>
                            <line x1="9" y1="1" x2="9" y2="4"></line>
                            <line x1="15" y1="1" x2="15" y2="4"></line>
                            <line x1="9" y1="20" x2="9" y2="23"></line>
                            <line x1="15" y1="20" x2="15" y2="23"></line>
                            <line x1="20" y1="9" x2="23" y2="9"></line>
                            <line x1="20" y1="14" x2="23" y2="14"></line>
                            <line x1="1" y1="9" x2="4" y2="9"></line>
                            <line x1="1" y1="14" x2="4" y2="14"></line>
                          </svg>
                          <span>Flight Sim Profile Included</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Dynamic Product Content Boxes (WORD & EXCEL) */}
            <br></br>
            <br></br>
            {activeProductDetail.contentSections && activeProductDetail.contentSections.filter(s => s.enabled !== false).length > 0 && (
              <div style={{ marginTop: '1rem', marginBottom: '4rem', width: '100%' }}>

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

                      {(() => {
                        const childEffectiveStatus = getEffectiveProductStatus(child);
                        const childStock = child.quantity !== undefined && child.quantity !== null ? child.quantity : 0;
                        const childCartItem = cart?.items?.find((i) => i.productId === child.id);
                        const childInCart = childCartItem ? childCartItem.quantity : 0;
                        const childRemaining = Math.max(0, childStock - childInCart);
                        const isChildOutOfStock = childEffectiveStatus !== 'AVAILABLE' || childStock <= 0;
                        const isChildMaxInCart = childRemaining <= 0 && childInCart > 0;

                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: childEffectiveStatus === 'AVAILABLE' ? 'var(--color-tertiary)' : (childEffectiveStatus === 'OUT_OF_STOCK' ? 'var(--color-error)' : 'var(--color-amber)'),
                                textTransform: 'uppercase'
                              }}>
                                ● {childEffectiveStatus.replace('_', ' ')}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 600 }}>
                                {isChildOutOfStock ? '0 in stock' : `${childStock} in stock`}
                              </div>
                            </div>

                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto', marginBottom: '1rem' }}>
                              ₹{child.price.toFixed(2)}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                              <button
                                disabled={isChildOutOfStock || isChildMaxInCart || addingToCartId === child.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(child);
                                }}
                                className="btn-stitch-primary"
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  opacity: (isChildOutOfStock || isChildMaxInCart) ? 0.6 : 1,
                                  cursor: (isChildOutOfStock || isChildMaxInCart) ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <CartIcon size={18} />
                                {addingToCartId === child.id
                                  ? 'Adding...'
                                  : isChildOutOfStock
                                    ? 'Out of Stock'
                                    : isChildMaxInCart
                                      ? 'Max in Cart'
                                      : 'Add to Cart'}
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
                          </>
                        );
                      })()}
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
