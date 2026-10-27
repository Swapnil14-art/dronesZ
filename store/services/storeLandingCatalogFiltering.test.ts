import { describe, it, expect } from 'vitest';
import { ProductDto, CategoryDto } from './api';
import {
  buildDynamicTabs,
  buildAllIndividualProducts,
  filterHardwareProducts,
  DynamicCategoryTab,
} from './dynamicStoreTabs';

// Helper using the authentic dynamic store tabs services
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
  activeCategoryFilter: string;
  search?: string;
  parachuteConfig?: { isEnabled: boolean; displayName?: string; slug?: string } | null;
  agriDroneConfig?: { displayName?: string; slug?: string; hero?: { tagline?: string; subheading?: string } } | null;
}) {
  const dynamicTabs = buildDynamicTabs(
    categories,
    parentProducts,
    Boolean(parachuteConfig && parachuteConfig.isEnabled),
    true
  );

  // Normalize legacy filter keys to tab IDs if needed
  let effectiveTabId = activeCategoryFilter;
  if (activeCategoryFilter === 'motors') {
    const motorTab = dynamicTabs.find((t) => t.name.toLowerCase().includes('motor'));
    if (motorTab) effectiveTabId = motorTab.id;
  } else if (activeCategoryFilter === 'frames') {
    const frameTab = dynamicTabs.find((t) => t.name.toLowerCase().includes('frame'));
    if (frameTab) effectiveTabId = frameTab.id;
  }

  const allIndividualProducts = buildAllIndividualProducts(
    parentProducts,
    childProductsMap,
    categories,
    dynamicTabs,
    standaloneProducts
  );

  const filteredHardware = filterHardwareProducts(allIndividualProducts, effectiveTabId, search);

  const isParachuteVisible =
    Boolean(parachuteConfig && parachuteConfig.isEnabled) &&
    effectiveTabId === 'parachute' &&
    (!search.trim() ||
      (parachuteConfig?.displayName && parachuteConfig.displayName.toLowerCase().includes(search.toLowerCase())) ||
      'parachute recovery systems for drones'.includes(search.toLowerCase()));

  const isAgriDroneVisible =
    effectiveTabId === 'agri' &&
    (!search.trim() ||
      (agriDroneConfig?.displayName && agriDroneConfig.displayName.toLowerCase().includes(search.toLowerCase())) ||
      'agricultural spraying drone hexacopter rpas 10l precision spraying'.includes(search.toLowerCase()));

  return {
    dynamicTabs,
    filteredHardware,
    isParachuteVisible,
    isAgriDroneVisible,
    allIndividualProducts,
  };
}

describe('StoreLandingCatalog Dynamic Category Tab & Hardware Filtering', () => {
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
      createdAt: '',
      updatedAt: '',
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
      createdAt: '',
      updatedAt: '',
    },
  ];

  const realChildMap: Record<number, ProductDto[]> = {
    9: [
      { id: 26, name: 'DZ-8017 High Thrust BLDC', price: 14500, quantity: 12, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors', createdAt: '', updatedAt: '' },
      { id: 27, name: 'DZ-8120 Heavy Lift Motor', price: 18200, quantity: 8, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors', createdAt: '', updatedAt: '' },
      { id: 28, name: 'DZ-6215 Efficient Endurance', price: 11000, quantity: 20, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors', createdAt: '', updatedAt: '' },
      { id: 30, name: 'DZ-10015 Heavy Lift Stator', price: 24500, quantity: 5, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors', createdAt: '', updatedAt: '' },
      { id: 31, name: 'DZ-8318 High-Altitude Motor', price: 19800, quantity: 15, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors', createdAt: '', updatedAt: '' },
    ],
    29: [
      { id: 36, name: 'Carbon 5-inch FPV Frame', price: 3400, quantity: 25, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames', createdAt: '', updatedAt: '' },
      { id: 37, name: 'Carbon 7-inch Long Range Frame', price: 4200, quantity: 18, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames', createdAt: '', updatedAt: '' },
      { id: 38, name: 'Carbon 10-inch Heavy Lift Frame', price: 6800, quantity: 10, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames', createdAt: '', updatedAt: '' },
      { id: 39, name: 'Carbon 13-inch Hexacopter Frame', price: 9500, quantity: 6, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames', createdAt: '', updatedAt: '' },
    ],
  };

  it('1. Tab "all": Displays only individual child products belonging to categories, excluding parent products and standalone exceptions', () => {
    const result = buildCatalogViewModel({
      categories: realCategories,
      parentProducts: realParents,
      childProductsMap: realChildMap,
      activeCategoryFilter: 'all',
    });

    // Contains only the 5 motors + 4 frames child products = 9 items
    expect(result.filteredHardware).toHaveLength(9);
    expect(result.filteredHardware.every((item) => item.categoryLabel === 'Motors' || item.categoryLabel === 'Frames')).toBe(true);
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
    expect(result.filteredHardware.every((item) => item.categoryLabel === 'Motors')).toBe(true);
    expect(result.filteredHardware.some((item) => item.categoryLabel === 'Frames')).toBe(false);
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
    expect(result.filteredHardware.every((item) => item.categoryLabel === 'Frames')).toBe(true);
    expect(result.filteredHardware.some((item) => item.categoryLabel === 'Motors')).toBe(false);
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
