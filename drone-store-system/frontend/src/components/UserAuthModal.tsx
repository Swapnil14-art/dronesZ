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
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
              DRONESZ CUSTOMER AUTHENTICATION
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-on-surface)', marginTop: '0.2rem' }}>
              {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-muted)' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1.25rem', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline)', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'login' ? '3px solid var(--color-primary)' : 'none',
              color: mode === 'login' ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: mode === 'login' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'signup' ? '3px solid var(--color-primary)' : 'none',
              color: mode === 'signup' ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: mode === 'signup' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Create Account
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="stitch-form-group">
              <label className="stitch-label">Email Address</label>
              <input
                type="email"
                className="stitch-input"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="stitch-form-group">
              <label className="stitch-label">Password</label>
              <input
                type="password"
                className="stitch-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-stitch-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="stitch-form-group">
              <label className="stitch-label">Full Name</label>
              <input
                type="text"
                className="stitch-input"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="stitch-form-group">
              <label className="stitch-label">Email Address</label>
              <input
                type="email"
                className="stitch-input"
                placeholder="name@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>

            <div className="stitch-form-group">
              <label className="stitch-label">Phone Number</label>
              <input
                type="tel"
                className="stitch-input"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="stitch-form-group">
              <label className="stitch-label">Password</label>
              <input
                type="password"
                className="stitch-input"
                placeholder="At least 6 characters"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />
            </div>

            <div className="stitch-form-group">
              <label className="stitch-label">Confirm Password</label>
              <input
                type="password"
                className="stitch-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-stitch-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {loading ? 'Registering Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
