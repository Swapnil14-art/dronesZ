"use client";

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
import { StitchHeader } from '../components/StitchHeader';
import { StitchFooter } from '../components/StitchFooter';

interface UserDashboardProps {
  initialTab?: 'profile' | 'addresses' | 'orders';
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ initialTab = 'profile' }) => {
  const { user, token, isAuthenticated } = useUserAuth();
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
      <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StitchHeader activePage="dashboard" />
        <main style={{ flex: 1, maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
          <div className="stitch-card" style={{ padding: '3.5rem 2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-on-surface)' }}>
              Sign in to view your Dashboard
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
              Access your personal account profile, saved shipping addresses, and order history.
            </p>
          </div>
        </main>
        <StitchFooter />
      </div>
    );
  }

  return (
    <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StitchHeader activePage="dashboard" />

      <main style={{ flex: 1, maxWidth: 'var(--max-width)', width: '100%', margin: '0 auto', padding: '3rem 2rem 5rem 2rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            CUSTOMER ACCOUNT PORTAL
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
            Welcome back, {user?.fullName}
          </h1>
          <p style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
            Manage profile settings, saved shipping addresses, and order history.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem', borderRadius: '0.375rem', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-outline)', marginBottom: '2.5rem' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            👤 Personal Profile
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'addresses' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'addresses' ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            📍 Delivery Addresses
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'orders' ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            📦 Order History
          </button>
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <div className="stitch-card" style={{ maxWidth: '600px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-on-surface)' }}>
              Profile Account Settings
            </h2>

            {profileMsg && (
              <div style={{ background: '#e6f4ea', border: '1px solid #a7f3d0', color: 'var(--color-tertiary)', padding: '0.85rem', borderRadius: '0.375rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="stitch-form-group">
                <label className="stitch-label">Full Name</label>
                <input
                  type="text"
                  className="stitch-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="stitch-form-group">
                <label className="stitch-label">Email Address (Primary Login)</label>
                <input
                  type="email"
                  className="stitch-input"
                  value={user?.email || ''}
                  disabled
                  style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-muted)' }}
                />
              </div>

              <div className="stitch-form-group">
                <label className="stitch-label">Phone Number</label>
                <input
                  type="tel"
                  className="stitch-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-stitch-primary"
                disabled={updatingProfile}
                style={{ padding: '0.75rem 1.5rem', marginTop: '0.5rem', alignSelf: 'flex-start' }}
              >
                {updatingProfile ? 'Saving Changes...' : 'Update Account Profile'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                Saved Shipping &amp; Billing Addresses
              </h2>
              <button className="btn-stitch-primary" onClick={() => openAddressModal()}>
                + Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="stitch-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No addresses saved</h3>
                <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>Add a delivery address for faster multirotor checkout.</p>
                <button className="btn-stitch-primary" onClick={() => openAddressModal()}>
                  Add Shipping Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {addresses.map((addr) => (
                  <div key={addr.id} className="stitch-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-on-surface)' }}>{addr.fullName}</div>
                        {addr.isDefault && <span className="badge-tertiary">DEFAULT</span>}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>
                        📞 {addr.phone}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-on-surface)', lineHeight: 1.5 }}>
                        {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-outline)' }}>
                      {!addr.isDefault && (
                        <button className="btn-stitch-ghost" style={{ fontSize: '12px' }} onClick={() => handleSetDefaultAddress(addr.id)}>
                          Set Default
                        </button>
                      )}
                      <button className="btn-stitch-ghost" style={{ fontSize: '12px' }} onClick={() => openAddressModal(addr)}>
                        Edit
                      </button>
                      <button className="btn-stitch-danger" style={{ fontSize: '12px' }} onClick={() => handleDeleteAddress(addr.id)}>
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-on-surface)' }}>
              Component Order History
            </h2>

            {loadingOrders ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>Loading order history...</div>
            ) : orders.length === 0 ? (
              <div className="stitch-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📦</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No orders placed yet</h3>
                <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>Your order history will appear here once you place an order.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map((order) => (
                  <div key={order.id} className="stitch-card" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-outline)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-on-surface)' }}>
                          Order #{order.orderNumber}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                          Placed on: {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className={order.status === 'DELIVERED' ? 'badge-tertiary' : order.status === 'CANCELLED' ? 'badge-error' : 'badge-amber'}>
                          {order.status}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {order.items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{item.productName}</span>
                            <span style={{ color: 'var(--color-muted)', marginLeft: '0.5rem' }}>× {item.quantity}</span>
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>₹{item.price.toLocaleString('en-IN')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Address Edit/Add Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-on-surface)' }}>
              {editingAddress ? 'Edit Shipping Address' : 'Add New Shipping Address'}
            </h3>
            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="stitch-form-group">
                  <label className="stitch-label">Full Name *</label>
                  <input type="text" className="stitch-input" value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)} required />
                </div>
                <div className="stitch-form-group">
                  <label className="stitch-label">Phone *</label>
                  <input type="tel" className="stitch-input" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} required />
                </div>
              </div>

              <div className="stitch-form-group">
                <label className="stitch-label">Address Line 1 *</label>
                <input type="text" className="stitch-input" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} required />
              </div>

              <div className="stitch-form-group">
                <label className="stitch-label">Address Line 2</label>
                <input type="text" className="stitch-input" value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="stitch-form-group">
                  <label className="stitch-label">City *</label>
                  <input type="text" className="stitch-input" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
                </div>
                <div className="stitch-form-group">
                  <label className="stitch-label">State *</label>
                  <input type="text" className="stitch-input" value={addrState} onChange={(e) => setAddrState(e.target.value)} required />
                </div>
                <div className="stitch-form-group">
                  <label className="stitch-label">Postal Code *</label>
                  <input type="text" className="stitch-input" value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-stitch-ghost" onClick={() => setShowAddressModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-stitch-primary" disabled={savingAddr}>
                  {savingAddr ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StitchFooter />
    </div>
  );
};
