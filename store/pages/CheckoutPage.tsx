import React, { useEffect } from 'react';
import { StitchHeader } from '../components/StitchHeader';
import { StitchFooter } from '../components/StitchFooter';

export const CheckoutPage: React.FC = () => {
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  useEffect(() => {
    // Optionally redirect users back to the cart after a brief delay if they landed directly on /checkout
    const timer = setTimeout(() => {
      navigateTo('/cart');
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="blueprint-bg min-h-screen flex flex-col pt-24" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StitchHeader activePage="checkout" />

      <main style={{ flex: 1, maxWidth: '640px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div className="stitch-card" style={{ padding: '3.5rem 2.5rem', borderTop: '4px solid var(--color-primary, #e52b31)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>📩</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.75rem' }}>
            Enquiry-Based Consultation &amp; Quotation
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Dronesz operates on an <strong>enterprise quotation model</strong> rather than direct online checkouts. All orders, technical customizations, and bulk requirements are reviewed directly by our engineering and sales specialists.
          </p>
          <div style={{ background: '#f8fafc', border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))', padding: '1rem', borderRadius: '0.375rem', marginBottom: '2rem', fontSize: '13px', color: 'var(--color-on-surface)' }}>
            To request pricing, specifications, and availability, please submit your items directly from your <strong>Enquiry Cart</strong>.
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-stitch-primary"
              onClick={() => navigateTo('/cart')}
              style={{ padding: '0.85rem 2rem', fontWeight: 700 }}
            >
              Go to Enquiry Cart →
            </button>
            <button
              className="btn-stitch-ghost"
              onClick={() => navigateTo('/store')}
              style={{ padding: '0.85rem 1.5rem' }}
            >
              Browse Catalogue
            </button>
          </div>
        </div>
      </main>

      <StitchFooter />
    </div>
  );
};

export default CheckoutPage;
