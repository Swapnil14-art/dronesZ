export interface ProductTaxConfig {
  taxInclusive?: boolean | null;
  taxNote?: string | null;
}

/**
 * Computes the subtle tax label to display beneath product prices based on admin settings:
 * - If taxes are included in price and a custom label is configured, displays that label (e.g. "Inclusive of Taxes").
 * - If taxes are included in price and no custom label is configured, defaults to "Inclusive of GST".
 * - If taxes are not included in price (taxInclusive === false), returns null (no label displayed).
 *
 * Handles legacy unconfigured fallback ("GST & Taxes Included") as well as empty/whitespace values.
 */
export function getProductTaxLabel(product?: ProductTaxConfig | null): string | null {
  if (!product) {
    return null;
  }

  // If taxes are explicitly excluded from the price, do not show any label
  if (product.taxInclusive === false) {
    return null;
  }

  const customLabel = product.taxNote?.trim();

  // If a custom label is configured (and not the legacy default marker), display it
  if (
    customLabel &&
    customLabel !== 'GST & Taxes Included' &&
    customLabel !== 'Inclusive of GST'
  ) {
    return customLabel;
  }

  // Default when taxes are included and no custom label is configured
  return 'Inclusive of GST';
}

export default getProductTaxLabel;
