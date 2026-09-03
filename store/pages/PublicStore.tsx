import React, { useState, useEffect } from 'react';
import {
  ProductDto,
  fetchPublicProducts,
  fetchPublicChildProducts,
  fetchPublicProductById
} from '../services/api';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from '../components/UserAuthModal';
import { StitchHeader } from '../components/StitchHeader';
import { StitchFooter } from '../components/StitchFooter';

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

  // Search & Availability Filters
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Item Detail Modal State
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<ProductDto | null>(null);

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
    if (!activeParent) {
      loadMainCatalog();
    }
  }, [search, selectedStatus]);

  const handleUrlRouting = async () => {
    const pathname = window.location.pathname;

    if (pathname.startsWith('/store/') && pathname.length > 7) {
      const param = pathname.substring(7);
      await loadParentSeriesPage(param);
    } else {
      setActiveParent(null);
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
    setSearch('');
    setSelectedStatus('');
    navigateTo('/store');
  };

  const navigateToParentSeries = (parentProduct: ProductDto) => {
    const slug = slugify(parentProduct.name);
    navigateTo(`/store/${slug}`);
  };

  const handleAddToCart = async (product: ProductDto) => {
    setCartFeedbackMsg(null);
    if (!isAuthenticated) {
      setUserAuthMode('login');
      setIsUserAuthOpen(true);
      return;
    }

    try {
      setAddingToCartId(product.id);
      await addToCart(product.id, 1);
      setCartFeedbackMsg(`Added "${product.name}" to cart!`);
      setTimeout(() => setCartFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  const parentProducts = products.filter((p) => p.productType === 'PARENT');
  const standaloneProducts = products.filter((p) => p.productType === 'STANDALONE');

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
          <span className="material-symbols-outlined">check_circle</span>
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

        {/* Hero Section */}
        {!activeParent && (
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
            }}>
              DronesZ Flight Specs &amp; Components
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.6, maxWidth: '650px' }}>
              Engineering-grade multirotor systems designed for cinematic precision and high-performance tactical applications.
            </p>
          </section>
        )}

        {/* VIEW 1: DEDICATED PARENT SERIES WEBPAGE (/store/parent_name) */}
        {activeParent ? (
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
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
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
                  <div key={child.id} className="stitch-product-card">
                    <div className="image-void-stage">
                      {child.image ? (
                        <img src={child.image} alt={child.name} className="product-img" />
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
                          onClick={() => handleAddToCart(child)}
                          className="btn-stitch-primary"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          <CartIcon size={18} />
                          {addingToCartId === child.id ? 'Adding...' : (child.status === 'AVAILABLE' ? 'Add to Cart' : 'Out of Stock')}
                        </button>
                        <button
                          onClick={() => setSelectedDetailProduct(child)}
                          className="btn-stitch-ghost"
                          title="View Specifications"
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
          /* VIEW 2: ROOT STORE CATALOG WEBPAGE (/ or /store) */
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
                    <div key={parent.id} className="parent-series-card">
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
                        onClick={() => navigateToParentSeries(parent)}
                        className="btn-stitch-secondary-link"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        Explore Variant Series
                        <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>arrow_forward</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Standalone Components Section */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-outline)', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-on-surface)' }}>
                  Standalone Components
                </h2>
              </div>

              {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                  Loading DronesZ storefront catalog...
                </div>
              ) : standaloneProducts.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid var(--color-outline)', padding: '4rem', textAlign: 'center', color: 'var(--color-muted)', borderRadius: '0.5rem' }}>
                  No standalone items match your search query.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {standaloneProducts.map((p) => (
                    <div key={p.id} className="stitch-product-card">
                      <div className="image-void-stage">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="product-img" />
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase' }}>
                            DRONESZ SPECIMEN
                          </span>
                        )}
                        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                          <span className="badge-category">STANDALONE</span>
                        </div>
                      </div>

                      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.3rem', lineHeight: 1.3 }}>
                          {p.name}
                        </h4>

                        <div style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: p.status === 'AVAILABLE' ? 'var(--color-tertiary)' : (p.status === 'OUT_OF_STOCK' ? 'var(--color-error)' : 'var(--color-amber)'),
                          marginBottom: '0.75rem',
                          textTransform: 'uppercase'
                        }}>
                          {p.status.replace('_', ' ')}
                        </div>

                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto', marginBottom: '1rem' }}>
                          ₹{p.price.toFixed(2)}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                          <button
                            disabled={p.status !== 'AVAILABLE' || addingToCartId === p.id}
                            onClick={() => handleAddToCart(p)}
                            className="btn-stitch-primary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                          >
                            <CartIcon size={18} />
                            {addingToCartId === p.id ? 'Adding...' : (p.status === 'AVAILABLE' ? 'Add to Cart' : 'Out of Stock')}
                          </button>
                          <button
                            onClick={() => setSelectedDetailProduct(p)}
                            className="btn-stitch-ghost"
                            title="View Specifications"
                          >
                            Specs
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedDetailProduct && (
        <div className="modal-overlay" onClick={() => setSelectedDetailProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge-category" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                  {selectedDetailProduct.productType}
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  {selectedDetailProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="image-void-stage" style={{ borderRadius: '0.375rem', marginBottom: '1.25rem' }}>
              {selectedDetailProduct.image ? (
                <img src={selectedDetailProduct.image} alt={selectedDetailProduct.name} className="product-img" />
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  DronesZ Hardware Specification
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '14px' }}>
              <div>
                <span style={{ color: 'var(--color-muted)' }}>Status: </span>
                <strong style={{ color: selectedDetailProduct.status === 'AVAILABLE' ? 'var(--color-tertiary)' : 'var(--color-error)' }}>
                  {selectedDetailProduct.status.replace('_', ' ')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted)' }}>Stock Available: </span>
                <strong>{selectedDetailProduct.quantity} units</strong>
              </div>
            </div>

            {selectedDetailProduct.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  SPECIFICATIONS &amp; DESCRIPTION
                </div>
                <p style={{ fontSize: '14px', color: 'var(--color-on-surface)', lineHeight: 1.5 }}>
                  {selectedDetailProduct.description}
                </p>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--color-outline)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'block' }}>Price</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  ₹{selectedDetailProduct.price.toFixed(2)}
                </span>
              </div>

              <button
                disabled={selectedDetailProduct.status !== 'AVAILABLE' || addingToCartId === selectedDetailProduct.id}
                onClick={() => {
                  const p = selectedDetailProduct;
                  setSelectedDetailProduct(null);
                  handleAddToCart(p);
                }}
                className="btn-stitch-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <CartIcon size={18} />
                {selectedDetailProduct.status === 'AVAILABLE' ? (addingToCartId === selectedDetailProduct.id ? 'Adding...' : 'Add to Cart') : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

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
