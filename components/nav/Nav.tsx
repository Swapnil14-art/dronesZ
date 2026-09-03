"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { NAV, SITE } from "@/data/site";
import { useLenisScroll } from "@/components/providers/LenisGSAPProvider";
import { useUserAuth } from "@/store/context/UserAuthContext";
import { UserAuthModal } from "@/store/components/UserAuthModal";
import "./nav.css";

/* SVG Icon Components for Store Navigation */
function CartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function UserIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PackageIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function LogoutIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function navOffset(): number {
  const nav = document.querySelector(".nav");
  return nav ? -nav.getBoundingClientRect().height : 0;
}

export function Nav() {
  const pathname = usePathname();
  const { scrollTo } = useLenisScroll();
  const [overHero, setOverHero] = useState(pathname === "/");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, isAuthenticated, cartItemCount, logout } = useUserAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero) {
      setOverHero(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash;
    if (!hash || !document.querySelector(hash)) return;

    let cancelled = false;
    let onLoad: (() => void) | undefined;

    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            onLoad = () => resolve();
            window.addEventListener("load", onLoad, { once: true });
          });
    const fonts =
      "fonts" in document ? document.fonts.ready : Promise.resolve();

    Promise.all([loaded, fonts]).then(() => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled)
            scrollTo(hash, { immediate: true, offset: navOffset() });
        })
      );
    });

    return () => {
      cancelled = true;
      if (onLoad) window.removeEventListener("load", onLoad);
    };
  }, [pathname, scrollTo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAnchor = (href: string) => {
    setMobileMenuOpen(false);
    if (pathname === "/") {
      scrollTo(href, { offset: navOffset() });
    } else {
      window.location.href = `/${href}`;
    }
  };

  const isStorePage =
    pathname.startsWith("/store") ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/dashboard" ||
    pathname === "/orders";

  return (
    <>
      <header className="nav" data-over-hero={overHero || undefined}>
        {/* Logo on Left */}
        <Link href="/" className="nav__brand" aria-label={`${SITE.name} home`}>
          <img
            src="/brand/drone-mark.png"
            alt=""
            width={26}
            height={26}
            className="nav__brand-mark"
          />
          <span className="nav__wordmark">
            Drones<span className="accent">Z</span>
          </span>
        </Link>
        
        {/* Right Navigation & Controls Group */}
        <div className="nav__right-group">
          <nav className="nav__desktop" aria-label="Main navigation">
            <ul className="nav__links">
              {NAV.map((item) => {
                const isAnchor = item.href.startsWith("#");
                const isExternal = item.href.startsWith("http");
                const isActive =
                  (!isAnchor &&
                    (pathname === item.href ||
                      (item.label === "Products" && pathname.startsWith("/store")))) ||
                  (item.href === "/" && pathname === "/");
                return (
                  <li key={item.href}>
                    {isAnchor ? (
                      <button
                        type="button"
                        className="nav__link"
                        onClick={() => handleAnchor(item.href)}
                      >
                        {item.label}
                      </button>
                    ) : isExternal ? (
                      <a
                        href={item.href}
                        className="nav__link"
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="nav__link"
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Store Actions: Cart & Profile Icons — Visible ONLY on Store Pages */}
          {isStorePage && (
            <div className="nav__store-actions">
              <Link
                href="/cart"
                title="Shopping Cart"
                className={`nav__icon-btn ${pathname === '/cart' ? 'is-active' : ''}`}
                aria-label="Shopping Cart"
              >
                <CartIcon size={20} />
                {cartItemCount > 0 && (
                  <span className="nav__cart-badge">{cartItemCount}</span>
                )}
              </Link>

              {isAuthenticated ? (
                <div ref={profileMenuRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    title="Account Options"
                    className={`nav__icon-btn ${pathname === '/dashboard' || pathname === '/orders' ? 'is-active' : ''}`}
                    aria-label="Account Options"
                  >
                    <UserIcon size={20} />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="nav__profile-dropdown">
                      <div className="nav__profile-dropdown-header">
                        <div className="nav__user-name">{user?.fullName}</div>
                        <div className="nav__user-email">{user?.email}</div>
                      </div>

                      <div className="nav__profile-dropdown-menu">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="nav__dropdown-item"
                        >
                          <UserIcon size={18} />
                          Account Dashboard
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="nav__dropdown-item"
                        >
                          <PackageIcon size={18} />
                          Order History
                        </Link>

                        <div className="nav__dropdown-divider" />

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            logout();
                          }}
                          className="nav__dropdown-item is-danger"
                        >
                          <LogoutIcon size={18} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthOpen(true);
                  }}
                  title="Sign In / Register"
                  className="nav__icon-btn"
                  aria-label="Sign In"
                >
                  <UserIcon size={20} />
                </button>
              )}
            </div>
          )}

          {/* Mobile Toggle Button */}
          <button
            type="button"
            className="nav__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span className={`nav__hamburger ${mobileMenuOpen ? "is-active" : ""}`}>
              <span className="nav__hamburger-line" />
              <span className="nav__hamburger-line" />
              <span className="nav__hamburger-line" />
            </span>
          </button>
        </div>
      </header>

      <UserAuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
}

export default Nav;
