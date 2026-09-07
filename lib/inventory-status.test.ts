import { describe, it, expect } from 'vitest';
import { getEffectiveProductStatus, ProductDto } from '../store/services/api';

describe('Inventory & Availability Status Logic', () => {
  it('treats standalone products with 0 quantity as OUT_OF_STOCK even if saved status is AVAILABLE', () => {
    const product: Partial<ProductDto> = {
      productType: 'STANDALONE',
      status: 'AVAILABLE',
      quantity: 0,
    };
    expect(getEffectiveProductStatus(product as ProductDto)).toBe('OUT_OF_STOCK');
  });

  it('treats child variant products with 0 quantity as OUT_OF_STOCK even if saved status is AVAILABLE', () => {
    const product: Partial<ProductDto> = {
      productType: 'CHILD',
      status: 'AVAILABLE',
      quantity: 0,
    };
    expect(getEffectiveProductStatus(product as ProductDto)).toBe('OUT_OF_STOCK');
  });

  it('treats products with negative or null quantity as OUT_OF_STOCK', () => {
    const product1: Partial<ProductDto> = {
      productType: 'CHILD',
      status: 'AVAILABLE',
      quantity: -5,
    };
    expect(getEffectiveProductStatus(product1 as ProductDto)).toBe('OUT_OF_STOCK');

    const product2: Partial<ProductDto> = {
      productType: 'STANDALONE',
      status: 'AVAILABLE',
      quantity: undefined,
    };
    expect(getEffectiveProductStatus(product2 as ProductDto)).toBe('OUT_OF_STOCK');
  });

  it('shows AVAILABLE when stock > 0 and status is AVAILABLE', () => {
    const product: Partial<ProductDto> = {
      productType: 'CHILD',
      status: 'AVAILABLE',
      quantity: 12,
    };
    expect(getEffectiveProductStatus(product as ProductDto)).toBe('AVAILABLE');
  });

  it('preserves COMING_SOON status when status is COMING_SOON', () => {
    const product: Partial<ProductDto> = {
      productType: 'CHILD',
      status: 'COMING_SOON',
      quantity: 10,
    };
    expect(getEffectiveProductStatus(product as ProductDto)).toBe('COMING_SOON');
  });

  it('preserves PARENT series header status without forcing stock calculation', () => {
    const parent: Partial<ProductDto> = {
      productType: 'PARENT',
      status: 'AVAILABLE',
      quantity: 0,
    };
    expect(getEffectiveProductStatus(parent as ProductDto)).toBe('AVAILABLE');
  });
});
