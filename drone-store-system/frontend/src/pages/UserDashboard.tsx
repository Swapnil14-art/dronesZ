import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import {
  UserAddressDto,
  OrderDto,
  fetchUserAddresses,
  fetchUserOrders,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
  updateUserProfile,
} from '../services/api';

interface UserDashboardProps {
  initialTab?: 'profile' | 'addresses' | 'orders';
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ initialTab = 'profile' }) => {
  const { user, token, isAuthenticated, logout } = useUserAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>(initialTab);

  // Profile edit state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Address state
  const [addresses, setAddresses] = useState<UserAddressDto[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddressDto | null>(null);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCountry, setAddrCountry] = useState('India');
  const [savingAddr, setSavingAddr] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const loadAddresses = async () => {
    if (!token) return;
    try {
      const data = await fetchUserAddresses(token);
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses');
    }
  };

  const loadOrders = async () => {
    if (!token) return;
    try {
      setLoadingOrders(true);
      const data = await fetchUserOrders(token);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'addresses') loadAddresses();
      if (activeTab === 'orders') loadOrders();
    }
  }, [isAuthenticated, activeTab, token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileMsg(null);
    setError(null);
    try {
      setUpdatingProfile(true);
      await updateUserProfile(token, { fullName, phone });
      setUpdatingProfile(false);
      setProfileMsg('Profile updated successfully!');
    } catch (err: any) {
      setUpdatingProfile(false);
      setError(err.message || 'Failed to update profile.');
    }
  };

  const openAddressModal = (addr?: UserAddressDto) => {
    setError(null);
    if (addr) {
      setEditingAddress(addr);
      setAddrFullName(addr.fullName);
      setAddrPhone(addr.phone);
      setAddrLine1(addr.addressLine1);
      setAddrLine2(addr.addressLine2 || '');
      setAddrCity(addr.city);
      setAddrState(addr.state);
      setAddrPostal(addr.postalCode);
      setAddrCountry(addr.country || 'India');
    } else {
      setEditingAddress(null);
      setAddrFullName(user?.fullName || '');
      setAddrPhone(user?.phone || '');
      setAddrLine1(''); setAddrLine2(''); setAddrCity(''); setAddrState(''); setAddrPostal(''); setAddrCountry('India');
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    try {
      setSavingAddr(true);
      if (editingAddress) {
        await updateUserAddress(token, editingAddress.id, {
          fullName: addrFullName,
          phone: addrPhone,
          addressLine1: addrLine1,
          addressLine2: addrLine2,
          city: addrCity,
          state: addrState,
          postalCode: addrPostal,
          country: addrCountry,
        });
      } else {
        await createUserAddress(token, {
          fullName: addrFullName,
          phone: addrPhone,
          addressLine1: addrLine1,
          addressLine2: addrLine2,
          city: addrCity,
          state: addrState,
          postalCode: addrPostal,
          country: addrCountry,
          isDefault: addresses.length === 0,
        });
      }
      setSavingAddr(false);
      setShowAddressModal(false);
      await loadAddresses();
    } catch (err: any) {
      setSavingAddr(false);
      setError(err.message || 'Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!token || !window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteUserAddress(token, id);
      await loadAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    if (!token) return;
    try {
      await setDefaultUserAddress(token, id);
      await loadAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to set default address.');
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
            <button className="btn-dronesz-primary" onClick={() => navigateTo('/store')}>
              Go to Store Catalog
            </button>
          </div>
        </header>
        <main style={{ flex: 1, maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
          <div className="dronesz-card" style={{ padding: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Please Sign In to access your Account Dashboard</h2>
            <button className="btn-dronesz-primary" onClick={() => navigateTo('/store')}>
              Return to Store Catalog
            </button>
          </div>
        </main>
      </div>
    );
  }

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
            <button className="btn-dronesz-secondary" onClick={() => navigateTo('/store')}>
              🛒 Store Catalog
            </button>
            <button className="btn-dronesz-secondary" onClick={() => navigateTo('/cart')}>
              Cart
            </button>
            <button className="btn-dronesz-secondary" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1050px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--color-ink-primary)' }}>Customer Dashboard</h1>
          <p style={{ color: 'var(--color-ink-muted)', margin: '0.25rem 0 0 0' }}>Manage your profile, delivery addresses, and order history</p>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-line)', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid var(--color-brand-red)' : 'none',
              color: activeTab === 'profile' ? 'var(--color-brand-red)' : 'var(--color-ink-muted)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            👤 My Profile
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'addresses' ? '3px solid var(--color-brand-red)' : 'none',
              color: activeTab === 'addresses' ? 'var(--color-brand-red)' : 'var(--color-ink-muted)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📍 Saved Addresses
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '3px solid var(--color-brand-red)' : 'none',
              color: activeTab === 'orders' ? 'var(--color-brand-red)' : 'var(--color-ink-muted)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📦 Order History
          </button>
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <div className="dronesz-card" style={{ maxWidth: '600px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Personal Information</h2>

            {profileMsg && <div className="success-banner">{profileMsg}</div>}

            <form onSubmit={handleUpdateProfile}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="input-field"
                  value={user?.email}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-dronesz-primary"
                disabled={updatingProfile}
                style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem' }}
              >
                {updatingProfile ? 'Saving Changes...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Saved Delivery Addresses</h2>
              <button className="btn-dronesz-primary" onClick={() => openAddressModal()}>
                + Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="dronesz-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No saved addresses yet</h3>
                <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>Add a delivery address for faster checkout on your drone orders.</p>
                <button className="btn-dronesz-primary" onClick={() => openAddressModal()}>
                  Add Address Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {addresses.map((addr) => (
                  <div key={addr.id} className="dronesz-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{addr.fullName}</h3>
                        {addr.isDefault && <span className="category-pill" style={{ background: 'var(--color-brand-red)', color: '#fff' }}>DEFAULT</span>}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', marginBottom: '0.5rem' }}>📞 {addr.phone}</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--color-ink-primary)', lineHeight: '1.5' }}>
                        {addr.addressLine1}<br />
                        {addr.addressLine2 ? <>{addr.addressLine2}<br /></> : null}
                        {addr.city}, {addr.state} - {addr.postalCode}<br />
                        {addr.country}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-line)', paddingTop: '1rem' }}>
                      {!addr.isDefault && (
                        <button className="btn-dronesz-secondary btn-sm" onClick={() => handleSetDefaultAddress(addr.id)}>
                          Set Default
                        </button>
                      )}
                      <button className="btn-dronesz-secondary btn-sm" onClick={() => openAddressModal(addr)}>
                        Edit
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => handleDeleteAddress(addr.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Drone Orders</h2>

            {loadingOrders ? (
              <div style={{ color: 'var(--color-ink-muted)', padding: '2rem 0' }}>Loading order history...</div>
            ) : orders.length === 0 ? (
              <div className="dronesz-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No orders found</h3>
                <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>You haven't placed any orders yet. Explore our store products!</p>
                <button className="btn-dronesz-primary" onClick={() => navigateTo('/store')}>
                  Browse Store
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map((ord) => (
                  <div key={ord.id} className="dronesz-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-line)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-ink-primary)', marginRight: '1rem' }}>Order #{ord.orderNumber}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
                          Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <span className="status-badge AVAILABLE">
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '0.5rem' }}>Delivery Address:</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-primary)' }}>{ord.deliveryAddress}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {ord.items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span>{item.productName} <strong style={{ color: 'var(--color-ink-muted)' }}>× {item.quantity}</strong></span>
                          <span style={{ fontWeight: 600 }}>₹{item.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-line)', paddingTop: '1rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Total Paid Amount</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brand-red)' }}>₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Address Form Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingAddress ? 'Edit Delivery Address' : 'Add New Address'}</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowAddressModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAddress}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input type="text" className="input-field" value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number *</label>
                  <input type="tel" className="input-field" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Address Line 1 *</label>
                <input type="text" className="input-field" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} placeholder="House/Flat No., Street" required />
              </div>

              <div className="input-group">
                <label className="input-label">Address Line 2</label>
                <input type="text" className="input-field" value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} placeholder="Landmark, Area" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="input-group">
                  <label className="input-label">City *</label>
                  <input type="text" className="input-field" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">State *</label>
                  <input type="text" className="input-field" value={addrState} onChange={(e) => setAddrState(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Postal Code *</label>
                  <input type="text" className="input-field" value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn-dronesz-primary" disabled={savingAddr} style={{ marginTop: '0.5rem', width: '100%' }}>
                {savingAddr ? 'Saving Address...' : 'Save Address'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
