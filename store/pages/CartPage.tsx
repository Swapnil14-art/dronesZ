"use client";

import React, { useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from '../components/UserAuthModal';
import { StitchHeader } from '../components/StitchHeader';
import { StitchFooter } from '../components/StitchFooter';
import { getProductImageUrl } from '../services/api';

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
    if (newQty <= 0) {
      return handleRemove(itemId);
    }
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

  const hasOutOfStockItems = cart?.items.some((item) => (item.stockAvailable || 0) <= 0 || item.status === 'OUT_OF_STOCK');
  const hasOverStockItems = cart?.items.some((item) => item.quantity > (item.stockAvailable || 0));

  return (
    <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StitchHeader activePage="cart" />

      <main style={{ flex: 1, maxWidth: 'var(--max-width)', width: '100%', margin: '0 auto', padding: '3rem 2rem 5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              CUSTOMER SHOPPING CART
            </div><br></br><br></br>
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
            ✕ {error}
          </div>
        )}

        {hasOutOfStockItems && (
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem 1.25rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong>One or more items in your cart are currently out of stock.</strong> Please remove them to proceed with checkout.
            </div>
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
              {cart.items.map((item) => {
                const stock = item.stockAvailable !== undefined && item.stockAvailable !== null ? item.stockAvailable : 0;
                const isItemOutOfStock = stock <= 0 || item.status === 'OUT_OF_STOCK';
                const isMaxStockInCart = !isItemOutOfStock && item.quantity >= stock;

                return (
                  <div
                    key={item.id}
                    className="stitch-card"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1fr auto auto',
                      gap: '1.5rem',
                      alignItems: 'center',
                      padding: '1.25rem',
                      border: isItemOutOfStock ? '1px solid #fca5a5' : undefined,
                      background: isItemOutOfStock ? '#fff5f5' : undefined
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
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        background: 'var(--color-surface, #f8fafc)',
                        border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))'
                      }}
                    >
                      {item.productImage ? (
                        <img
                          src={getProductImageUrl(item.productImage)!}
                          alt={item.productName}
                          className="product-img"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            // Fallback to emoji if image cannot be loaded
                            (e.target as HTMLElement).style.display = 'none';
                            if ((e.target as HTMLElement).parentElement) {
                              const fallback = document.createElement('span');
                              fallback.innerText = '🚁';
                              (e.target as HTMLElement).parentElement?.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span>🚁</span>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge-category" style={{ display: 'inline-block' }}>
                          {item.productType}
                        </span>
                        {isItemOutOfStock ? (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            OUT OF STOCK
                          </span>
                        ) : isMaxStockInCart ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                            MAX STOCK IN CART
                          </span>
                        ) : null}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '0.25rem' }}>
                        {item.productName}
                      </h3>

                      <div style={{ fontSize: '12px', color: isItemOutOfStock ? 'var(--color-error)' : 'var(--color-muted)', fontWeight: isItemOutOfStock ? 700 : 400 }}>
                        {isItemOutOfStock
                          ? 'Item is currently unavailable in inventory'
                          : `Stock available: ${stock} unit${stock === 1 ? '' : 's'}`}
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
                        disabled={updatingId === item.id || isItemOutOfStock}
                        onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity - 1, stock)}
                        title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 700, width: '28px', textAlign: 'center', fontSize: '1rem', color: isItemOutOfStock ? 'var(--color-muted)' : 'inherit' }}>
                        {item.quantity}
                      </span>
                      <button
                        className="btn-stitch-ghost"
                        style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={updatingId === item.id || item.quantity >= stock || isItemOutOfStock}
                        onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity + 1, stock)}
                        title={item.quantity >= stock ? `Cannot exceed available stock (${stock})` : "Increase quantity"}
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
                          cursor: updatingId === item.id ? 'wait' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          opacity: updatingId === item.id ? 0.6 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Remove item from cart"
                      >
                        {updatingId === item.id ? 'Removing...' : 'Remove 🗑️'}
                      </button>
                    </div>
                  </div>
                );
              })}
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
                  disabled={hasOutOfStockItems || hasOverStockItems}
                  onClick={() => navigateTo('/checkout')}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    opacity: (hasOutOfStockItems || hasOverStockItems) ? 0.6 : 1,
                    cursor: (hasOutOfStockItems || hasOverStockItems) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {hasOutOfStockItems ? 'Remove Out-of-Stock Items' : 'Proceed to Checkout →'}
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
