import React, { useState, useRef, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from './UserAuthModal';

interface StitchHeaderProps {
  activePage?: 'store' | 'cart' | 'checkout' | 'dashboard' | 'orders';
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({ activePage = 'store' }) => {
  const { user, isAuthenticated, cartItemCount, logout } = useUserAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="stitch-nav">
        <div className="stitch-nav-inner">
          {/* Logo Brand */}
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
              gap: '0.2rem',
              userSelect: 'none',
            }}
          >
            DRONES<span style={{ color: 'var(--color-primary)' }}>Z</span>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <span
              onClick={() => navigateTo('/store')}
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: activePage === 'store' ? 'var(--color-primary)' : 'var(--color-muted)',
                borderBottom: activePage === 'store' ? '2px solid var(--color-primary)' : '2px solid transparent',
                paddingBottom: '0.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Store Catalog
            </span>
          </div>

          {/* Icon Controls Header */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            {/* Cart Icon Button */}
            <button
              onClick={() => navigateTo('/cart')}
              title="Shopping Cart"
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                color: activePage === 'cart' ? 'var(--color-primary)' : 'var(--color-on-surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.4rem',
                borderRadius: '50%',
                transition: 'opacity 0.2s ease, transform 0.15s ease',
              }}
              className="hover:opacity-80 active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                shopping_cart
              </span>

              {cartItemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-4px',
                    background: 'var(--color-primary)',
                    color: '#ffffff',
                    borderRadius: '999px',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Profile / Account Icon Menu */}
            {isAuthenticated ? (
              <div ref={profileMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  title="Account Options"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activePage === 'dashboard' || activePage === 'orders' ? 'var(--color-primary)' : 'var(--color-on-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem',
                    borderRadius: '50%',
                    transition: 'opacity 0.2s ease',
                  }}
                  className="hover:opacity-80"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                    account_circle
                  </span>
                </button>

                {/* Dropdown Drawer */}
                {isProfileMenuOpen && (
                  <div
                    className="stitch-card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '220px',
                      padding: '0.75rem 0',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      zIndex: 100,
                    }}
                  >
                    <div style={{ padding: '0.5rem 1rem 0.75rem 1rem', borderBottom: '1px solid var(--color-outline)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.fullName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', padding: '0.25rem 0' }}>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigateTo('/dashboard');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.6rem 1rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--color-on-surface)',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                        className="hover:bg-gray-100"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
                          person
                        </span>
                        Account Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigateTo('/orders');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.6rem 1rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--color-on-surface)',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                        className="hover:bg-gray-100"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
                          package_2
                        </span>
                        Order History
                      </button>

                      <div style={{ height: '1px', background: 'var(--color-outline)', margin: '0.25rem 0' }} />

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.6rem 1rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                        className="hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                          logout
                        </span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthOpen(true);
                }}
                title="Sign In / Register"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  transition: 'opacity 0.2s ease',
                }}
                className="hover:opacity-80"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  account_circle
                </span>
              </button>
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
