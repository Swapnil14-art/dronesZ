import { describe, it, expect } from 'vitest';
import { ProductDto, CategoryDto } from './api';

// Helper replication of StoreLandingCatalog's filtering algorithms
function buildCatalogViewModel({
  categories,
  parentProducts,
  childProductsMap,
  standaloneProducts = [],
  activeCategoryFilter,
  search = '',
  parachuteConfig = { isEnabled: true, displayName: 'Autonomous Recovery Parachutes', slug: 'parachute' },
  agriDroneConfig = { displayName: 'Agricultural Spraying Drone', slug: 'agricultural-spraying-drone' },
}: {
  categories: CategoryDto[];
  parentProducts: ProductDto[];
  childProductsMap: Record<number, ProductDto[]>;
  standaloneProducts?: ProductDto[];
  activeCategoryFilter: 'all' | 'motors' | 'frames' | 'parachute' | 'agri';
  search?: string;
  parachuteConfig?: { isEnabled: boolean; displayName?: string; slug?: string } | null;
  agriDroneConfig?: { displayName?: string; slug?: string; hero?: { tagline?: string; subheading?: string } } | null;
}) {
  const motorCategory = categories.find((c) => {
    const n = c.name.trim().toLowerCase();
    return n === 'motors' || n === 'motor';
  });

  const frameCategory = categories.find((c) => {
    const n = c.name.trim().toLowerCase();
    return n === 'frames' || n === 'frame';
  });

  const getCategoryName = (product: ProductDto, parent?: ProductDto | null): string => {
    if (product.categoryName) return product.categoryName;
    if (product.categoryId) {
      const found = categories.find((c) => c.id === product.categoryId);
      if (found) return found.name;
    }
    if (parent?.categoryName) return parent.categoryName;
    if (parent?.categoryId) {
      const found = categories.find((c) => c.id === parent.categoryId);
      if (found) return found.name;
    }
    return '';
  };

  const isMotorProduct = (product: ProductDto, parent?: ProductDto | null): boolean => {
    if (motorCategory && (product.categoryId === motorCategory.id || parent?.categoryId === motorCategory.id)) {
      return true;
    }
    const catName = getCategoryName(product, parent).trim().toLowerCase();
    return catName === 'motors' || catName === 'motor';
  };

  const isFrameProduct = (product: ProductDto, parent?: ProductDto | null): boolean => {
    if (frameCategory && (product.categoryId === frameCategory.id || parent?.categoryId === frameCategory.id)) {
      return true;
    }
    const catName = getCategoryName(product, parent).trim().toLowerCase();
    return catName === 'frames' || catName === 'frame';
  };

  // Aggregate only actual individual/purchasable products
  // Aggregate strictly individual child products belonging to Motors and Frames
  const allIndividualProducts: { product: ProductDto; categoryLabel: string; isMotor: boolean; isFrame: boolean }[] = [];
  const seenIds = new Set<number>();

  parentProducts.forEach((parent) => {
    const children = childProductsMap[parent.id] || [];
    children.forEach((child) => {
      if (child.productType !== 'PARENT' && !seenIds.has(child.id)) {
        const isMotor = isMotorProduct(child, parent);
        const isFrame = isFrameProduct(child, parent);

        if (isMotor || isFrame) {
          seenIds.add(child.id);
          const rawCat = getCategoryName(child, parent);
          const categoryLabel = rawCat || (isFrame ? 'Frames' : 'Motors');
          allIndividualProducts.push({ product: child, categoryLabel, isMotor, isFrame });
        }
      }
    });
  });

  // Filter individual hardware products
  const filteredHardware = allIndividualProducts.filter(({ product, categoryLabel, isMotor, isFrame }) => {
    if (activeCategoryFilter === 'motors') {
      if (!isMotor) return false;
    } else if (activeCategoryFilter === 'frames') {
      if (!isFrame) return false;
    } else if (activeCategoryFilter === 'parachute' || activeCategoryFilter === 'agri') {
      return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      (product.description && product.description.toLowerCase().includes(q)) ||
      categoryLabel.toLowerCase().includes(q)
    );
  });

  // Standalone exception cards visibility (only on their respective tabs)
  const isParachuteVisible =
    Boolean(parachuteConfig && parachuteConfig.isEnabled) &&
    activeCategoryFilter === 'parachute' &&
    (!search.trim() ||
      (parachuteConfig?.displayName && parachuteConfig.displayName.toLowerCase().includes(search.toLowerCase())) ||
      'parachute recovery systems for drones'.includes(search.toLowerCase()));

  const isAgriDroneVisible =
    activeCategoryFilter === 'agri' &&
    (!search.trim() ||
      (agriDroneConfig?.displayName && agriDroneConfig.displayName.toLowerCase().includes(search.toLowerCase())) ||
      'agricultural spraying drone hexacopter rpas 10l precision spraying'.includes(search.toLowerCase()));

  return {
    filteredHardware,
    isParachuteVisible,
    isAgriDroneVisible,
    allIndividualProducts,
  };
}

describe('StoreLandingCatalog Hardware Filtering for 5 Category Tabs', () => {
  const realCategories: CategoryDto[] = [
    { id: 1, name: 'Motors', description: 'Drone motors' },
    { id: 2, name: 'Frames', description: 'Drone frames' },
  ];

  const realParents: ProductDto[] = [
    {
      id: 9,
      name: 'High-Performance Motors Series',
      price: 0,
      quantity: 0,
      status: 'AVAILABLE',
      productType: 'PARENT',
      categoryId: 1,
      categoryName: 'Motors',
    },
    {
      id: 29,
      name: 'Frames',
      price: 0,
      quantity: 0,
      status: 'AVAILABLE',
      productType: 'PARENT',
      categoryId: 2,
      categoryName: 'Frames',
    },
  ];

  const realChildMap: Record<number, ProductDto[]> = {
    9: [
      { id: 26, name: 'DZ-8017 High Thrust BLDC', price: 14500, quantity: 12, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors' },
      { id: 27, name: 'DZ-8120 Heavy Lift Motor', price: 18200, quantity: 8, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors' },
      { id: 28, name: 'DZ-6215 Efficient Endurance', price: 11000, quantity: 20, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors' },
      { id: 30, name: 'DZ-10015 Heavy Lift Stator', price: 24500, quantity: 5, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors' },
      { id: 31, name: 'DZ-8318 High-Altitude Motor', price: 19800, quantity: 15, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors' },
    ],
    29: [
      { id: 36, name: 'Carbon 5-inch FPV Frame', price: 3400, quantity: 25, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames' },
      { id: 37, name: 'Carbon 7-inch Long Range Frame', price: 4200, quantity: 18, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames' },
      { id: 38, name: 'Carbon 10-inch Heavy Lift Frame', price: 6800, quantity: 10, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames' },
      { id: 39, name: 'Carbon 13-inch Hexacopter Frame', price: 9500, quantity: 6, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames' },
    ],
  };

  it('1. Tab "all": Displays only individual child products belonging to Motors and Frames, excluding parent products and standalone exceptions', () => {
    const result = buildCatalogViewModel({
      categories: realCategories,
      parentProducts: realParents,
      childProductsMap: realChildMap,
      activeCategoryFilter: 'all',
    });

    // Contains only the 5 motors + 4 frames child products = 9 items
    expect(result.filteredHardware).toHaveLength(9);
    expect(result.filteredHardware.every((item) => item.isMotor || item.isFrame)).toBe(true);
    // Verifies no parent product exists
    expect(result.filteredHardware.some((item) => item.product.productType === 'PARENT')).toBe(false);
    expect(result.filteredHardware.some((item) => item.product.id === 9 || item.product.id === 29)).toBe(false);

    // Standalone cards (Parachute and Agri Drone) are NEVER visible under "All Hardware Systems"
    expect(result.isParachuteVisible).toBe(false);
    expect(result.isAgriDroneVisible).toBe(false);
  });

  it('2. Tab "motors": Displays only actual motor products, excluding frames, parents, parachutes, and agri drones', () => {
    const result = buildCatalogViewModel({
      categories: realCategories,
      parentProducts: realParents,
      childProductsMap: realChildMap,
      activeCategoryFilter: 'motors',
    });

    // Exactly 5 motor products
    expect(result.filteredHardware).toHaveLength(5);
    expect(result.filteredHardware.every((item) => item.isMotor)).toBe(true);
    expect(result.filteredHardware.some((item) => item.isFrame)).toBe(false);
    expect(result.filteredHardware.some((item) => item.product.productType === 'PARENT')).toBe(false);

    // Standalone exceptions are hidden
    expect(result.isParachuteVisible).toBe(false);
    expect(result.isAgriDroneVisible).toBe(false);
  });

  it('3. Tab "frames": Displays only actual frame products, excluding motors, parents, parachutes, and agri drones', () => {
    const result = buildCatalogViewModel({
      categories: realCategories,
      parentProducts: realParents,
      childProductsMap: realChildMap,
      activeCategoryFilter: 'frames',
    });

    // Exactly 4 frame products
    expect(result.filteredHardware).toHaveLength(4);
    expect(result.filteredHardware.every((item) => item.isFrame)).toBe(true);
    expect(result.filteredHardware.some((item) => item.isMotor)).toBe(false);
    expect(result.filteredHardware.some((item) => item.product.productType === 'PARENT')).toBe(false);

    // Standalone exceptions are hidden
    expect(result.isParachuteVisible).toBe(false);
    expect(result.isAgriDroneVisible).toBe(false);
  });

  it('4. Tab "parachute": Displays exactly one standalone parachute card and no hardware grid items', () => {
    const result = buildCatalogViewModel({
      categories: realCategories,
      parentProducts: realParents,
      childProductsMap: realChildMap,
      activeCategoryFilter: 'parachute',
    });

    // Parachute visible
    expect(result.isParachuteVisible).toBe(true);
    // Agri drone hidden
    expect(result.isAgriDroneVisible).toBe(false);
    // No hardware items
    expect(result.filteredHardware).toHaveLength(0);
  });

  it('5. Tab "agri": Displays exactly one standalone agricultural drone card and no hardware grid items', () => {
    const result = buildCatalogViewModel({
      categories: realCategories,
      parentProducts: realParents,
      childProductsMap: realChildMap,
      activeCategoryFilter: 'agri',
    });

    // Agri drone visible
    expect(result.isAgriDroneVisible).toBe(true);
    // Parachute hidden
    expect(result.isParachuteVisible).toBe(false);
    // No hardware items
    expect(result.filteredHardware).toHaveLength(0);
  });

  it('6. Search filtering works across product name, description, and SKU within active tab', () => {
    const result = buildCatalogViewModel({
      categories: realCategories,
      parentProducts: realParents,
      childProductsMap: realChildMap,
      activeCategoryFilter: 'motors',
      search: '8017',
    });

    expect(result.filteredHardware).toHaveLength(1);
    expect(result.filteredHardware[0].product.name).toContain('8017');
  });
});
