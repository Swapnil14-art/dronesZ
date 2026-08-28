import React, { useState, useEffect } from 'react';
import {
  ProductDto,
  fetchPublicProducts,
  fetchPublicChildProducts,
  fetchPublicProductById
} from '../services/api';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const PublicStore: React.FC = () => {
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

  // Item Detail Modal State (for Standalone or Child item details)
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<ProductDto | null>(null);

  // Customer Auth Modal State
  const [isUserAuthOpen, setIsUserAuthOpen] = useState<boolean>(false);
  const [userAuthTab, setUserAuthTab] = useState<'signin' | 'signup'>('signin');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [userAuthMessage, setUserAuthMessage] = useState<string | null>(null);

  // Sync state with browser address bar
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

    // Check if URL matches /store/:slug or /store/parent-name
    if (pathname.startsWith('/store/') && pathname.length > 7) {
      const param = pathname.substring(7); // e.g. "high-performance-motors-series" or "motors"
      await loadParentSeriesPage(param);
    } else {
      // Root store page: / or /store
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
      setError('Unable to load storefront catalog. Please ensure backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadParentSeriesPage = async (param: string) => {
    setLoadingChildren(true);
    setError(null);
    try {
      // Fetch all products to match parent by slug or ID
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
    window.history.pushState({}, '', '/store');
    loadMainCatalog();
  };

  const navigateToParentSeries = (parentProduct: ProductDto) => {
    const slug = slugify(parentProduct.name);
    const targetUrl = `/store/${slug}`;
    window.history.pushState({}, '', targetUrl);
    setActiveParent(parentProduct);
    loadParentSeriesPage(slug);
  };

  const handleUserAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserAuthMessage('Customer account portal authentication will be enabled in Phase 5.');
  };

  // Filter child products for parent series view if local search/status applied
  const filteredChildProducts = childProducts.filter((c) => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !selectedStatus || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Storefront Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--color-line)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div onClick={navigateToMainStore} style={{ cursor: 'pointer' }}>
              <h1 className="brand-wordmark" style={{ fontSize: '1.75rem' }}>
                Drones<span className="accent">Z</span> Store
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                Next-Gen FPV Drones, Brushless Motors & Performance Components
              </p>
            </div>

            {/* Back Button displayed when viewing a Parent Series webpage */}
            {activeParent && (
              <button
                onClick={navigateToMainStore}
                className="btn-dronesz-secondary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                ← Back to Main Store
              </button>
            )}
          </div>

          <div>
            <button
              onClick={() => {
                setUserAuthTab('signin');
                setUserAuthMessage(null);
                setIsUserAuthOpen(true);
              }}
              className="btn-dronesz-primary"
              style={{ fontSize: '0.88rem', padding: '0.65rem 1.25rem' }}
            >
              Customer Sign In / Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Container */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {error && <div className="error-banner" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: DEDICATED PARENT SERIES WEBPAGE (/store/parent_name) */}
        {/* ------------------------------------------------------------- */}
        {activeParent ? (
          <div>
            {/* Series Page Banner Header */}
            <div className="dronesz-card" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--color-brand-red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="hierarchy-pill" style={{ marginBottom: '0.5rem', background: '#6b21a8' }}>
                    PARENT PRODUCT SERIES WEBPAGE
                  </span>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-ink-primary)', marginTop: '0.3rem' }}>
                    {activeParent.name}
                  </h2>
                  {activeParent.description && (
                    <p style={{ fontSize: '0.95rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem', maxWidth: '800px', lineHeight: 1.5 }}>
                      {activeParent.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={navigateToMainStore}
                  className="btn-dronesz-secondary btn-sm"
                  style={{ fontSize: '0.85rem' }}
                >
                  ← Back to Root Store Catalog
                </button>
              </div>
            </div>

            {/* Filter / Search Bar for Series Variants */}
            <div className="dronesz-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Search models in ${activeParent.name}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: '1 1 300px' }}
                />

                <select
                  className="input-field"
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
            </div>

            {/* Children Grid Listing - Same Layout as Root Store Listing */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-ink-primary)', marginBottom: '1.25rem' }}>
              Series Variant Models ({filteredChildProducts.length})
            </h3>

            {loadingChildren ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                Loading product variants for {activeParent.name}...
              </div>
            ) : filteredChildProducts.length === 0 ? (
              <div className="dronesz-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                No child variants listed for this parent series matching your filter.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredChildProducts.map((child) => (
                  <div
                    key={child.id}
                    className="dronesz-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1.5rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          MODEL VARIANT
                        </span>

                        <span className={`status-badge ${child.status}`}>
                          {child.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{
                        width: '100%',
                        height: '160px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        overflow: 'hidden'
                      }}>
                        {child.image ? (
                          <img src={child.image} alt={child.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.75)' }}>
                            <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                              DronesZ Model
                            </span>
                          </div>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-ink-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                        {child.name}
                      </h3>

                      {child.description && (
                        <p style={{
                          fontSize: '0.84rem',
                          color: 'var(--color-ink-muted)',
                          marginBottom: '1rem',
                          lineHeight: 1.45
                        }}>
                          {child.description}
                        </p>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.85rem' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', display: 'block' }}>Price</span>
                          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-ink-primary)' }}>
                            ₹{child.price.toFixed(2)}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                          Stock: {child.quantity} units
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedDetailProduct(child)}
                        className="btn-dronesz-primary"
                        style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem' }}
                      >
                        View Specs & Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* VIEW 2: ROOT STORE CATALOG WEBPAGE (/ or /store)              */
          /* ------------------------------------------------------------- */
          <div>
            {/* Filter Bar */}
            <div className="dronesz-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: '1 1 300px' }}
                />

                <select
                  className="input-field"
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
            </div>

            {/* Catalog Listing: PARENT and STANDALONE Products Only */}
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                Loading DronesZ storefront catalog...
              </div>
            ) : products.length === 0 ? (
              <div className="dronesz-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                No products match your search query or availability filter.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '1.5rem'
              }}>
                {products.map((p) => {
                  const isParent = p.productType === 'PARENT';

                  return (
                    <div
                      key={p.id}
                      className="dronesz-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '1.5rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                          {isParent ? (
                            <span className="hierarchy-pill" style={{ background: '#6b21a8' }}>
                              PRODUCT SERIES
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              STANDALONE ITEM
                            </span>
                          )}

                          <span className={`status-badge ${p.status}`}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div style={{
                          width: '100%',
                          height: '160px',
                          borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '1rem',
                          overflow: 'hidden'
                        }}>
                          {p.image ? (
                            <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.75)' }}>
                              <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                                {isParent ? 'DronesZ Series' : 'DronesZ Spec'}
                              </span>
                            </div>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-ink-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                          {p.name}
                        </h3>

                        {p.description && (
                          <p style={{
                            fontSize: '0.84rem',
                            color: 'var(--color-ink-muted)',
                            marginBottom: '1rem',
                            lineHeight: 1.45
                          }}>
                            {p.description}
                          </p>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        {/* Rules: PARENT products show NO price and NO quantity */}
                        {!isParent && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.85rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Price</span>
                            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-ink-primary)' }}>
                              ₹{p.price.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {isParent ? (
                          <button
                            onClick={() => navigateToParentSeries(p)}
                            className="btn-dronesz-primary"
                            style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem' }}
                          >
                            Explore Variant Series →
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedDetailProduct(p)}
                            className="btn-dronesz-secondary"
                            style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem' }}
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Standalone / Child Detail Modal */}
      {selectedDetailProduct && (
        <div className="modal-overlay" onClick={() => setSelectedDetailProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className={`status-badge ${selectedDetailProduct.status}`} style={{ marginBottom: '0.5rem' }}>
                  {selectedDetailProduct.status.replace('_', ' ')}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-ink-primary)' }}>
                  {selectedDetailProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              {selectedDetailProduct.image ? (
                <img src={selectedDetailProduct.image} alt={selectedDetailProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>DronesZ Product Specification</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--color-ink-muted)' }}>Product Type: </span>
                <strong>{selectedDetailProduct.productType}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-ink-muted)' }}>Stock Available: </span>
                <strong>{selectedDetailProduct.quantity} units</strong>
              </div>
            </div>

            {selectedDetailProduct.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  DESCRIPTION & SPECIFICATIONS
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-primary)', lineHeight: 1.5 }}>
                  {selectedDetailProduct.description}
                </p>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', display: 'block' }}>Price</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ink-primary)' }}>
                  ₹{selectedDetailProduct.price.toFixed(2)}
                </span>
              </div>

              <button
                disabled={selectedDetailProduct.status !== 'AVAILABLE'}
                onClick={() => alert('Added ' + selectedDetailProduct.name + ' to cart!')}
                className="btn-dronesz-primary"
              >
                {selectedDetailProduct.status === 'AVAILABLE' ? 'Add to Cart' : 'Currently Unavailable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Account Modal */}
      {isUserAuthOpen && (
        <div className="modal-overlay" onClick={() => setIsUserAuthOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Customer Account Portal
              </h3>
              <button
                onClick={() => setIsUserAuthOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-line)', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setUserAuthTab('signin')}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  borderBottom: userAuthTab === 'signin' ? '2px solid var(--color-brand-red)' : 'none',
                  fontWeight: userAuthTab === 'signin' ? 700 : 500,
                  color: userAuthTab === 'signin' ? 'var(--color-brand-red)' : 'var(--color-ink-muted)',
                  padding: '0.6rem',
                  cursor: 'pointer'
                }}
              >
                User Sign In
              </button>
              <button
                onClick={() => setUserAuthTab('signup')}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  borderBottom: userAuthTab === 'signup' ? '2px solid var(--color-brand-red)' : 'none',
                  fontWeight: userAuthTab === 'signup' ? 700 : 500,
                  color: userAuthTab === 'signup' ? 'var(--color-brand-red)' : 'var(--color-ink-muted)',
                  padding: '0.6rem',
                  cursor: 'pointer'
                }}
              >
                Register Account
              </button>
            </div>

            {userAuthMessage && <div className="success-banner">{userAuthMessage}</div>}

            <form onSubmit={handleUserAuthSubmit}>
              <div className="input-group">
                <label className="input-label">Customer Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="user@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-dronesz-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {userAuthTab === 'signin' ? 'Sign In to Store' : 'Create Customer Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
