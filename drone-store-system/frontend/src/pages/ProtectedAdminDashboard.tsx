import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAdminDashboardData } from '../services/api';

export const ProtectedAdminDashboard: React.FC = () => {
  const { admin, token, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingApi, setLoadingApi] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    if (!token) return;
    setLoadingApi(true);
    setApiError(null);
    try {
      const data = await fetchAdminDashboardData(token);
      setDashboardData(data);
    } catch (err: any) {
      setApiError(err.message || 'Failed to authorize protected admin request');
    } finally {
      setLoadingApi(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Top Navbar Header */}
      <header className="dronesz-card" style={{
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 className="brand-wordmark" style={{ fontSize: '1.5rem' }}>
            Drones<span className="accent">Z</span> Admin System
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
            Protected Administrative Control Center
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{admin?.email}</div>
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <span className="dronesz-badge" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                {admin?.role || 'ADMIN'}
              </span>
              <span className="dronesz-badge-active" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                Authenticated
              </span>
            </div>
          </div>
          <button onClick={logout} className="btn-dronesz-secondary">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Card 1: Auth Status */}
        <div className="dronesz-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-ink-primary)' }}>
            Authentication State
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--color-ink-muted)' }}>Admin ID: </span>
              <strong>#{admin?.id}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-ink-muted)' }}>Email: </span>
              <strong>{admin?.email}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-ink-muted)' }}>Role Authority: </span>
              <span className="dronesz-badge" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>{admin?.role}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-ink-muted)' }}>JWT Header: </span>
              <code style={{
                background: 'var(--color-canvas-deep)',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                color: 'var(--color-brand-red-dim)',
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                display: 'block',
                marginTop: '0.3rem'
              }}>
                Authorization: Bearer {token ? `${token.substring(0, 28)}...` : 'None'}
              </code>
            </div>
          </div>
        </div>

        {/* Card 2: Protected Backend API Test */}
        <div className="dronesz-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-ink-primary)' }}>
              Protected API Validation
            </h3>
            <button onClick={loadDashboardData} className="btn-dronesz-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              Re-test JWT API
            </button>
          </div>

          {loadingApi && (
            <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem' }}>Validating Bearer Token with Spring Security...</div>
          )}

          {apiError && (
            <div className="error-banner" style={{ fontSize: '0.85rem' }}>
              {apiError}
            </div>
          )}

          {dashboardData && !loadingApi && (
            <pre style={{
              background: 'var(--color-canvas-deep)',
              border: '1px solid var(--color-line)',
              borderRadius: '10px',
              padding: '1rem',
              color: '#059669',
              fontSize: '0.82rem',
              overflowX: 'auto'
            }}>
              {JSON.stringify(dashboardData, null, 2)}
            </pre>
          )}
        </div>

      </div>
    </div>
  );
};
