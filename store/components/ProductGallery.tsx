import React, { useState, useEffect, useCallback } from 'react';
import { ProductImageDto, getProductImageUrl } from '../services/api';

interface ProductGalleryProps {
  productId: number;
  productName: string;
  productType?: string;
  images?: ProductImageDto[];
  primaryImageUrl?: string | null;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  productId,
  productName,
  productType,
  images = [],
  primaryImageUrl,
}) => {
  // Determine initial list of images
  const normalizedImages: { id: number | string; url: string; isPrimary: boolean }[] = React.useMemo(() => {
    if (images && images.length > 0) {
      return images.map((img) => ({
        id: img.id,
        url: getProductImageUrl(img.url) || img.url,
        isPrimary: Boolean(img.isPrimary),
      }));
    }
    if (primaryImageUrl) {
      return [{ id: 'primary', url: getProductImageUrl(primaryImageUrl) || primaryImageUrl, isPrimary: true }];
    }
    return [];
  }, [images, primaryImageUrl]);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Set initial selected index to the primary image if exists
  useEffect(() => {
    if (normalizedImages.length > 0) {
      const primaryIdx = normalizedImages.findIndex((img) => img.isPrimary);
      setSelectedIndex(primaryIdx >= 0 ? primaryIdx : 0);
    } else {
      setSelectedIndex(0);
    }
  }, [normalizedImages]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : normalizedImages.length - 1));
  }, [normalizedImages.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev < normalizedImages.length - 1 ? prev + 1 : 0));
  }, [normalizedImages.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  const activeImage = normalizedImages[selectedIndex];

  if (normalizedImages.length === 0) {
    return (
      <div
        className="image-void-stage"
        style={{
          borderRadius: '0.75rem',
          minHeight: '420px',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid var(--color-outline, #e2e8f0)',
          width: '100%',
          boxSizing: 'border-box',
          height: '500px',
          background: 'var(--color-surface-container-low, #f8fafc)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem', opacity: 0.8 }}>🛸</div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--color-primary, #dc2626)',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            DRONESZ SPECIMEN CAD MODEL
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Hardware ID #{productId.toString().padStart(4, '0')}
          </div>
        </div>

        {productType && (
          <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
            <span className="badge-category" style={{ letterSpacing: '0.08em', padding: '0.35rem 0.75rem' }}>
              {productType.replace('_', ' ')}
            </span>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#94a3b8',
            letterSpacing: '0.05em',
          }}
        >
          REF #{productId}
        </div>
      </div>
    );
  }

  return (
    <div className="amazon-product-gallery" style={{ width: '100%', minWidth: 0 }}>
      {/* Desktop & Mobile Main Gallery Layout */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          alignItems: 'flex-start',
          width: '100%',
        }}
        className="gallery-desktop-container"
      >
        {/* Desktop Vertical Thumbnails List */}
        {normalizedImages.length > 1 && (
          <div
            className="gallery-vertical-thumbnails"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              maxHeight: '500px',
              overflowY: 'auto',
              paddingRight: '4px',
              scrollbarWidth: 'thin',
              flexShrink: 0,
            }}
          >
            {normalizedImages.map((img, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`thumb-${img.id}-${idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '0.5rem',
                    border: isSelected
                      ? '2.5px solid var(--color-primary, #dc2626)'
                      : '1.5px solid var(--color-outline, rgba(15, 23, 42, 0.12))',
                    padding: '2px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={img.url}
                    alt={`${productName} thumbnail ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '0.35rem',
                    }}
                  />
                  {img.isPrimary && (
                    <div
                      title="Primary Image"
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--color-primary, #dc2626)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Large Main Product Image Stage */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.1))',
            borderRadius: '0.75rem',
            height: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'zoom-in',
            userSelect: 'none',
          }}
          onClick={() => {
            setIsLightboxOpen(true);
            setZoomLevel(1);
          }}
        >
          <img
            src={activeImage.url}
            alt={`${productName} view ${selectedIndex + 1}`}
            style={{
              maxWidth: '92%',
              maxHeight: '92%',
              objectFit: 'contain',
              transition: 'transform 0.2s ease-out',
            }}
          />

          {/* Badges */}
          {productType && (
            <div style={{ position: 'absolute', top: '16px', left: '16px', pointerEvents: 'none' }}>
              <span className="badge-category" style={{ letterSpacing: '0.08em', padding: '0.35rem 0.75rem' }}>
                {productType.replace('_', ' ')}
              </span>
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                background: 'rgba(255, 255, 255, 0.85)',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.35rem',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {selectedIndex + 1} / {normalizedImages.length}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
              REF #{productId}
            </span>
          </div>

          {/* Previous / Next Arrows on Main Image */}
          {normalizedImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                aria-label="Previous Image"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.15))',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-on-surface, #0f172a)',
                  transition: 'all 0.15s ease',
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = 'var(--color-primary, #dc2626)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.color = 'var(--color-on-surface, #0f172a)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <button
                onClick={handleNext}
                aria-label="Next Image"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.15))',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-on-surface, #0f172a)',
                  transition: 'all 0.15s ease',
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = 'var(--color-primary, #dc2626)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.color = 'var(--color-on-surface, #0f172a)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </>
          )}

          {/* Click to Enlarge Hint */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.88)',
              padding: '0.25rem 0.6rem',
              borderRadius: '0.35rem',
              border: '1px solid rgba(15, 23, 42, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            Click to expand
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Thumbnail Strip (Shown on smaller screens) */}
      {normalizedImages.length > 1 && (
        <div
          className="gallery-mobile-thumbnails"
          style={{
            display: 'none',
            flexDirection: 'row',
            gap: '0.65rem',
            overflowX: 'auto',
            paddingTop: '0.85rem',
            paddingBottom: '0.25rem',
            scrollbarWidth: 'none',
          }}
        >
          {normalizedImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={`mobile-thumb-${img.id}-${idx}`}
                onClick={() => setSelectedIndex(idx)}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '0.5rem',
                  border: isSelected
                    ? '2.5px solid var(--color-primary, #dc2626)'
                    : '1.5px solid var(--color-outline, rgba(15, 23, 42, 0.12))',
                  padding: '2px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : 'none',
                }}
              >
                <img
                  src={img.url}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '0.35rem',
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Responsive Styles via Inline CSS */}
      <style>{`
        @media (max-width: 768px) {
          .gallery-vertical-thumbnails {
            display: none !important;
          }
          .gallery-mobile-thumbnails {
            display: flex !important;
          }
        }
      `}</style>

      {/* Fullscreen Lightbox / Zoom Modal */}
      {isLightboxOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(10, 15, 25, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem',
            boxSizing: 'border-box',
          }}
          onClick={() => {
            setIsLightboxOpen(false);
            setZoomLevel(1);
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              width: '100%',
              maxWidth: '1200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              paddingBottom: '0.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                {productName}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Image {selectedIndex + 1} of {normalizedImages.length}
              </div>
            </div>

            {/* Controls: Zoom & Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setZoomLevel((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1))}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                {zoomLevel}x Zoom
              </button>

              <button
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
                aria-label="Close Lightbox"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.8)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Lightbox Stage */}
          <div
            style={{
              flex: 1,
              width: '100%',
              maxWidth: '1200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Arrow */}
            {normalizedImages.length > 1 && (
              <button
                onClick={handlePrev}
                aria-label="Previous Lightbox Image"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  zIndex: 10,
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary, #dc2626)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            )}

            {/* Centered Image with Zoom */}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: zoomLevel > 1 ? 'grab' : 'zoom-in',
                overflow: 'auto',
              }}
              onClick={() => setZoomLevel((prev) => (prev === 1 ? 2 : 1))}
            >
              <img
                src={activeImage.url}
                alt={`${productName} view ${selectedIndex + 1}`}
                style={{
                  maxWidth: zoomLevel === 1 ? '90%' : 'none',
                  maxHeight: zoomLevel === 1 ? '80vh' : 'none',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.25s ease-out',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Next Arrow */}
            {normalizedImages.length > 1 && (
              <button
                onClick={handleNext}
                aria-label="Next Lightbox Image"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  zIndex: 10,
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary, #dc2626)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {normalizedImages.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '0.65rem',
                paddingTop: '0.75rem',
                overflowX: 'auto',
                maxWidth: '100%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {normalizedImages.map((img, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`lb-thumb-${img.id}-${idx}`}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setZoomLevel(1);
                    }}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '0.5rem',
                      border: isSelected
                        ? '2.5px solid var(--color-primary, #dc2626)'
                        : '1.5px solid rgba(255, 255, 255, 0.25)',
                      padding: '2px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isSelected ? 1 : 0.65,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '0.35rem',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
