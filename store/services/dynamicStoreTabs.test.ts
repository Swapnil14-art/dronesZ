import { describe, it, expect } from 'vitest';
import {
  buildDynamicTabs,
  buildAllIndividualProducts,
  filterHardwareProducts,
  resolveItemCategoryLabel,
  isStandaloneException,
} from './dynamicStoreTabs';
import { CategoryDto, ProductDto } from './api';

describe('dynamicStoreTabs Service', () => {
  const initialCategories: CategoryDto[] = [
    { id: 1, name: 'Motors', description: 'Drone Motors' },
    { id: 2, name: 'Frames', description: 'Drone Frames' },
  ];

  const parentMotors: ProductDto = {
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
  };

  const parentFrames: ProductDto = {
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
  };

  const motorChildren: ProductDto[] = [
    { id: 26, name: 'DZ-8017 Motor', price: 14500, quantity: 10, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors', createdAt: '', updatedAt: '' },
    { id: 27, name: 'DZ-8120 Motor', price: 18200, quantity: 8, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, categoryId: 1, categoryName: 'Motors', createdAt: '', updatedAt: '' },
  ];

  const frameChildren: ProductDto[] = [
    { id: 36, name: 'Carbon 5-inch Frame', price: 3400, quantity: 20, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames', createdAt: '', updatedAt: '' },
    { id: 37, name: 'Carbon 7-inch Frame', price: 4200, quantity: 15, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, categoryId: 2, categoryName: 'Frames', createdAt: '', updatedAt: '' },
  ];

  const childMap: Record<number, ProductDto[]> = {
    9: motorChildren,
    29: frameChildren,
  };

  it('1. Generates All Hardware Systems, Motors, Frames, and standalone tabs dynamically', () => {
    const tabs = buildDynamicTabs(initialCategories, [parentMotors, parentFrames], true, true);
    expect(tabs.map((t) => t.name)).toEqual([
      'All Hardware Systems',
      'Motors',
      'Frames',
      'Recovery Parachutes',
      'Agricultural Drones',
    ]);
  });

  it('2. Dynamically adds new tab when a category is added in admin without code changes', () => {
    const updatedCategories: CategoryDto[] = [
      ...initialCategories,
      { id: 3, name: 'Propellers', description: 'Carbon & Plastic Propellers' },
    ];

    const parentProps: ProductDto = {
      id: 50,
      name: 'High Thrust Propeller Series',
      price: 0,
      quantity: 0,
      status: 'AVAILABLE',
      productType: 'PARENT',
      categoryId: 3,
      categoryName: 'Propellers',
      createdAt: '',
      updatedAt: '',
    };

    const propChildren: ProductDto[] = [
      { id: 51, name: 'HQProp 5x4.3x3 V2S', price: 350, quantity: 100, status: 'AVAILABLE', productType: 'CHILD', parentId: 50, categoryId: 3, categoryName: 'Propellers', createdAt: '', updatedAt: '' },
    ];

    const tabs = buildDynamicTabs(updatedCategories, [parentMotors, parentFrames, parentProps], true, true);
    expect(tabs.map((t) => t.name)).toContain('Propellers');

    const extendedMap = { ...childMap, 50: propChildren };
    const allItems = buildAllIndividualProducts(
      [parentMotors, parentFrames, parentProps],
      extendedMap,
      updatedCategories,
      tabs
    );

    // HQProp appears in All Hardware Systems (5 items total = 2 motors + 2 frames + 1 propeller)
    const inAll = filterHardwareProducts(allItems, 'all');
    expect(inAll).toHaveLength(5);
    expect(inAll.some((item) => item.product.id === 51)).toBe(true);

    // HQProp appears in the new Propellers category tab
    const inPropTab = filterHardwareProducts(allItems, 'cat-3');
    expect(inPropTab).toHaveLength(1);
    expect(inPropTab[0].product.name).toBe('HQProp 5x4.3x3 V2S');

    // HQProp does NOT appear in Motors or Frames tab
    expect(filterHardwareProducts(allItems, 'cat-1').some((i) => i.product.id === 51)).toBe(false);
    expect(filterHardwareProducts(allItems, 'cat-2').some((i) => i.product.id === 51)).toBe(false);
  });

  it('3. Products appear in BOTH All Hardware Systems and their respective category tab with no duplicates', () => {
    const tabs = buildDynamicTabs(initialCategories, [parentMotors, parentFrames], true, true);
    const allItems = buildAllIndividualProducts([parentMotors, parentFrames], childMap, initialCategories, tabs);

    const inAll = filterHardwareProducts(allItems, 'all');
    expect(inAll).toHaveLength(4);

    const inMotors = filterHardwareProducts(allItems, 'cat-1');
    expect(inMotors).toHaveLength(2);
    expect(inMotors.every((m) => m.categoryLabel === 'Motors')).toBe(true);

    const inFrames = filterHardwareProducts(allItems, 'cat-2');
    expect(inFrames).toHaveLength(2);
    expect(inFrames.every((f) => f.categoryLabel === 'Frames')).toBe(true);

    // Each child motor appears in All Hardware Systems AND in Motors tab
    motorChildren.forEach((m) => {
      expect(inAll.filter((item) => item.product.id === m.id)).toHaveLength(1);
      expect(inMotors.filter((item) => item.product.id === m.id)).toHaveLength(1);
    });
  });

  it('4. Handles category renaming dynamically', () => {
    const renamedCategories: CategoryDto[] = [
      { id: 1, name: 'Propulsion Systems', description: 'Updated Motor Name' },
      { id: 2, name: 'Frames', description: 'Drone Frames' },
    ];

    const tabs = buildDynamicTabs(renamedCategories, [parentMotors, parentFrames], true, true);
    expect(tabs.map((t) => t.name)).toContain('Propulsion Systems');
    expect(tabs.map((t) => t.name)).not.toContain('Motors');

    const allItems = buildAllIndividualProducts([parentMotors, parentFrames], childMap, renamedCategories, tabs);
    const inRenamed = filterHardwareProducts(allItems, 'cat-1');
    expect(inRenamed).toHaveLength(2);
  });

  it('5. Handles category deletion in admin (isDeleted = true)', () => {
    const categoriesWithDeleted: CategoryDto[] = [
      { id: 1, name: 'Motors', description: 'Drone Motors' },
      { id: 2, name: 'Frames', description: 'Drone Frames', isDeleted: true },
    ];

    const tabs = buildDynamicTabs(categoriesWithDeleted, [parentMotors], true, true);
    expect(tabs.map((t) => t.name)).not.toContain('Frames');
  });

  it('6. Preserves standalone Recovery Parachutes and Agricultural Drones tabs without duplication', () => {
    // If a category in DB was created with a name containing parachute or agricultural, it should not duplicate
    const categoriesWithDuplicate: CategoryDto[] = [
      ...initialCategories,
      { id: 4, name: 'Recovery Parachutes' },
      { id: 5, name: 'Agricultural Drones' },
    ];

    const tabs = buildDynamicTabs(categoriesWithDuplicate, [parentMotors, parentFrames], true, true);
    const parachuteTabs = tabs.filter((t) => t.name.toLowerCase().includes('parachute'));
    const agriTabs = tabs.filter((t) => t.name.toLowerCase().includes('agri'));

    expect(parachuteTabs).toHaveLength(1);
    expect(parachuteTabs[0].type).toBe('parachute');

    expect(agriTabs).toHaveLength(1);
    expect(agriTabs[0].type).toBe('agri');
  });

  it('7. Handles empty categories gracefully without throwing', () => {
    const categoriesWithEmpty: CategoryDto[] = [
      ...initialCategories,
      { id: 99, name: 'Empty Test Category' },
    ];

    const tabs = buildDynamicTabs(categoriesWithEmpty, [parentMotors, parentFrames], false, false);
    expect(tabs.some((t) => t.id === 'cat-99')).toBe(true);

    const allItems = buildAllIndividualProducts([parentMotors, parentFrames], childMap, categoriesWithEmpty, tabs);
    const inEmpty = filterHardwareProducts(allItems, 'cat-99');
    expect(inEmpty).toHaveLength(0);
  });

  it('8. Supports search filtering within dynamic category tabs and across All Hardware Systems', () => {
    const tabs = buildDynamicTabs(initialCategories, [parentMotors, parentFrames], true, true);
    const allItems = buildAllIndividualProducts([parentMotors, parentFrames], childMap, initialCategories, tabs);

    // Search across All Hardware Systems
    const searchInAll = filterHardwareProducts(allItems, 'all', '8017');
    expect(searchInAll).toHaveLength(1);
    expect(searchInAll[0].product.name).toBe('DZ-8017 Motor');

    // Search within Motors category tab
    const searchInMotors = filterHardwareProducts(allItems, 'cat-1', '8017');
    expect(searchInMotors).toHaveLength(1);

    // Search within Frames category tab returns empty when item is in Motors
    const searchInFrames = filterHardwareProducts(allItems, 'cat-2', '8017');
    expect(searchInFrames).toHaveLength(0);
  });
});
