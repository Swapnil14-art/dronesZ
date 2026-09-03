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
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          ADMINISTRATIVE SYSTEM METRICS
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
          System Dashboard Overview
        </h1>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
          Live system status, catalog analytics, and administrative management shortcuts.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem', borderRadius: '0.375rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Metric 1 */}
            <div className="stitch-stat-card">
              <div className="stitch-stat-label">Total Catalog Products</div>
              <div className="stitch-stat-value">{products.length}</div>
              <button
                onClick={() => onNavigateTab('products')}
                className="btn-stitch-secondary-link"
                style={{ marginTop: '0.75rem', fontSize: '13px' }}
              >
                Manage Products Catalog &rarr;
              </button>
            </div>

            {/* Metric 2 */}
            <div className="stitch-stat-card" style={{ borderTopColor: 'var(--color-tertiary)' }}>
              <div className="stitch-stat-label">Store Categories</div>
              <div className="stitch-stat-value">{categories.length}</div>
              <button
                onClick={() => onNavigateTab('categories')}
                className="btn-stitch-secondary-link"
                style={{ marginTop: '0.75rem', fontSize: '13px', color: 'var(--color-tertiary)' }}
              >
                Manage Categories &rarr;
              </button>
            </div>

            {/* Metric 3 */}
            <div className="stitch-stat-card" style={{ borderTopColor: 'var(--color-tertiary)' }}>
              <div className="stitch-stat-label">In Stock &amp; Available</div>
              <div className="stitch-stat-value" style={{ color: 'var(--color-tertiary)' }}>
                {availableCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '0.5rem' }}>Ready for customer ordering</div>
            </div>

            {/* Metric 4 */}
            <div className="stitch-stat-card" style={{ borderTopColor: 'var(--color-primary)' }}>
              <div className="stitch-stat-label">Out of Stock / Coming Soon</div>
              <div className="stitch-stat-value" style={{ color: 'var(--color-primary)' }}>
                {outOfStockCount + comingSoonCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '0.5rem' }}>
                {outOfStockCount} Out of stock, {comingSoonCount} Coming soon
              </div>
            </div>
          </div>

          {/* System & Auth Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="stitch-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-on-surface)' }}>
                Administrator Session
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '14px' }}>
                <div>
                  <span style={{ color: 'var(--color-muted)' }}>Email: </span>
                  <strong style={{ color: 'var(--color-on-surface)' }}>{admin?.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-muted)' }}>Role Authority: </span>
                  <span className="badge-parent" style={{ background: '#ef4444', color: '#fff' }}>{admin?.role}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-muted)' }}>Session Security: </span>
                  <span className="badge-tertiary">JWT Authorized</span>
                </div>
              </div>
            </div>

            <div className="stitch-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-on-surface)' }}>
                Infrastructure Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '14px' }}>
                <div>
                  <span style={{ color: 'var(--color-muted)' }}>Database Connection: </span>
                  <strong style={{ color: 'var(--color-tertiary)' }}>PostgreSQL (Active)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-muted)' }}>3-Tier Product Logic: </span>
                  <strong style={{ color: 'var(--color-on-surface)' }}>STANDALONE / PARENT / CHILD</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-muted)' }}>Backend Service: </span>
                  <strong style={{ color: 'var(--color-on-surface)' }}>Spring Boot Port 8070</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
