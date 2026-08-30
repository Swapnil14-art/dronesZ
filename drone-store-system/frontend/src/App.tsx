import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import { PublicStore } from './pages/PublicStore';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { ProtectedAdminDashboard } from './pages/ProtectedAdminDashboard';

type ViewRoute = 'store' | 'cart' | 'checkout' | 'dashboard' | 'orders' | 'admin-login' | 'admin-dashboard';

function getInitialView(): ViewRoute {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.includes('/admin') || hash.includes('admin')) {
    return 'admin-login';
  }
  if (path.startsWith('/cart')) return 'cart';
  if (path.startsWith('/checkout')) return 'checkout';
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.startsWith('/orders')) return 'orders';
  
  return 'store';
}

const MainRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<ViewRoute>(getInitialView);

  // Sync state with browser address bar
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: ViewRoute) => {
    setCurrentView(view);
    if (view === 'store') {
      window.history.pushState({}, '', '/store');
    } else if (view === 'cart') {
      window.history.pushState({}, '', '/cart');
    } else if (view === 'checkout') {
      window.history.pushState({}, '', '/checkout');
    } else if (view === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else if (view === 'orders') {
      window.history.pushState({}, '', '/orders');
    } else if (view === 'admin-login') {
      window.history.pushState({}, '', '/admin/login');
    } else if (view === 'admin-dashboard') {
      window.history.pushState({}, '', '/admin/dashboard');
    }
  };

  // Dedicated Admin Gateway
  if (currentView === 'admin-dashboard' || (isAuthenticated && currentView === 'admin-login')) {
    return (
      <div>
        <div style={{ background: '#0f172a', padding: '0.6rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: '#e52b31', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>ADMIN GATEWAY</span>
            <span style={{ color: '#f8fafc', fontSize: '0.88rem', fontWeight: 600 }}>DronesZ Administrative Management Portal</span>
          </div>
          <button
            onClick={() => navigateTo('store')}
            style={{ background: 'none', border: '1px solid #334155', color: '#38bdf8', padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
          >
            ← Switch to Public Store Page
          </button>
        </div>
        <ProtectedAdminDashboard />
      </div>
    );
  }

  if (currentView === 'admin-login') {
    return (
      <div>
        <div style={{ background: '#0f172a', padding: '0.6rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: '#e52b31', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>ADMIN GATEWAY</span>
            <span style={{ color: '#f8fafc', fontSize: '0.88rem', fontWeight: 600 }}>Admin Login (URL: http://localhost:3000/admin)</span>
          </div>
          <button
            onClick={() => navigateTo('store')}
            style={{ background: 'none', border: '1px solid #334155', color: '#38bdf8', padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
          >
            ← Switch to Public Store Page
          </button>
        </div>
        <AdminLogin />
      </div>
    );
  }

  if (currentView === 'cart') {
    return <CartPage />;
  }

  if (currentView === 'checkout') {
    return <CheckoutPage />;
  }

  if (currentView === 'dashboard') {
    return <UserDashboard initialTab="profile" />;
  }

  if (currentView === 'orders') {
    return <UserDashboard initialTab="orders" />;
  }

  // Public Customer Storefront (URL: http://localhost:3000/)
  return <PublicStore />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <UserAuthProvider>
        <MainRouter />
      </UserAuthProvider>
    </AuthProvider>
  );
};

export default App;
