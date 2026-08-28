import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardOverview } from '../components/DashboardOverview';
import { ProductManagement } from '../components/ProductManagement';
import { CategoryManagement } from '../components/CategoryManagement';

type TabType = 'overview' | 'products' | 'categories';

export const ProtectedAdminDashboard: React.FC = () => {
  const { admin, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('products');

  if (!token) {
    return null;
  }

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div>
          {/* Brand Identity Header */}
          <div style={{ padding: '0.5rem 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid var(--color-line)', marginBottom: '1.5rem' }}>
            <h2 className="brand-wordmark" style={{ fontSize: '1.4rem' }}>
              Drones<span className="accent">Z</span> Admin
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.2rem' }}>
              Store Management Portal
            </p>
          </div>

          {/* Navigation Items */}
          <nav>
            <div
              className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span style={{ fontSize: '1.1rem' }}>📊</span> Overview
            </div>

            <div
              className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span style={{ fontSize: '1.1rem' }}>📦</span> Products
            </div>

            <div
              className={`sidebar-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <span style={{ fontSize: '1.1rem' }}>🏷️</span> Categories
            </div>
          </nav>
        </div>

        {/* Footer Admin User Profile & Sign Out */}
        <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '1.25rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {admin?.email || 'admin@example.com'}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span className="dronesz-badge" style={{ padding: '0.1rem 0.4rem', fontSize: '0.68rem' }}>
                {admin?.role || 'ADMIN'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-dronesz-secondary"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="admin-main-content">
        {activeTab === 'overview' && (
          <DashboardOverview token={token} onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'products' && <ProductManagement token={token} />}
        {activeTab === 'categories' && <CategoryManagement token={token} />}
      </main>
    </div>
  );
};
