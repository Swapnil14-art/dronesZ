import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { login, signup } = useUserAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      setLoading(true);
      await login(loginEmail.trim(), loginPassword);
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('Please enter a valid phone number (at least 7 digits).');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await signup({
        fullName: fullName.trim(),
        email: signupEmail.trim(),
        phone: phone.trim(),
        password: signupPassword,
      });
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2rem 2.25rem',
          borderRadius: '0.75rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ width: '16px', height: '2px', backgroundColor: 'var(--color-primary, #e52b31)', display: 'inline-block' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-primary, #e52b31)', textTransform: 'uppercase' }}>
                CUSTOMER PORTAL
              </span>
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-on-surface, #0f172a)', margin: 0, letterSpacing: '-0.02em' }}>
              {mode === 'login' ? 'Customer Sign In' : 'Create Account'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#f8fafc',
              border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-muted, #64748b)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = 'var(--color-muted, #64748b)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-outline, rgba(15, 23, 42, 0.1))',
            marginBottom: '1.5rem',
            gap: '1rem',
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.65rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'login' ? '2.5px solid var(--color-primary, #e52b31)' : '2.5px solid transparent',
              color: mode === 'login' ? 'var(--color-primary, #e52b31)' : 'var(--color-muted, #64748b)',
              fontWeight: mode === 'login' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.65rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'signup' ? '2.5px solid var(--color-primary, #e52b31)' : '2.5px solid transparent',
              color: mode === 'signup' ? 'var(--color-primary, #e52b31)' : 'var(--color-muted, #64748b)',
              fontWeight: mode === 'signup' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              marginBottom: '1.25rem',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              lineHeight: 1.4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="stitch-form-group" style={{ margin: 0 }}>
              <label className="stitch-label">Email Address</label>
              <input
                type="email"
                className="stitch-input"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="stitch-form-group" style={{ margin: 0 }}>
              <label className="stitch-label">Password</label>
              <input
                type="password"
                className="stitch-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-stitch-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '13px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '13px', color: 'var(--color-muted, #64748b)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary, #e52b31)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Create Account
              </button>
            </div>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="stitch-form-group" style={{ margin: 0 }}>
              <label className="stitch-label">Full Name *</label>
              <input
                type="text"
                className="stitch-input"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="stitch-form-group" style={{ margin: 0 }}>
              <label className="stitch-label">Email Address *</label>
              <input
                type="email"
                className="stitch-input"
                placeholder="name@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="stitch-form-group" style={{ margin: 0 }}>
              <label className="stitch-label">Phone Number *</label>
              <input
                type="tel"
                className="stitch-input"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="stitch-form-group" style={{ margin: 0 }}>
                <label className="stitch-label">Password *</label>
                <input
                  type="password"
                  className="stitch-input"
                  placeholder="Min 6 chars"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="stitch-form-group" style={{ margin: 0 }}>
                <label className="stitch-label">Confirm *</label>
                <input
                  type="password"
                  className="stitch-input"
                  placeholder="Re-enter"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-stitch-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '13px' }}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '13px', color: 'var(--color-muted, #64748b)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary, #e52b31)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserAuthModal;
