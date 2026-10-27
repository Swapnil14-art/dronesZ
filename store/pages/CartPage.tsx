import React, { useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { UserAuthModal } from '../components/UserAuthModal';
import { StitchHeader } from '../components/StitchHeader';
import { StitchFooter } from '../components/StitchFooter';
import { getProductImageUrl, submitCartEnquiry } from '../services/api';

export const CartPage: React.FC = () => {
  const { cart, token, user, isAuthenticated, updateCartQuantity, removeFromCart, clearCart } = useUserAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [sendingEnquiry, setSendingEnquiry] = useState(false);
  const [enquirySuccessRef, setEnquirySuccessRef] = useState<string | null>(null);
  const [enquirySuccessMessage, setEnquirySuccessMessage] = useState<string | null>(null);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [inputQuantities, setInputQuantities] = useState<{ [itemId: number]: string }>({});

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleQuantityChange = async (itemId: number, newQty: number, maxStock: number) => {
    setError(null);
    setEnquiryError(null);
    if (newQty <= 0) {
      return handleRemove(itemId);
    }
    if (newQty > maxStock) {
      setError(`Requested quantity exceeds available stock (${maxStock} units).`);
      return;
    }
    try {
      setUpdatingId(itemId);
      await updateCartQuantity(itemId, newQty);
      setInputQuantities((prev) => ({ ...prev, [itemId]: String(newQty) }));
    } catch (err: any) {
      setError(err.message || 'Failed to update item quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInputQuantityBlur = async (itemId: number, currentQty: number, maxStock: number) => {
    const rawVal = inputQuantities[itemId];
    if (rawVal === undefined || rawVal === '') {
      setInputQuantities((prev) => ({ ...prev, [itemId]: String(currentQty) }));
      return;
    }
    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      setInputQuantities((prev) => ({ ...prev, [itemId]: String(currentQty) }));
      return;
    }
    if (parsed === currentQty) return;
    await handleQuantityChange(itemId, parsed, maxStock);
  };

  const handleRemove = async (itemId: number) => {
    setError(null);
    setEnquiryError(null);
    try {
      setUpdatingId(itemId);
      await removeFromCart(itemId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to remove all components from your enquiry cart?')) {
      return;
    }
    setError(null);
    setEnquiryError(null);
    try {
      await clearCart();
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart.');
    }
  };

  const handleSendEnquiry = async () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    if (!cart || cart.items.length === 0) {
      setEnquiryError('Your enquiry cart is empty. Please add components before submitting.');
      return;
    }

    setSendingEnquiry(true);
    setEnquiryError(null);

    try {
      const response = await submitCartEnquiry(token, notes);
      if (response.success && response.reference) {
        setEnquirySuccessRef(response.reference);
        setEnquirySuccessMessage(response.message || 'Your enquiry has been successfully delivered to our engineering and sales department.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setEnquiryError(response.error || 'Failed to submit enquiry. Your cart has been retained.');
      }
    } catch (err: any) {
      setEnquiryError(err.message || 'Network error encountered while sending enquiry. Your cart has been retained.');
    } finally {
      setSendingEnquiry(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StitchHeader activePage="cart" />

        <main style={{ flex: 1, maxWidth: '560px', width: '100%', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div className="stitch-card" style={{ padding: '3.5rem 2rem', borderTop: '4px solid var(--color-primary, #e52b31)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-on-surface)' }}>
              Sign In to Access Your Enquiry Cart
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Dronesz provides professional quotation and engineering consultations for enterprise drone components. Please sign in or register to manage your selected hardware and send formal enquiries.
            </p>
            <button
              className="btn-stitch-primary"
              onClick={() => setShowAuthModal(true)}
              style={{ padding: '0.85rem 2.25rem', fontSize: '0.95rem', fontWeight: 700 }}
            >
              Sign In / Create Customer Account
            </button>
          </div>
        </main>

        <StitchFooter />

        <UserAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  const subtotal = cart?.totalAmount || 0;
  const hasOutOfStockItems = cart?.items.some((item) => (item.stockAvailable || 0) <= 0 || item.status === 'OUT_OF_STOCK');
  const hasOverStockItems = cart?.items.some((item) => item.quantity > (item.stockAvailable || 0));

  return (
    <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StitchHeader activePage="cart" />

      <main style={{ flex: 1, maxWidth: 'var(--max-width, 1200px)', width: '100%', margin: '0 auto', padding: 'clamp(1.5rem, 3vw, 3rem) clamp(1rem, 3vw, 2rem) clamp(3rem, 5vw, 5rem)' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-primary, #e52b31)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              ENQUIRY &amp; QUOTATION WORKFLOW
            </div>
            <br></br>
            <h1 style={{ fontSize: 'clamp(1.75rem, 1.4rem + 1.5vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
              Component Enquiry Cart
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {cart && cart.items.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="btn-stitch-ghost"
                style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: '13px' }}
                title="Remove all items from your cart"
              >
                Clear Cart 🗑️
              </button>
            )}
            <button className="btn-stitch-ghost" onClick={() => navigateTo('/store')}>
              ← Browse Catalogue
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {enquirySuccessRef && (
          <div
            style={{
              background: '#ecfdf5',
              border: '2px solid #10b981',
              borderRadius: '0.5rem',
              padding: '1.5rem 1.75rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>✅</span>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46', marginBottom: '0.35rem' }}>
                    Enquiry Successfully Submitted!
                  </h3>
                  <div style={{ display: 'inline-block', background: '#d1fae5', color: '#047857', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Reference #{enquirySuccessRef}
                  </div>
                  <p style={{ color: '#047857', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                    {enquirySuccessMessage || 'Your component quotation request has been dispatched to our engineering & sales team.'}
                    <br />
                    A representative will contact you at <strong>{user?.email || 'your registered email'}</strong>.
                  </p>
                  <p style={{ color: '#065f46', fontSize: '0.82rem', marginTop: '0.5rem', fontWeight: 600 }}>
                    ℹ️ Note: Your cart items have been retained unchanged below for your records or additional requests.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnquirySuccessRef(null)}
                style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 700, padding: '0.25rem' }}
                aria-label="Dismiss success banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem 1.25rem', borderRadius: '0.375rem', marginBottom: '2rem' }}>
            ✕ {error}
          </div>
        )}

        {/* Enquiry Submission Error Banner */}
        {enquiryError && (
          <div
            style={{
              background: '#fff1f2',
              border: '2px solid #f43f5e',
              color: '#9f1239',
              padding: '1.25rem 1.5rem',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚠️</span>
              <div>
                <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>Enquiry Delivery Could Not Be Completed</strong>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {enquiryError}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#be123c', fontWeight: 600 }}>
                  ✓ Your cart items remain completely safe and unchanged. You may retry or contact us directly at <a href="mailto:sales@dronesz.in" style={{ textDecoration: 'underline', color: 'inherit' }}>sales@dronesz.in</a>.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnquiryError(null)}
              style={{ background: 'none', border: 'none', color: '#9f1239', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 700 }}
              aria-label="Dismiss error banner"
            >
              ✕
            </button>
          </div>
        )}

        {hasOutOfStockItems && (
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem 1.25rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong>One or more items in your cart are currently out of stock.</strong> Please adjust or remove them before sending your enquiry.
            </div>
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div className="stitch-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-on-surface)' }}>
              Your enquiry cart is empty
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
              Browse our high-performance drone motors, carbon fiber frames, parachutes, and subsystems to assemble your customized configuration for quotation.
            </p>
            <button
              className="btn-stitch-primary"
              onClick={() => navigateTo('/store')}
              style={{ padding: '0.75rem 2rem' }}
            >
              Explore Drone Catalogue
            </button>
          </div>
        ) : (
          <div className="stitch-cart-grid">
            {/* Cart Item List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minWidth: 0 }}>
              {cart.items.map((item) => {
                const stock = item.stockAvailable !== undefined && item.stockAvailable !== null ? item.stockAvailable : 0;
                const isItemOutOfStock = stock <= 0 || item.status === 'OUT_OF_STOCK';
                const isMaxStockInCart = !isItemOutOfStock && item.quantity >= stock;
                const displayedInputValue = inputQuantities[item.id] !== undefined ? inputQuantities[item.id] : String(item.quantity);

                return (
                  <div
                    key={item.id}
                    className="stitch-card stitch-cart-item"
                    style={{
                      border: isItemOutOfStock ? '1px solid #fca5a5' : undefined,
                      background: isItemOutOfStock ? '#fff5f5' : undefined,
                    }}
                  >
                    {/* Thumbnail Container */}
                    <div
                      className="image-void-stage"
                      style={{
                        width: '100%',
                        maxWidth: '90px',
                        height: '90px',
                        borderRadius: '0.375rem',
                        fontSize: '1.75rem',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        background: 'var(--color-surface, #f8fafc)',
                        border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))',
                        flexShrink: 0,
                      }}
                    >
                      {item.productImage ? (
                        <img
                          src={getProductImageUrl(item.productImage)!}
                          alt={item.productName}
                          className="product-img"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
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
                    <div style={{ minWidth: 0, overflowWrap: 'break-word', flex: 1 }}>
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
                            MAX INVENTORY REACHED
                          </span>
                        ) : null}
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                        {item.productName}
                      </h3>

                      {isItemOutOfStock && (
                        <div style={{ fontSize: '12px', color: 'var(--color-error, #dc2626)', fontWeight: 700 }}>
                          Item is currently unavailable in inventory
                        </div>
                      )}

                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary, #e52b31)', marginTop: '0.4rem' }}>
                        ₹{item.price.toLocaleString('en-IN')} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-muted)' }}>/ unit</span>
                      </div>
                    </div>

                    {/* Actions Group (Quantity Stepper & Subtotal/Delete) */}
                    <div className="stitch-cart-item__actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                      {/* Quantity input & Steppers */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          type="button"
                          className="btn-stitch-ghost"
                          style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          disabled={updatingId === item.id || isItemOutOfStock}
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1, stock)}
                          title={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={stock > 0 ? stock : 1}
                          disabled={updatingId === item.id || isItemOutOfStock}
                          value={displayedInputValue}
                          onChange={(e) => setInputQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          onBlur={() => handleInputQuantityBlur(item.id, item.quantity, stock)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          style={{
                            width: '48px',
                            height: '32px',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.2))',
                            borderRadius: '4px',
                            background: isItemOutOfStock ? '#f1f5f9' : '#fff',
                            color: isItemOutOfStock ? 'var(--color-muted)' : 'inherit',
                          }}
                          title="Enter desired quantity"
                        />

                        <button
                          type="button"
                          className="btn-stitch-ghost"
                          style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          disabled={updatingId === item.id || item.quantity >= stock || isItemOutOfStock}
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1, stock)}
                          title={item.quantity >= stock ? 'Maximum available limit reached' : 'Increase quantity'}
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div style={{ textAlign: 'right', minWidth: '85px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--color-on-surface)' }}>
                          ₹{item.subtotal.toLocaleString('en-IN')}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={updatingId === item.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-error, #dc2626)',
                            cursor: updatingId === item.id ? 'wait' : 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '2px 4px',
                            borderRadius: '4px',
                            opacity: updatingId === item.id ? 0.6 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Remove item from cart"
                        >
                          {updatingId === item.id ? 'Removing...' : 'Remove 🗑️'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar: Enquiry & Quotation Summary */}
            <div>
              <div className="stitch-card" style={{ padding: '1.75rem', position: 'sticky', top: '100px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--color-outline)', paddingBottom: '0.75rem', color: 'var(--color-on-surface)' }}>
                  Enquiry &amp; Quotation
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                    <span>Total Components</span>
                    <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>{cart.totalItems} units</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                    <span>Unique Items</span>
                    <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>{cart.items.length} products</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                    <span>Indicative Material Value</span>
                    <span style={{ color: 'var(--color-on-surface)', fontWeight: 700 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Customer Details Summary */}
                <div style={{ background: 'var(--color-surface, #f8fafc)', border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))', padding: '0.75rem 1rem', borderRadius: '0.375rem', marginBottom: '1.25rem', fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '0.2rem' }}>
                    Enquiring As:
                  </div>
                  <div style={{ color: 'var(--color-muted)' }}>
                    {user?.fullName || 'Valued Customer'} ({user?.email})
                  </div>
                  {user?.phone && (
                    <div style={{ color: 'var(--color-muted)', fontSize: '12px' }}>
                      Phone: {user.phone}
                    </div>
                  )}
                </div>

                {/* Project Notes Field */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="enquiry-notes" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '0.4rem' }}>
                    Project Notes &amp; Specifications (Optional)
                  </label>
                  <textarea
                    id="enquiry-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter custom requirements, target flight time, payload considerations, or delivery deadline..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      fontSize: '13px',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.2))',
                      background: 'var(--color-surface, #ffffff)',
                      color: 'var(--color-on-surface)',
                      resize: 'vertical',
                      lineHeight: 1.4,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Workflow Explanation Banner */}
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: '1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.375rem', padding: '0.75rem' }}>
                  💡 <strong>Direct Engineering Consultation:</strong> Submitting an enquiry requests an official commercial quote and availability timeline. No payment is collected online.
                </div>

                {/* Primary Action Button: Send Enquiry */}
                <button
                  id="send-cart-enquiry-button"
                  type="button"
                  className="btn-stitch-primary"
                  disabled={sendingEnquiry || hasOutOfStockItems || hasOverStockItems}
                  onClick={handleSendEnquiry}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    opacity: (sendingEnquiry || hasOutOfStockItems || hasOverStockItems) ? 0.6 : 1,
                    cursor: (sendingEnquiry || hasOutOfStockItems || hasOverStockItems) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {sendingEnquiry ? (
                    <>
                      <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Dispatching Enquiry...
                    </>
                  ) : hasOutOfStockItems ? (
                    'Remove Out-of-Stock Items'
                  ) : (
                    '📩 Send Enquiry'
                  )}
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

export default CartPage;
