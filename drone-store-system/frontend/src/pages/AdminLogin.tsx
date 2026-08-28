import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('AdminPassword123!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      background: 'var(--color-canvas)'
    }}>
      <div className="dronesz-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.75rem 2.25rem'
      }}>
        {/* DronesZ Header & Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div className="dronesz-badge" style={{ marginBottom: '1rem' }}>
            System Administration
          </div>
          <h1 className="brand-wordmark" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
            Drones<span className="accent">Z</span> Portal
          </h1>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            Sign in with administrative credentials
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn-dronesz-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Admin Portal'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--color-line)',
          fontSize: '0.8rem',
          color: 'var(--color-ink-faint)',
          textAlign: 'center'
        }}>
          Protected Endpoint — Restricted to <span className="dronesz-badge" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>ADMIN</span> authority
        </div>
      </div>
    </div>
  );
};
