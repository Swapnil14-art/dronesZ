import React, { useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from '../components/UserAuthModal';
import { StitchHeader } from '../components/StitchHeader';
import { StitchFooter } from '../components/StitchFooter';

export const CartPage: React.FC = () => {
  const { cart, isAuthenticated, updateCartQuantity, removeFromCart } = useUserAuth();
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
      <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StitchHeader activePage="cart" />

        <main style={{ flex: 1, maxWidth: '540px', width: '100%', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div className="stitch-card" style={{ padding: '3.5rem 2rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-on-surface)' }}>
              Sign in to view your cart
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
              Your shopping cart is linked to your customer account. Please log in or register to view saved items and complete checkout.
            </p>
            <button
              className="btn-stitch-primary"
              onClick={() => setShowAuthModal(true)}
              style={{ padding: '0.85rem 2rem', fontSize: '0.9rem' }}
            >
              Sign In / Create Account
            </button>
          </div>
        </main>

        <StitchFooter />

        <UserAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  const subtotal = cart?.totalAmount || 0;
  const estimatedTax = subtotal * 0.18;
  const shippingFee = subtotal >= 5000 || subtotal === 0 ? 0 : 150;
  const grandTotal = subtotal + estimatedTax + shippingFee;

  return (
    <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StitchHeader activePage="cart" />

      <main style={{ flex: 1, maxWidth: 'var(--max-width)', width: '100%', margin: '0 auto', padding: '3rem 2rem 5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              CUSTOMER SHOPPING CART
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
              Selected Components &amp; Hardware
            </h1>
          </div>
          <button className="btn-stitch-ghost" onClick={() => navigateTo('/store')}>
            ← Continue Shopping
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem', borderRadius: '0.375rem', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div className="stitch-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-on-surface)' }}>Your shopping cart is empty</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
              Explore our catalog of high-efficiency motors, carbon frames, and precision flight components.
            </p>
            <button
              className="btn-stitch-primary"
              onClick={() => navigateTo('/store')}
              style={{ padding: '0.75rem 2rem' }}
            >
              Browse Drone Catalog
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
            {/* Cart Item List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="stitch-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr auto auto',
                    gap: '1.5rem',
                    alignItems: 'center',
                    padding: '1.25rem',
                  }}
                >
                  {/* Thumbnail Void Container */}
                  <div
                    className="image-void-stage"
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '0.375rem',
                      fontSize: '1.75rem',
                    }}
                  >
                    🚁
                  </div>

                  {/* Info */}
                  <div>
                    <span className="badge-category" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                      {item.productType}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '0.25rem' }}>
                      {item.productName}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      Stock available: <strong>{item.stockAvailable} units</strong>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.4rem' }}>
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="btn-stitch-ghost"
                      style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={updatingId === item.id || item.quantity <= 1}
                      onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity - 1, item.stockAvailable)}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 700, width: '28px', textAlign: 'center', fontSize: '1rem' }}>{item.quantity}</span>
                    <button
                      className="btn-stitch-ghost"
                      style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={updatingId === item.id || item.quantity >= item.stockAvailable}
                      onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity + 1, item.stockAvailable)}
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-on-surface)' }}>
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={updatingId === item.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-error)',
                        cursor: 'pointer',
                        fontSize: '12px',
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
              <div className="stitch-card" style={{ padding: '1.75rem', position: 'sticky', top: '100px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--color-outline)', paddingBottom: '0.75rem', color: 'var(--color-on-surface)' }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                    <span>Subtotal ({cart.totalItems} items)</span>
                    <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                    <span>Estimated GST (18%)</span>
                    <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>₹{estimatedTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                    <span>Shipping Fee</span>
                    <span style={{ color: shippingFee === 0 ? 'var(--color-tertiary)' : 'var(--color-on-surface)', fontWeight: 600 }}>
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>

                  {shippingFee > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--color-tertiary)', fontWeight: 600 }}>
                      💡 Add items worth ₹{(5000 - subtotal).toLocaleString('en-IN')} more for FREE shipping!
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: '2px solid var(--color-outline)',
                    paddingTop: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Grand Total</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  className="btn-stitch-primary"
                  onClick={() => navigateTo('/checkout')}
                  style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <StitchFooter />
    </div>
  );
};
