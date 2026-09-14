import React, { useState, useEffect, useCallback } from 'react';
import { ProductImageDto, getProductImageUrl } from '../services/api';

interface ProductGalleryProps {
  productId: number;
  productName: string;
  productType?: string;
  images?: ProductImageDto[];
  primaryImageUrl?: string | null;
  sku?: string;
  drawingId?: string;
  tolerance?: string;
  primaryAxis?: string;
  scale?: string;
}

const DEFAULT_VIEW_NAMES = ['Isometric', 'Stator Detail', 'Base Mount', 'Exploded'];

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  productId,
  productName,
  images = [],
  primaryImageUrl,
  sku,
  drawingId,
  tolerance = 'TOLERANCE ±0.002mm',
  primaryAxis,
  scale = 'Scale: 1:1 Actual Size',
}) => {
  // Determine initial list of images
  const normalizedImages: { id: number | string; url: string; label: string; isPrimary: boolean }[] = React.useMemo(() => {
    if (images && images.length > 0) {
      return images.map((img, idx) => ({
        id: img.id,
        url: getProductImageUrl(img, productId) || '',
        label: DEFAULT_VIEW_NAMES[idx] || `View ${idx + 1}`,
        isPrimary: Boolean(img.isPrimary),
      }));
    }
    if (primaryImageUrl) {
      const url = getProductImageUrl(primaryImageUrl, productId) || '';
      return DEFAULT_VIEW_NAMES.map((name, idx) => ({
        id: `view-${idx}`,
        url,
        label: name,
        isPrimary: idx === 0,
      }));
    }
    // Fallback if no image uploaded but productId is known
    const fallbackUrl = getProductImageUrl(null, productId) || '';
    return DEFAULT_VIEW_NAMES.map((name, idx) => ({
      id: `fallback-${idx}`,
      url: fallbackUrl,
      label: name,
      isPrimary: idx === 0,
    }));
  }, [images, primaryImageUrl, productId]);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Set initial selected index
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

  const activeImage = normalizedImages[selectedIndex] || normalizedImages[0];
  const activeDrawingId = drawingId || (sku ? `DRAWING ID: ${sku}` : `DRAWING ID: DZ-${productId > 0 ? productId : 2207}-V2`);
  const activePrimaryAxis = primaryAxis || 'Primary Axis: 1850KV Unibell';

  return (
    <div style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Main Product Image Card (1:1 Aspect Ratio, Fully Filled) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--color-outline, #e2e8f0)',
          borderRadius: '8px',
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'zoom-in',
          boxSizing: 'border-box',
        }}
        onClick={() => {
          setIsLightboxOpen(true);
          setZoomLevel(1);
        }}
      >
        {/* Zoom / Magnifier Icon Button (Top-Right Overlay) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
            setZoomLevel(1);
          }}
          title="Expand Fullscreen Preview"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            width: '34px',
            height: '34px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0f172a';
            e.currentTarget.style.background = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>

        {activeImage?.url ? (
          <img
            src={activeImage.url}
            alt={`${productName} - ${activeImage.label}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.2s ease-out',
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛸</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>DronesZ High-Precision Specimen</div>
          </div>
        )}
      </div>

      {/* 4-Card Horizontal Thumbnail Showcase Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          width: '100%',
        }}
      >
        {normalizedImages.slice(0, 4).map((img, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={`showcase-thumb-${img.id}-${idx}`}
              onClick={() => setSelectedIndex(idx)}
              style={{
                background: '#ffffff',
                border: isSelected ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 0 1px #dc2626' : 'none',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                }
              }}
            >
              {/* Thumbnail Image Container */}
              <div
                style={{
                  width: '100%',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.label}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>CAD #{idx + 1}</span>
                )}
              </div>

              {/* View Label */}
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? '#0f172a' : '#64748b',
                  marginTop: '5px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {img.label}
              </div>
            </div>
          );
        })}
      </div>

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
                {activeImage.label} (Image {selectedIndex + 1} of {normalizedImages.length})
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
              {activeImage.url && (
                <img
                  src={activeImage.url}
                  alt={`${productName} - ${activeImage.label}`}
                  style={{
                    maxWidth: zoomLevel === 1 ? '90%' : 'none',
                    maxHeight: zoomLevel === 1 ? '80vh' : 'none',
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.25s ease-out',
                    objectFit: 'contain',
                  }}
                />
              )}
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
                    {img.url && (
                      <img
                        src={img.url}
                        alt={img.label}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: '0.35rem',
                        }}
                      />
                    )}
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
