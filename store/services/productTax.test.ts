import { describe, it, expect } from 'vitest';
import { getProductTaxLabel } from './productTax';

describe('getProductTaxLabel', () => {
  it('returns null when product is null or undefined', () => {
    expect(getProductTaxLabel(null)).toBeNull();
    expect(getProductTaxLabel(undefined)).toBeNull();
  });

  it('returns null when taxInclusive is false, even if taxNote is set', () => {
    expect(getProductTaxLabel({ taxInclusive: false, taxNote: 'Inclusive of Taxes' })).toBeNull();
    expect(getProductTaxLabel({ taxInclusive: false, taxNote: 'Inclusive of GST' })).toBeNull();
    expect(getProductTaxLabel({ taxInclusive: false })).toBeNull();
  });

  it('defaults to "Inclusive of GST" when taxInclusive is true and taxNote is empty or undefined', () => {
    expect(getProductTaxLabel({ taxInclusive: true })).toBe('Inclusive of GST');
    expect(getProductTaxLabel({ taxInclusive: true, taxNote: '' })).toBe('Inclusive of GST');
    expect(getProductTaxLabel({ taxInclusive: true, taxNote: '   ' })).toBe('Inclusive of GST');
    expect(getProductTaxLabel({ taxInclusive: true, taxNote: null })).toBe('Inclusive of GST');
  });

  it('defaults to "Inclusive of GST" when taxInclusive is undefined (defaults to true)', () => {
    expect(getProductTaxLabel({})).toBe('Inclusive of GST');
    expect(getProductTaxLabel({ taxNote: '' })).toBe('Inclusive of GST');
  });

  it('returns custom label when configured (e.g. "Inclusive of Taxes")', () => {
    expect(getProductTaxLabel({ taxInclusive: true, taxNote: 'Inclusive of Taxes' })).toBe('Inclusive of Taxes');
    expect(getProductTaxLabel({ taxInclusive: true, taxNote: '  Inclusive of Taxes  ' })).toBe('Inclusive of Taxes');
    expect(getProductTaxLabel({ taxInclusive: true, taxNote: 'GST & All Import Duties Included' })).toBe('GST & All Import Duties Included');
  });

  it('converts legacy backend default "GST & Taxes Included" to requested default "Inclusive of GST"', () => {
    expect(getProductTaxLabel({ taxInclusive: true, taxNote: 'GST & Taxes Included' })).toBe('Inclusive of GST');
  });

  it('returns "Inclusive of GST" if explicitly set as taxNote', () => {
    expect(getProductTaxLabel({ taxInclusive: true, taxNote: 'Inclusive of GST' })).toBe('Inclusive of GST');
  });
});
