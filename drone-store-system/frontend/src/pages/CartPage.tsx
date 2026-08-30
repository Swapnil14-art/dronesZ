import React, { useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from '../components/UserAuthModal';

export const CartPage: React.FC = () => {
  const { user, cart, isAuthenticated, updateCartQuantity, removeFromCart, logout } = useUserAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleQuantityChange = async (itemId: number, currentQty: number, newQty: number, maxStock: number) => {
    setError(null);
    if (newQty < 1) return;
    if (newQty > maxStock) {
      setError(`Cannot set quantity above available stock (${maxStock}).`);
      return;
    }
    try {
      setUpdatingId(itemId);
      await updateCartQuantity(itemId, newQty);
    } catch (err: any) {
      setError(err.message || 'Failed to update item quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    setError(null);
    try {
      setUpdatingId(itemId);
      await removeFromCart(itemId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#ffffff', borderBottom: '1px solid var(--color-line)', padding: '1rem 1.5rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div onClick={() => navigateTo('/store')} style={{ cursor: 'pointer' }}>
              <h1 className="brand-wordmark" style={{ fontSize: '1.75rem' }}>
                Drones<span className="accent">Z</span> Store
              </h1>
            </div>
            <button className="btn-dronesz-primary" onClick={() => setShowAuthModal(true)}>
              Customer Sign In / Register
            </button>
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: '600px', width: '100%', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div className="dronesz-card" style={{ padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Sign in to view your cart</h2>
            <p style={{ color: 'var(--color-ink-muted)', marginBottom: '2rem' }}>
              Your shopping cart is tied to your customer account. Please log in or register to access your saved items.
            </p>
            <button
              className="btn-dronesz-primary"
              onClick={() => setShowAuthModal(true)}
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              Sign In / Create Account
            </button>
          </div>
        </main>

        <UserAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  const subtotal = cart?.totalAmount || 0;
  const estimatedTax = subtotal * 0.18;
  const shippingFee = subtotal >= 5000 || subtotal === 0 ? 0 : 150;
  const grandTotal = subtotal + estimatedTax + shippingFee;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid var(--color-line)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => navigateTo('/store')} style={{ cursor: 'pointer' }}>
            <h1 className="brand-wordmark" style={{ fontSize: '1.75rem' }}>
              Drones<span className="accent">Z</span> Store
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn-dronesz-secondary" onClick={() => navigateTo('/store')}>
              ← Back to Catalog
            </button>
            <button className="btn-dronesz-secondary" onClick={() => navigateTo('/dashboard')}>
              👤 Hi, {user?.fullName.split(' ')[0]}
            </button>
            <button className="btn-dronesz-secondary" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--color-ink-primary)' }}>Shopping Cart</h1>
            <p style={{ color: 'var(--color-ink-muted)', margin: '0.25rem 0 0 0' }}>Review your selected high-performance components</p>
          </div>
          <button className="btn-dronesz-secondary" onClick={() => navigateTo('/store')}>
            Continue Shopping
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div className="dronesz-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your shopping cart is empty</h2>
            <p style={{ color: 'var(--color-ink-muted)', marginBottom: '2rem' }}>
              You have not added any products to your cart yet.
            </p>
            <button
              className="btn-dronesz-primary"
              onClick={() => navigateTo('/store')}
              style={{ padding: '0.75rem 2rem' }}
            >
              Browse Drone Catalog
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
            {/* Cart Item List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="dronesz-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr auto auto',
                    gap: '1.5rem',
                    alignItems: 'center',
                    padding: '1.25rem',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      border: '1px solid var(--color-line)',
                    }}
                  >
                    🚁
                  </div>

                  {/* Info */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--color-ink-primary)' }}>{item.productName}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="category-pill">{item.productType}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
                        Stock: {item.stockAvailable} available
                      </span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-brand-red)', marginTop: '0.5rem' }}>
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="btn-dronesz-secondary btn-sm"
                      style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={updatingId === item.id || item.quantity <= 1}
                      onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity - 1, item.stockAvailable)}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 700, width: '28px', textAlign: 'center' }}>{item.quantity}</span>
                    <button
                      className="btn-dronesz-secondary btn-sm"
                      style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={updatingId === item.id || item.quantity >= item.stockAvailable}
                      onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity + 1, item.stockAvailable)}
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-ink-primary)' }}>
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={updatingId === item.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      Remove 🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Box */}
            <div>
              <div className="dronesz-card" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--color-line)', paddingBottom: '0.75rem' }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
                    <span>Subtotal ({cart.totalItems} items)</span>
                    <span style={{ color: 'var(--color-ink-primary)', fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
                    <span>Estimated GST (18%)</span>
                    <span style={{ color: 'var(--color-ink-primary)', fontWeight: 600 }}>₹{estimatedTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
                    <span>Shipping Fee</span>
                    <span style={{ color: shippingFee === 0 ? '#10b981' : 'var(--color-ink-primary)', fontWeight: 600 }}>
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>

                  {shippingFee > 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
                      💡 Add items worth ₹{(5000 - subtotal).toLocaleString('en-IN')} more for FREE shipping!
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: '2px solid var(--color-line)',
                    paddingTop: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Grand Total</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brand-red)' }}>
                    ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  className="btn-dronesz-primary"
                  onClick={() => navigateTo('/checkout')}
                  style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700 }}
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
