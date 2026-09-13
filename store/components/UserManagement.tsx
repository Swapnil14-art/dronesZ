import React, { useState, useEffect } from 'react';
import {
  UserDto,
  fetchAdminUsers,
  softDeleteUser,
  restoreUser,
  toggleUserEnabled
} from '../services/api';

interface Props {
  token: string;
}

export const UserManagement: React.FC<Props> = ({ token }) => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [includeDeleted, setIncludeDeleted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Deactivate confirmation modal
  const [deactivatingUser, setDeactivatingUser] = useState<UserDto | null>(null);

  useEffect(() => {
    loadUsers();
  }, [token, includeDeleted]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers(token, includeDeleted, searchTerm.trim() || undefined);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleToggleStatus = async (user: UserDto) => {
    setSubmitting(true);
    setError(null);
    try {
      const newStatus = !user.enabled;
      await toggleUserEnabled(token, user.id, newStatus);
      setSuccessMsg(`User "${user.fullName}" is now ${newStatus ? 'enabled' : 'disabled'}.`);
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!deactivatingUser) return;
    setSubmitting(true);
    setError(null);
    try {
      await softDeleteUser(token, deactivatingUser.id);
      setSuccessMsg(`User "${deactivatingUser.fullName}" has been deactivated. Authentication is immediately revoked.`);
      setDeactivatingUser(null);
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreUser = async (user: UserDto) => {
    setSubmitting(true);
    setError(null);
    try {
      await restoreUser(token, user.id);
      setSuccessMsg(`User "${user.fullName}" account restored successfully.`);
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to restore user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            ACCESS &amp; IDENTITY CONTROL
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
            Registered Users &amp; Accounts
          </h1>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div style={{ background: '#e6f4ea', border: '1px solid #a7f3d0', color: 'var(--color-tertiary)', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="stitch-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 320px', maxWidth: '500px' }}>
          <input
            type="text"
            className="stitch-input"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
          <button type="submit" className="btn-stitch-primary" style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>
            Search
          </button>
        </form>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', cursor: 'pointer', userSelect: 'none', color: 'var(--color-on-surface)' }}>
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
          />
          Show Deactivated Users
        </label>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading user accounts...
        </div>
      ) : users.length === 0 ? (
        <div className="stitch-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          No users found matching your search.
        </div>
      ) : (
        <div className="stitch-table-wrapper">
          <table className="stitch-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isDeactivated = Boolean(u.isDeleted);
                const isEnabled = Boolean(u.enabled);

                return (
                  <tr key={u.id} style={{ opacity: isDeactivated ? 0.7 : 1 }}>
                    <td><strong>#{u.id}</strong></td>
                    <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{u.email}</span>
                    </td>
                    <td style={{ color: 'var(--color-muted)' }}>{u.phone || '—'}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: u.role === 'ADMIN' ? '#fef3c7' : '#eff6ff',
                        color: u.role === 'ADMIN' ? '#92400e' : '#1d4ed8',
                        border: u.role === 'ADMIN' ? '1px solid #fcd34d' : '1px solid #bfdbfe',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {isDeactivated ? (
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                          DEACTIVATED
                        </span>
                      ) : isEnabled ? (
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          ACTIVE
                        </span>
                      ) : (
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                          DISABLED
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {isDeactivated ? (
                          <button
                            onClick={() => handleRestoreUser(u)}
                            disabled={submitting}
                            className="btn-stitch-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '12px', background: '#059669', borderColor: '#059669' }}
                          >
                            ↺ Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={submitting}
                              className="btn-stitch-ghost"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '12px' }}
                            >
                              {isEnabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => setDeactivatingUser(u)}
                              disabled={submitting}
                              className="btn-stitch-danger"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '12px' }}
                            >
                              Deactivate
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deactivate User Confirmation Modal */}
      {deactivatingUser && (
        <div className="modal-overlay" onClick={() => setDeactivatingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-error)', margin: '0 0 1rem 0' }}>
              Deactivate User Account
            </h3>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to deactivate <strong>"{deactivatingUser.fullName}"</strong> ({deactivatingUser.email})?
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.85rem', marginBottom: '1.5rem', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              ✓ Authentication sessions will be revoked immediately.<br />
              ✓ Past orders, payment receipts, and delivery addresses are preserved forever.<br />
              ✓ The account can be restored at any time.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button disabled={submitting} onClick={() => setDeactivatingUser(null)} className="btn-stitch-ghost">
                Cancel
              </button>
              <button disabled={submitting} onClick={handleDeactivateUser} className="btn-stitch-danger">
                {submitting ? 'Deactivating...' : 'Deactivate User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
