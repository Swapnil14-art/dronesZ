import React, { useState, useEffect } from 'react';
import {
  CustomNavConfig,
  loadCustomNavConfig,
  saveCustomNavConfig,
  getDefaultCustomNavConfig,
} from '../services/customNavConfig';

interface Props {
  token: string;
}

const FieldLabel: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <label
    style={{
      display: 'block',
      fontSize: '12px',
      fontWeight: 700,
      color: '#0f172a',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: '0.35rem',
    }}
  >
    {text} {required && <span style={{ color: '#dc2626' }}>*</span>}
  </label>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  border: '1px solid #cbd5e1',
  borderRadius: '0.375rem',
  fontSize: '14px',
  color: '#0f172a',
  background: '#ffffff',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s ease',
};

export const CustomNavManagement: React.FC<Props> = ({ token: _token }) => {
  const [config, setConfig] = useState<CustomNavConfig>(getDefaultCustomNavConfig());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setConfig(loadCustomNavConfig());
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const trimmedMotors = config.motorsTalkToUsUrl.trim();
    const trimmedProps = config.propellersTalkToUsUrl.trim();

    if (!trimmedMotors) {
      setErrorMsg('Motors Talk to us URL cannot be empty.');
      return;
    }
    if (!trimmedProps) {
      setErrorMsg('Propellers Talk to us URL cannot be empty.');
      return;
    }

    const updatedConfig: CustomNavConfig = {
      motorsTalkToUsUrl: trimmedMotors,
      propellersTalkToUsUrl: trimmedProps,
    };

    saveCustomNavConfig(updatedConfig);
    setConfig(updatedConfig);
    setSuccessMsg('Custom navigation Talk to us URLs saved successfully! Changes are live immediately.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset Motors and Propellers Talk to us URLs to defaults (/contact)?')) {
      const defaults = getDefaultCustomNavConfig();
      saveCustomNavConfig(defaults);
      setConfig(defaults);
      setSuccessMsg('URLs reset to defaults.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--color-primary, #dc2626)',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            NAVIGATION SETTINGS
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--color-on-surface, #0f172a)',
              letterSpacing: '-0.02em',
            }}
          >
            Custom Dropdown &amp; Talk to Us Links
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '0.25rem' }}>
            Configure the destinations for the &quot;Talk to us&quot; buttons displayed under the public header&apos;s <strong>Custom</strong> dropdown.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="btn-stitch-ghost"
            style={{ fontSize: '12px', padding: '0.55rem 1.25rem' }}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-stitch-primary"
            style={{ fontSize: '12px', padding: '0.55rem 1.75rem' }}
          >
            Save URLs
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#065f46',
            padding: '0.85rem 1.25rem',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #f87171',
            color: '#991b1b',
            padding: '0.85rem 1.25rem',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preview Card */}
      <div
        style={{
          background: '#14171d',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.5rem',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          color: '#f8fafc',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          LIVE PREVIEW · Custom Dropdown Navigation Behavior
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '280px', background: '#0d0f12', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', color: '#f8fafc', fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
            <span>Frames</span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>→ #custom-airframes</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', color: '#94a3b8', fontSize: '13px' }}>
            <span style={{ fontWeight: 500, color: '#e2e8f0' }}>Motors</span>
            <span style={{ fontSize: '13px', color: '#e52b31', fontWeight: 600 }}>
              Talk to us →
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', color: '#94a3b8', fontSize: '13px' }}>
            <span style={{ fontWeight: 500, color: '#e2e8f0' }}>Propellers</span>
            <span style={{ fontSize: '13px', color: '#e52b31', fontWeight: 600 }}>
              Talk to us →
            </span>
          </div>
        </div>
      </div>

      {/* Form Settings Card */}
      <form onSubmit={handleSave}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-outline, #e2e8f0)',
            borderRadius: '0.5rem',
            padding: '1.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
          }}
        >
          {/* Motors URL Field */}
          <div>
            <FieldLabel text="Motors — Talk to us Destination URL" required />
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
              Target route or external URL opened when a visitor clicks &quot;Talk to us&quot; next to Motors.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                style={inputStyle}
                value={config.motorsTalkToUsUrl}
                onChange={(e) => setConfig({ ...config, motorsTalkToUsUrl: e.target.value })}
                placeholder="/contact or https://..."
              />
              {config.motorsTalkToUsUrl && (
                <a
                  href={config.motorsTalkToUsUrl}
                  target={config.motorsTalkToUsUrl.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  style={{
                    padding: '0.65rem 1rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.375rem',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Test Link ↗
                </a>
              )}
            </div>
          </div>

          <div style={{ height: '1px', background: '#f1f5f9' }} />

          {/* Propellers URL Field */}
          <div>
            <FieldLabel text="Propellers — Talk to us Destination URL" required />
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
              Target route or external URL opened when a visitor clicks &quot;Talk to us&quot; next to Propellers.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                style={inputStyle}
                value={config.propellersTalkToUsUrl}
                onChange={(e) => setConfig({ ...config, propellersTalkToUsUrl: e.target.value })}
                placeholder="/contact or https://..."
              />
              {config.propellersTalkToUsUrl && (
                <a
                  href={config.propellersTalkToUsUrl}
                  target={config.propellersTalkToUsUrl.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  style={{
                    padding: '0.65rem 1rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.375rem',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Test Link ↗
                </a>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              className="btn-stitch-primary"
              style={{ fontSize: '13px', padding: '0.7rem 2.25rem' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
