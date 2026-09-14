"use client";

import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import {
  CheckoutSummaryDto,
  fetchCheckoutSummary,
  createUserAddress,
} from '../services/api';
import { StitchHeader } from '../components/StitchHeader';
import { StitchFooter } from '../components/StitchFooter';

export const CheckoutPage: React.FC = () => {
  const { token, isAuthenticated } = useUserAuth();
  const [summary, setSummary] = useState<CheckoutSummaryDto | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Address form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [savingAddress, setSavingAddress] = useState(false);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchCheckoutSummary(token);
      setSummary(data);
      if (data.addresses && data.addresses.length > 0) {
        const defaultAddr = data.addresses.find((a) => a.isDefault) || data.addresses[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, token]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      setError('Please fill in all required address fields.');
      return;
    }

    try {
      setSavingAddress(true);
      const newAddr = await createUserAddress(token, {
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        isDefault: true,
      });
      setSavingAddress(false);
      setShowAddressForm(false);
      setFullName(''); setPhone(''); setAddressLine1(''); setAddressLine2(''); setCity(''); setState(''); setPostalCode('');
      await loadData();
      setSelectedAddressId(newAddr.id);
    } catch (err: any) {
      setSavingAddress(false);
      setError(err.message || 'Failed to save new address.');
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address.');
      return;
    }
    setOrderSuccess(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StitchHeader activePage="checkout" />
        <main style={{ flex: 1, maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
          <div className="stitch-card" style={{ padding: '3.5rem 2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-on-surface)' }}>
              Sign in to proceed to Checkout
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
              Please sign in to your customer account to choose your shipping address and review payment summary.
            </p>
            <button className="btn-stitch-primary" onClick={() => navigateTo('/cart')}>
              Return to Cart
            </button>
          </div>
        </main>
        <StitchFooter />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StitchHeader activePage="checkout" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-muted)' }}>Loading Checkout Details...</div>
        </div>
        <StitchFooter />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StitchHeader activePage="checkout" />
        <main style={{ flex: 1, maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div className="stitch-card" style={{ padding: '4rem 2rem', borderTop: '4px solid var(--color-tertiary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>
              Order Ready for Processing!
            </h1>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Your high-precision multirotor component order has been reserved. Select your preferred payment gateway or manage order status from your dashboard.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-stitch-primary" onClick={() => navigateTo('/orders')}>
                View Order History
              </button>
              <button className="btn-stitch-ghost" onClick={() => navigateTo('/store')}>
                Return to Store Catalog
              </button>
            </div>
          </div>
        </main>
        <StitchFooter />
      </div>
    );
  }

  const cartItems = summary?.cart?.items || [];
  const addresses = summary?.addresses || [];

  return (
    <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StitchHeader activePage="checkout" />

      <main style={{ flex: 1, maxWidth: 'var(--max-width)', width: '100%', margin: '0 auto', padding: '3rem 2rem 5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              FINAL ORDER CHECKOUT
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
              Shipping &amp; Order Breakdown
            </h1>
          </div>
          <button className="btn-stitch-ghost" onClick={() => navigateTo('/cart')}>
            ← Back to Cart
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem', borderRadius: '0.375rem', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
          {/* Left Column: Delivery Address & Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 1. Address Selection Card */}
            <div className="stitch-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📍 Delivery Address
                </h3>
                <button
                  className="btn-stitch-ghost"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  style={{ fontSize: '12px' }}
                >
                  {showAddressForm ? 'Cancel' : '+ Add New Address'}
                </button>
              </div>

              {showAddressForm ? (
                <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="stitch-form-group">
                      <label className="stitch-label">Full Name *</label>
                      <input type="text" className="stitch-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="stitch-form-group">
                      <label className="stitch-label">Phone Number *</label>
                      <input type="tel" className="stitch-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>

                  <div className="stitch-form-group">
                    <label className="stitch-label">Address Line 1 *</label>
                    <input type="text" className="stitch-input" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="House/Flat No., Building, Street" required />
                  </div>

                  <div className="stitch-form-group">
                    <label className="stitch-label">Address Line 2 (Optional)</label>
                    <input type="text" className="stitch-input" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Landmark, Area" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="stitch-form-group">
                      <label className="stitch-label">City *</label>
                      <input type="text" className="stitch-input" value={city} onChange={(e) => setCity(e.target.value)} required />
                    </div>
                    <div className="stitch-form-group">
                      <label className="stitch-label">State *</label>
                      <input type="text" className="stitch-input" value={state} onChange={(e) => setState(e.target.value)} required />
                    </div>
                    <div className="stitch-form-group">
                      <label className="stitch-label">Postal / ZIP Code *</label>
                      <input type="text" className="stitch-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                    </div>
                  </div>

                  <button type="submit" className="btn-stitch-primary" disabled={savingAddress} style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}>
                    {savingAddress ? 'Saving Address...' : 'Save & Select Address'}
                  </button>
                </form>
              ) : addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-muted)' }}>
                  No saved delivery addresses found. Please add a shipping address to proceed.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1.25rem',
                        borderRadius: '0.375rem',
                        border: selectedAddressId === addr.id ? '2px solid var(--color-primary)' : '1px solid var(--color-outline)',
                        background: selectedAddressId === addr.id ? '#fef2f2' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        style={{ marginTop: '0.25rem', accentColor: 'var(--color-primary)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-on-surface)', fontSize: '1rem' }}>
                          {addr.fullName} <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: '0.9rem' }}>({addr.phone})</span>
                          {addr.isDefault && (
                            <span className="badge-tertiary" style={{ marginLeft: '0.5rem' }}>
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.35rem', lineHeight: 1.4 }}>
                          {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Review Cart Items */}
            <div className="stitch-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-on-surface)' }}>
                📦 Hardware Items ({summary?.cart?.totalItems})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-outline)', paddingBottom: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{item.productName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                        Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div>
            <div className="stitch-card" style={{ padding: '1.75rem', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--color-outline)', paddingBottom: '0.75rem', color: 'var(--color-on-surface)' }}>
                Order Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                  <span>Subtotal</span>
                  <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>₹{summary?.subtotal?.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                  <span>Estimated GST (18%)</span>
                  <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>₹{summary?.taxAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
                  <span>Shipping Fee</span>
                  <span style={{ color: summary?.shippingFee === 0 ? 'var(--color-tertiary)' : 'var(--color-on-surface)', fontWeight: 600 }}>
                    {summary?.shippingFee === 0 ? 'FREE' : `₹${summary?.shippingFee}`}
                  </span>
                </div>
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
                  ₹{summary?.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <button
                className="btn-stitch-primary"
                onClick={handlePlaceOrder}
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 700 }}
              >
                Place Order &amp; Confirm →
              </button>
            </div>
          </div>
        </div>
      </main>

      <StitchFooter />
    </div>
  );
};
