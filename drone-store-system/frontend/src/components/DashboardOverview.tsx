import React, { useState, useEffect } from 'react';
import { fetchProducts, fetchCategories, ProductDto, CategoryDto } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  token: string;
  onNavigateTab: (tab: 'products' | 'categories') => void;
}

export const DashboardOverview: React.FC<Props> = ({ token, onNavigateTab }) => {
  const { admin } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverviewStats();
  }, [token]);

  const loadOverviewStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetchProducts(token, { size: 100 }),
        fetchCategories(token),
      ]);
      setProducts(prodRes.content);
      setCategories(catRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview metrics');
    } finally {
      setLoading(false);
    }
  };

  const availableCount = products.filter((p) => p.status === 'AVAILABLE').length;
  const outOfStockCount = products.filter((p) => p.status === 'OUT_OF_STOCK').length;
  const comingSoonCount = products.filter((p) => p.status === 'COMING_SOON').length;

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-ink-primary)' }}>
          Welcome back, Admin 👋
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>
          System overview and quick administrative status summary
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {/* Metric 1 */}
            <div className="dronesz-card" style={{ padding: '1.5rem', borderTopColor: '#3b82f6' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ink-muted)', letterSpacing: '0.05em' }}>
                Total Products
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-ink-primary)', margin: '0.3rem 0' }}>
                {products.length}
              </div>
              <button
                onClick={() => onNavigateTab('products')}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
              >
                Manage Products Catalog &rarr;
              </button>
            </div>

            {/* Metric 2 */}
            <div className="dronesz-card" style={{ padding: '1.5rem', borderTopColor: '#10b981' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ink-muted)', letterSpacing: '0.05em' }}>
                Store Categories
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-ink-primary)', margin: '0.3rem 0' }}>
                {categories.length}
              </div>
              <button
                onClick={() => onNavigateTab('categories')}
                style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
              >
                Manage Categories &rarr;
              </button>
            </div>

            {/* Metric 3 */}
            <div className="dronesz-card" style={{ padding: '1.5rem', borderTopColor: '#059669' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ink-muted)', letterSpacing: '0.05em' }}>
                In Stock & Available
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#059669', margin: '0.3rem 0' }}>
                {availableCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Ready for customer ordering</span>
            </div>

            {/* Metric 4 */}
            <div className="dronesz-card" style={{ padding: '1.5rem', borderTopColor: '#dc2626' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ink-muted)', letterSpacing: '0.05em' }}>
                Out of Stock / Coming Soon
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#dc2626', margin: '0.3rem 0' }}>
                {outOfStockCount + comingSoonCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>{outOfStockCount} Out of stock, {comingSoonCount} Coming soon</span>
            </div>
          </div>

          {/* System & Auth Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="dronesz-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-ink-primary)' }}>
                Administrator Profile
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--color-ink-muted)' }}>Email: </span>
                  <strong>{admin?.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-ink-muted)' }}>Role Authority: </span>
                  <span className="dronesz-badge" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>{admin?.role}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-ink-muted)' }}>Session Security: </span>
                  <span className="dronesz-badge-active" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>Active JWT Session</span>
                </div>
              </div>
            </div>

            <div className="dronesz-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-ink-primary)' }}>
                System Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--color-ink-muted)' }}>Database Connection: </span>
                  <strong style={{ color: '#10b981' }}>Supabase PostgreSQL (Connected)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-ink-muted)' }}>Flyway Schema Version: </span>
                  <strong>V3 (Categories & Products Schema)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-ink-muted)' }}>Backend Port: </span>
                  <strong>8070</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
