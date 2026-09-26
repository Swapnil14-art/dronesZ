import { describe, it, expect } from 'vitest';
import {
  calculateTargetDimensions,
  formatFileSize,
} from './imageOptimizer';

describe('imageOptimizer', () => {
  describe('calculateTargetDimensions', () => {
    it('scales down landscape 4K/12MP image to max 1920px preserving aspect ratio', () => {
      // 4032 x 3024 (4:3 ratio common on iPhone / Android)
      const result = calculateTargetDimensions(4032, 3024, 1920);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1440);
      expect(result.isResized).toBe(true);
    });

    it('scales down portrait high-res image ensuring height does not exceed 1920px', () => {
      // 3024 x 4032 portrait
      const result = calculateTargetDimensions(3024, 4032, 1920);
      expect(result.width).toBe(1440);
      expect(result.height).toBe(1920);
      expect(result.isResized).toBe(true);
    });

    it('scales down massive 48MP camera image (8000 x 6000)', () => {
      const result = calculateTargetDimensions(8000, 6000, 1920);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1440);
      expect(result.isResized).toBe(true);
    });

    it('scales down large square image (3000 x 3000) to 1920 x 1920', () => {
      const result = calculateTargetDimensions(3000, 3000, 1920);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1920);
      expect(result.isResized).toBe(true);
    });

    it('never upscales images that are already smaller than 1920px', () => {
      const result = calculateTargetDimensions(800, 600, 1920);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.isResized).toBe(false);
    });

    it('leaves exact 1920px dimension untouched', () => {
      const result = calculateTargetDimensions(1920, 1080, 1920);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.isResized).toBe(false);
    });

    it('handles edge cases with zero or negative dimensions safely', () => {
      const result = calculateTargetDimensions(0, 0, 1920);
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
      expect(result.isResized).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes into KB for files under 1 MB', () => {
      expect(formatFileSize(204800)).toBe('200.0 KB');
      expect(formatFileSize(1024)).toBe('1.0 KB');
    });

    it('formats bytes into MB for files 1 MB or greater', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(5242880)).toBe('5.00 MB');
      expect(formatFileSize(7340032)).toBe('7.00 MB');
    });
  });
});
