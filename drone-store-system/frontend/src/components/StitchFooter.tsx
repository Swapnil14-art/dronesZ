import React from 'react';

export const StitchFooter: React.FC = () => {
  return (
    <footer style={{
      marginTop: 'auto',
      backgroundColor: 'var(--color-surface-container-low)',
      borderTop: '1px solid var(--color-outline)',
      padding: '3rem 2rem'
    }}>
      <div style={{
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            DRONES<span style={{ color: 'var(--color-primary)' }}>Z</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
            © 2024 DronesZ Precision Multirotor Systems. All rights reserved.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
          <span style={{ cursor: 'pointer' }}>Support</span>
          <span style={{ cursor: 'pointer' }}>Documentation</span>
          <span style={{ cursor: 'pointer' }}>Terms of Service</span>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
        </div>
      </div>
    </footer>
  );
};
