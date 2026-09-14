import { describe, it, expect } from 'vitest';
import {
  getProductImageSrc,
  getProductImageUrl,
  sanitizeImageFileName,
  KNOWN_PRODUCT_IMAGE_MAP,
} from './api';

describe('Product Image Resolution (Static Repository Workaround)', () => {
  describe('sanitizeImageFileName', () => {
    it('extracts clean basename and removes directory traversal', () => {
      expect(sanitizeImageFileName('8017.png')).toBe('8017.png');
      expect(sanitizeImageFileName('../../../8017.png')).toBe('8017.png');
      expect(sanitizeImageFileName('/var/tmp/upload/7005.png')).toBe('7005.png');
      expect(sanitizeImageFileName('subfolder\\3115.png')).toBe('3115.png');
    });

    it('strips query parameters and hashes', () => {
      expect(sanitizeImageFileName('8017.png?v=1788887304#preview')).toBe('8017.png');
    });

    it('preserves blob and data URLs for local upload previews', () => {
      expect(sanitizeImageFileName('blob:http://localhost:3000/abc-123')).toBe('blob:http://localhost:3000/abc-123');
      expect(sanitizeImageFileName('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    });

    it('returns null for empty or invalid inputs', () => {
      expect(sanitizeImageFileName('')).toBeNull();
      expect(sanitizeImageFileName(null)).toBeNull();
      expect(sanitizeImageFileName('   ')).toBeNull();
      expect(sanitizeImageFileName('..')).toBeNull();
      expect(sanitizeImageFileName('.')).toBeNull();
    });
  });

  describe('getProductImageSrc & getProductImageUrl', () => {
    it('resolves direct file names to /product-images/[file_name]', () => {
      expect(getProductImageSrc('8017.png')).toBe('/product-images/8017.png');
      expect(getProductImageSrc('7005.png')).toBe('/product-images/7005.png');
      expect(getProductImageSrc('3115.png')).toBe('/product-images/3115.png');
      expect(getProductImageSrc('3110.png')).toBe('/product-images/3110.png');
      expect(getProductImageSrc('2807.png')).toBe('/product-images/2807.png');
    });

    it('resolves known product IDs when passed as fallback ID', () => {
      expect(getProductImageSrc(null, 26)).toBe('/product-images/8017.png');
      expect(getProductImageSrc(null, 27)).toBe('/product-images/7005.png');
      expect(getProductImageSrc(null, 28)).toBe('/product-images/3115.png');
      expect(getProductImageSrc(null, 30)).toBe('/product-images/3110.png');
      expect(getProductImageSrc(null, 31)).toBe('/product-images/2807.png');
    });

    it('resolves ProductDto and ProductImageDto objects with fileName', () => {
      expect(getProductImageSrc({ id: 1, productId: 26, fileName: '8017.png', url: '', isPrimary: true, displayOrder: 0 })).toBe('/product-images/8017.png');
      expect(getProductImageSrc({ id: 26, name: '8017 — 120 KV', price: 500, quantity: 10, status: 'AVAILABLE', productType: 'STANDALONE', primaryImage: { id: 1, productId: 26, fileName: '8017.png', url: '', isPrimary: true, displayOrder: 0 } })).toBe('/product-images/8017.png');
    });

    it('resolves ProductDto object via ID if fileName is missing', () => {
      expect(getProductImageSrc({ id: 26, name: '8017 — 120 KV', price: 500, quantity: 10, status: 'AVAILABLE', productType: 'STANDALONE' })).toBe('/product-images/8017.png');
      expect(getProductImageSrc({ id: 27, name: '7005 — 140 KV', price: 600, quantity: 5, status: 'AVAILABLE', productType: 'STANDALONE' })).toBe('/product-images/7005.png');
    });

    it('intercepts legacy /api/products/[id]/images/[imgId] URLs and maps to static image', () => {
      expect(getProductImageSrc('/api/products/26/images/23?v=1788887304')).toBe('/product-images/8017.png');
      expect(getProductImageSrc('/api/products/27/images/24?v=1788887304')).toBe('/product-images/7005.png');
      expect(getProductImageSrc('/api/products/28/images/25?v=1788887304')).toBe('/product-images/3115.png');
      expect(getProductImageSrc('/api/products/30/images/26?v=1788887304')).toBe('/product-images/3110.png');
      expect(getProductImageSrc('/api/products/31/images/27?v=1788887304')).toBe('/product-images/2807.png');
    });

    it('aliases getProductImageUrl to getProductImageSrc', () => {
      expect(getProductImageUrl('8017.png')).toBe('/product-images/8017.png');
      expect(getProductImageUrl(null, 26)).toBe('/product-images/8017.png');
    });
  });
});
