"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
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
    <div
      className="blueprint-bg"
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 42px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
      }}
    >
      <div
        className="stitch-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
          borderTop: '4px solid var(--color-primary)',
        }}
      >
        {/* Header & Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="badge-parent" style={{ marginBottom: '0.75rem', background: '#fee2e2', color: 'var(--color-primary)' }}>
            SECURE ADMIN GATEWAY
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
            DRONES<span style={{ color: 'var(--color-primary)' }}>Z</span> PORTAL
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginTop: '0.3rem' }}>
            Sign in with administrative authorization credentials
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1.5rem', fontSize: '13px' }}>
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="stitch-form-group">
            <label className="stitch-label" htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              className="stitch-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your admin email"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="stitch-form-group">
            <label className="stitch-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="stitch-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your admin password"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-stitch-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating Gateway...' : 'Sign In to Admin Portal'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--color-outline)',
          fontSize: '11px',
          color: 'var(--color-muted)',
          textAlign: 'center'
        }}>
          Protected Endpoint — Restricted to <span className="badge-parent" style={{ fontSize: '10px' }}>ADMIN</span> authority
        </div>
      </div>
    </div>
  );
};
