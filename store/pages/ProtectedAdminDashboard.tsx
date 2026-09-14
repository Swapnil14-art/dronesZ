import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardOverview } from '../components/DashboardOverview';
import { ProductManagement } from '../components/ProductManagement';
import { CategoryManagement } from '../components/CategoryManagement';
import { UserManagement } from '../components/UserManagement';
import { ParachuteManagement } from '../components/ParachuteManagement';

type TabType = 'overview' | 'products' | 'categories' | 'users' | 'parachute';

export const ProtectedAdminDashboard: React.FC = () => {
  const { admin, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('products');

  if (!token) {
    return null;
  }

  return (
    <div className="stitch-admin-container">
      {/* Sidebar Navigation */}

      <aside className="stitch-admin-sidebar">
        <div>
          {/* Brand Identity Header */}
          <div style={{ padding: '0.5rem 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid #334155', marginBottom: '1.5rem' }}>
            <br></br><br></br><div style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#ffffff' }}>
              DRONES<span style={{ color: 'var(--color-primary)' }}>Z</span> ADMIN
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Store Management Portal
            </p>
          </div>

          {/* Navigation Items */}
          <nav>
            <div
              className={`stitch-admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span style={{ fontSize: '1.1rem' }}></span> Overview
            </div>

            <div
              className={`stitch-admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span style={{ fontSize: '1.1rem' }}></span> Products
            </div>

            <div
              className={`stitch-admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <span style={{ fontSize: '1.1rem' }}></span> Categories
            </div>

            <div
              className={`stitch-admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span style={{ fontSize: '1.1rem' }}></span> Users
            </div>

            <div
              className={`stitch-admin-nav-item ${activeTab === 'parachute' ? 'active' : ''}`}
              onClick={() => setActiveTab('parachute')}
            >
              <span style={{ fontSize: '1.1rem' }}></span> Parachute
            </div>
          </nav>
        </div>

        {/* Footer Admin User Profile & Sign Out */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '1.25rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {admin?.email || 'admin@example.com'}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span className="badge-parent" style={{ background: '#ef4444', color: '#fff', fontSize: '10px' }}>
                {admin?.role || 'ADMIN'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-stitch-ghost"
            style={{ width: '100%', borderColor: '#475569', color: '#94a3b8', fontSize: '12px' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="stitch-admin-main blueprint-bg"><br></br><br></br>
        {activeTab === 'overview' && (
          <DashboardOverview token={token} onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'products' && <ProductManagement token={token} />}
        {activeTab === 'categories' && <CategoryManagement token={token} />}
        {activeTab === 'users' && <UserManagement token={token} />}
        {activeTab === 'parachute' && <ParachuteManagement token={token} />}
      </main>
    </div>
  );
};
