import React, { useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from './UserAuthModal';

interface StitchHeaderProps {
  activePage?: 'store' | 'cart' | 'checkout' | 'dashboard' | 'orders';
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({ activePage = 'store' }) => {
  const { user, isAuthenticated, cartItemCount, logout } = useUserAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <>
      <nav className="stitch-nav">
        <div className="stitch-nav-inner">
          <div
            onClick={() => navigateTo('/store')}
            style={{
              cursor: 'pointer',
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              textTransform: 'uppercase',
              color: 'var(--color-on-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            DRONES<span style={{ color: 'var(--color-primary)' }}>Z</span>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <span
              onClick={() => navigateTo('/store')}
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: activePage === 'store' ? 'var(--color-primary)' : 'var(--color-muted)',
                borderBottom: activePage === 'store' ? '2px solid var(--color-primary)' : 'none',
                paddingBottom: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Store Catalog
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Cart Button */}
            <button
              onClick={() => navigateTo('/cart')}
              className="btn-stitch-ghost"
              style={{
                borderColor: activePage === 'cart' ? 'var(--color-primary)' : '#64748b',
                color: activePage === 'cart' ? 'var(--color-primary)' : '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              🛒 Cart
              {cartItemCount > 0 && (
                <span
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '2px 7px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {cartItemCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => navigateTo('/orders')}
                  className="btn-stitch-ghost"
                  style={{
                    borderColor: activePage === 'orders' ? 'var(--color-primary)' : '#64748b',
                    color: activePage === 'orders' ? 'var(--color-primary)' : '#334155',
                  }}
                >
                  📦 Orders
                </button>
                <button
                  onClick={() => navigateTo('/dashboard')}
                  className="btn-stitch-ghost"
                  style={{
                    borderColor: activePage === 'dashboard' ? 'var(--color-primary)' : '#64748b',
                    color: activePage === 'dashboard' ? 'var(--color-primary)' : '#334155',
                  }}
                >
                  👤 {user?.fullName.split(' ')[0]}
                </button>
                <button
                  onClick={logout}
                  className="btn-stitch-ghost"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthOpen(true);
                  }}
                  className="btn-stitch-ghost"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthOpen(true);
                  }}
                  className="btn-stitch-primary"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <UserAuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
};
