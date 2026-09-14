import React, { useState, useRef, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from './UserAuthModal';
import './Header.css';

interface HeaderProps {
  activePage?: 'store' | 'cart' | 'checkout' | 'dashboard' | 'orders';
}

export const Header: React.FC<HeaderProps> = ({ activePage = 'store' }) => {
  const { user, isAuthenticated, cartItemCount, logout } = useUserAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const MAIN_SITE_URL =
    (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_VITE_MAIN_SITE_URL || process.env.NEXT_PUBLIC_MAIN_SITE_URL)) ||
    'http://localhost:3000';

  const navigateTo = (path: string) => {
    setIsMobileMenuOpen(false);
    if (path === '/' || path.startsWith('/#') || path === '/contact') {
      const target = path === '/' ? MAIN_SITE_URL : `${MAIN_SITE_URL}${path}`;
      window.location.href = target;
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // Close profile dropdown when clicking outside
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
      <header className="dronesz-header">
        <div className="dronesz-header__inner">
          {/* DronesZ Logo Brand */}
          <div
            className="dronesz-brand"
            onClick={() => navigateTo('/')}
            title="DronesZ Home"
          >
            <img
              src="/brand/drone-mark.png"
              alt="DronesZ Mark"
              width={26}
              height={26}
              className="dronesz-brand-mark"
            />
            <span className="dronesz-wordmark">
              Drones<span className="accent">Z</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="dronesz-nav__desktop" aria-label="Main Navigation">
            <button
              type="button"
              className="dronesz-nav__link"
              onClick={() => navigateTo('/')}
            >
              Home
            </button>
            <button
              type="button"
              className={`dronesz-nav__link ${activePage === 'store' || activePage === 'cart' || activePage === 'checkout' ? 'active' : ''}`}
              onClick={() => navigateTo('/store')}
            >
              Products
            </button>
            <button
              type="button"
              className="dronesz-nav__link"
              onClick={() => navigateTo('/#manufacturing')}
            >
              Process
            </button>
            <button
              type="button"
              className="dronesz-nav__link"
              onClick={() => navigateTo('/#custom-airframes')}
            >
              Custom
            </button>
            <button
              type="button"
              className="dronesz-nav__link"
              onClick={() => navigateTo('/contact')}
            >
              Contact
            </button>
          </nav>

          {/* Action Icon Controls: Cart & Profile */}
          <div className="dronesz-actions">
            {/* Shopping Cart Button */}
            <button
              onClick={() => navigateTo('/cart')}
              title="Shopping Cart"
              className={`dronesz-icon-btn ${activePage === 'cart' ? 'text-primary' : ''}`}
              style={{ color: activePage === 'cart' ? '#e52b31' : '#94a3b8' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                shopping_cart
              </span>

              {cartItemCount > 0 && (
                <span className="dronesz-cart-badge">
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
                  className="dronesz-icon-btn"
                  style={{ color: activePage === 'dashboard' || activePage === 'orders' ? '#e52b31' : '#94a3b8' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                    account_circle
                  </span>
                </button>

                {/* Account Dropdown Drawer */}
                {isProfileMenuOpen && (
                  <div
                    className="stitch-card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '220px',
                      padding: '0.75rem 0',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      zIndex: 100,
                      background: '#14171d',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ padding: '0.5rem 1rem 0.75rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.fullName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          color: '#f8fafc',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#e52b31' }}>
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
                          color: '#f8fafc',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#e52b31' }}>
                          package_2
                        </span>
                        Order History
                      </button>

                      <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.25rem 0' }} />

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
                          color: '#ef4444',
                          cursor: 'pointer',
                          width: '100%',
                        }}
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
                className="dronesz-icon-btn"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  account_circle
                </span>
              </button>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              className="dronesz-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={`dronesz-hamburger ${isMobileMenuOpen ? 'is-active' : ''}`}>
                <span className="dronesz-hamburger-line" />
                <span className="dronesz-hamburger-line" />
                <span className="dronesz-hamburger-line" />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="dronesz-mobile-drawer">
            <ul className="dronesz-mobile-links">
              <li>
                <button
                  className="dronesz-mobile-link"
                  onClick={() => navigateTo('/')}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  className={`dronesz-mobile-link ${activePage === 'store' || activePage === 'cart' || activePage === 'checkout' ? 'active' : ''}`}
                  onClick={() => navigateTo('/store')}
                >
                  Products
                </button>
              </li>
              <li>
                <button
                  className="dronesz-mobile-link"
                  onClick={() => navigateTo('/#manufacturing')}
                >
                  Process
                </button>
              </li>
              <li>
                <button
                  className="dronesz-mobile-link"
                  onClick={() => navigateTo('/#custom-airframes')}
                >
                  Custom
                </button>
              </li>
              <li>
                <button
                  className="dronesz-mobile-link"
                  onClick={() => navigateTo('/contact')}
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>

      <UserAuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
};

export default Header;
