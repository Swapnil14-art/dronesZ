import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import {
  CheckoutSummaryDto,
  UserAddressDto,
  fetchCheckoutSummary,
  createUserAddress,
} from '../services/api';

export const CheckoutPage: React.FC = () => {
  const { user, token, isAuthenticated, logout } = useUserAuth();
  const [summary, setSummary] = useState<CheckoutSummaryDto | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <button className="btn-dronesz-primary" onClick={() => navigateTo('/cart')}>
              Back to Cart
            </button>
          </div>
        </header>
        <main style={{ flex: 1, maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
          <div className="dronesz-card" style={{ padding: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Sign in to proceed to Checkout</h2>
            <button className="btn-dronesz-primary" onClick={() => navigateTo('/cart')}>
              Return to Cart
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--color-ink-muted)' }}>Loading Checkout Details...</div>
      </div>
    );
  }

  const cartItems = summary?.cart?.items || [];
  const addresses = summary?.addresses || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#ffffff', borderBottom: '1px solid var(--color-line)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => navigateTo('/store')} style={{ cursor: 'pointer' }}>
            <h1 className="brand-wordmark" style={{ fontSize: '1.75rem' }}>
              Drones<span className="accent">Z</span> Store
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn-dronesz-secondary" onClick={() => navigateTo('/cart')}>
              ← Back to Cart
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

      <main style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--color-ink-primary)' }}>Order Checkout</h1>

        {error && <div className="error-banner" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
          {/* Left Section: Delivery Address & Cart Review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1. Delivery Address Selection */}
            <div className="dronesz-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>📍 Select Delivery Address</h3>
                <button
                  className="btn-dronesz-secondary btn-sm"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  {showAddressForm ? 'Cancel' : '+ Add New Address'}
                </button>
              </div>

              {showAddressForm ? (
                <form onSubmit={handleAddAddress} style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div className="input-group">
                      <label className="input-label">Full Name *</label>
                      <input type="text" className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phone Number *</label>
                      <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Address Line 1 *</label>
                    <input type="text" className="input-field" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="House/Flat No., Building, Street" required />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Address Line 2 (Optional)</label>
                    <input type="text" className="input-field" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Landmark, Area" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                    <div className="input-group">
                      <label className="input-label">City *</label>
                      <input type="text" className="input-field" value={city} onChange={(e) => setCity(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">State *</label>
                      <input type="text" className="input-field" value={state} onChange={(e) => setState(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Postal / ZIP Code *</label>
                      <input type="text" className="input-field" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                    </div>
                  </div>

                  <button type="submit" className="btn-dronesz-primary" disabled={savingAddress} style={{ marginTop: '0.5rem', width: '100%' }}>
                    {savingAddress ? 'Saving Address...' : 'Save & Select Address'}
                  </button>
                </form>
              ) : addresses.length === 0 ? (
                <p style={{ color: 'var(--color-ink-muted)' }}>No delivery address found. Please add an address to continue.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: selectedAddressId === addr.id ? '2px solid var(--color-brand-red)' : '1px solid var(--color-line)',
                        background: selectedAddressId === addr.id ? 'var(--color-brand-red-light)' : '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-ink-primary)' }}>
                          {addr.fullName} <span style={{ fontWeight: 400, color: 'var(--color-ink-muted)' }}>({addr.phone})</span>
                          {addr.isDefault && <span className="category-pill" style={{ marginLeft: '0.5rem', background: 'var(--color-brand-red)', color: '#fff' }}>DEFAULT</span>}
                        </div>
                        <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                          {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Cart Items Review */}
            <div className="dronesz-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>📦 Review Items ({summary?.cart?.totalItems})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-line)', paddingBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-ink-primary)' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
                        Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-brand-red)' }}>
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section: Payment & Order Summary */}
          <div>
            <div className="dronesz-card" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--color-line)', paddingBottom: '0.75rem' }}>
                Order Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
                  <span>Subtotal</span>
                  <span style={{ color: 'var(--color-ink-primary)', fontWeight: 600 }}>₹{summary?.subtotal?.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
                  <span>Estimated GST (18%)</span>
                  <span style={{ color: 'var(--color-ink-primary)', fontWeight: 600 }}>₹{summary?.taxAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
                  <span>Shipping Charge</span>
                  <span style={{ color: summary?.shippingFee === 0 ? '#10b981' : 'var(--color-ink-primary)', fontWeight: 600 }}>
                    {summary?.shippingFee === 0 ? 'FREE' : `₹${summary?.shippingFee}`}
                  </span>
                </div>
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
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total Payable</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brand-red)' }}>
                  ₹{summary?.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Warning Banner */}
              <div
                className="error-banner"
                style={{ background: '#fffbe6', borderColor: '#ffe58f', color: '#d48806', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.4' }}
              >
                ⚠️ <strong>Payment Gateway Pending (Phase 6):</strong>
                <br />
                Order placement will be enabled once payment gateway integration is configured in Phase 6.
              </div>

              {/* Place Order Disabled Button */}
              <button
                className="btn-dronesz-primary"
                disabled={true}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  opacity: 0.5,
                  cursor: 'not-allowed',
                }}
              >
                Place Order (Payment Integration Pending)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
