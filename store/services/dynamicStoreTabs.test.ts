import { describe, it, expect } from 'vitest';
import {
  buildDynamicTabs,
  buildAllIndividualProducts,
  filterHardwareProducts,
  resolveItemCategoryLabel,
  isStandaloneException,
} from './dynamicStoreTabs';
import { ProductDto } from './api';

describe('dynamicStoreTabs Service', () => {
  const parentMotors: ProductDto = {
    id: 9,
    name: 'Motors',
    price: 0,
    quantity: 0,
    status: 'AVAILABLE',
    productType: 'PARENT',
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
    createdAt: '',
    updatedAt: '',
  };

  const motorChildren: ProductDto[] = [
    { id: 26, name: 'DZ-8017 Motor', price: 14500, quantity: 10, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, createdAt: '', updatedAt: '' },
    { id: 27, name: 'DZ-8120 Motor', price: 18200, quantity: 8, status: 'AVAILABLE', productType: 'CHILD', parentId: 9, createdAt: '', updatedAt: '' },
  ];

  const frameChildren: ProductDto[] = [
    { id: 36, name: 'Carbon 5-inch Frame', price: 3400, quantity: 20, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, createdAt: '', updatedAt: '' },
    { id: 37, name: 'Carbon 7-inch Frame', price: 4200, quantity: 15, status: 'AVAILABLE', productType: 'CHILD', parentId: 29, createdAt: '', updatedAt: '' },
  ];

  const childMap: Record<number, ProductDto[]> = {
    9: motorChildren,
    29: frameChildren,
  };

  it('1. Generates All Hardware Systems, Motors, Frames, and standalone tabs dynamically from parent series', () => {
    const tabs = buildDynamicTabs([parentMotors, parentFrames], true, true);
    expect(tabs.map((t) => t.name)).toEqual([
      'All Hardware Systems',
      'Motors',
      'Frames',
      'Recovery Parachutes',
      'Agricultural Drones',
    ]);
  });

  it('2. Dynamically adds new tab when a parent series is added without code changes', () => {
    const parentProps: ProductDto = {
      id: 50,
      name: 'Propellers',
      price: 0,
      quantity: 0,
      status: 'AVAILABLE',
      productType: 'PARENT',
      createdAt: '',
      updatedAt: '',
    };

    const propChildren: ProductDto[] = [
      { id: 51, name: 'HQProp 5x4.3x3 V2S', price: 350, quantity: 100, status: 'AVAILABLE', productType: 'CHILD', parentId: 50, createdAt: '', updatedAt: '' },
    ];

    const tabs = buildDynamicTabs([parentMotors, parentFrames, parentProps], true, true);
    expect(tabs.map((t) => t.name)).toContain('Propellers');

    const extendedMap = { ...childMap, 50: propChildren };
    const allItems = buildAllIndividualProducts(
      [parentMotors, parentFrames, parentProps],
      extendedMap,
      tabs
    );

    // HQProp appears in All Hardware Systems (5 items total = 2 motors + 2 frames + 1 propeller)
    const inAll = filterHardwareProducts(allItems, 'all');
    expect(inAll).toHaveLength(5);
    expect(inAll.some((item) => item.product.id === 51)).toBe(true);

    // HQProp appears in the new Propellers parent tab
    const inPropTab = filterHardwareProducts(allItems, 'parent-50');
    expect(inPropTab).toHaveLength(1);
    expect(inPropTab[0].product.name).toBe('HQProp 5x4.3x3 V2S');

    // HQProp does NOT appear in Motors or Frames tab
    expect(filterHardwareProducts(allItems, 'parent-9').some((i) => i.product.id === 51)).toBe(false);
    expect(filterHardwareProducts(allItems, 'parent-29').some((i) => i.product.id === 51)).toBe(false);
  });

  it('3. Products appear in BOTH All Hardware Systems and their respective parent series tab with no duplicates', () => {
    const tabs = buildDynamicTabs([parentMotors, parentFrames], true, true);
    const allItems = buildAllIndividualProducts([parentMotors, parentFrames], childMap, tabs);

    const inAll = filterHardwareProducts(allItems, 'all');
    expect(inAll).toHaveLength(4);

    const inMotors = filterHardwareProducts(allItems, 'parent-9');
    expect(inMotors).toHaveLength(2);
    expect(inMotors.every((m) => m.categoryLabel === 'Motors')).toBe(true);

    const inFrames = filterHardwareProducts(allItems, 'parent-29');
    expect(inFrames).toHaveLength(2);
    expect(inFrames.every((f) => f.categoryLabel === 'Frames')).toBe(true);

    // Each child motor appears in All Hardware Systems AND in Motors tab
    motorChildren.forEach((m) => {
      expect(inAll.filter((item) => item.product.id === m.id)).toHaveLength(1);
      expect(inMotors.filter((item) => item.product.id === m.id)).toHaveLength(1);
    });
  });

  it('4. Handles parent series renaming dynamically', () => {
    const renamedParentMotors: ProductDto = {
      ...parentMotors,
      name: 'Propulsion Systems',
    };

    const tabs = buildDynamicTabs([renamedParentMotors, parentFrames], true, true);
    expect(tabs.map((t) => t.name)).toContain('Propulsion Systems');
    expect(tabs.map((t) => t.name)).not.toContain('Motors');

    const allItems = buildAllIndividualProducts([renamedParentMotors, parentFrames], childMap, tabs);
    const inRenamed = filterHardwareProducts(allItems, 'parent-9');
    expect(inRenamed).toHaveLength(2);
    expect(inRenamed.every((m) => m.categoryLabel === 'Propulsion Systems')).toBe(true);
  });

  it('5. Handles archived parent series by excluding them from tabs', () => {
    const archivedFrameParent: ProductDto = {
      ...parentFrames,
      status: 'ARCHIVED',
    };

    const tabs = buildDynamicTabs([parentMotors, archivedFrameParent], true, true);
    expect(tabs.map((t) => t.name)).not.toContain('Frames');
  });

  it('6. Preserves standalone Recovery Parachutes and Agricultural Drones tabs without duplication', () => {
    const parentWithParachuteName: ProductDto = {
      id: 99,
      name: 'Recovery Parachutes System',
      price: 0,
      quantity: 0,
      status: 'AVAILABLE',
      productType: 'PARENT',
      createdAt: '',
      updatedAt: '',
    };

    const tabs = buildDynamicTabs([parentMotors, parentFrames, parentWithParachuteName], true, true);
    const parachuteTabs = tabs.filter((t) => t.name.toLowerCase().includes('parachute'));
    const agriTabs = tabs.filter((t) => t.name.toLowerCase().includes('agri'));

    expect(parachuteTabs).toHaveLength(1);
    expect(parachuteTabs[0].type).toBe('parachute');

    expect(agriTabs).toHaveLength(1);
    expect(agriTabs[0].type).toBe('agri');
  });

  it('7. Handles empty parent series gracefully without throwing', () => {
    const emptyParent: ProductDto = {
      id: 999,
      name: 'Empty Test Series',
      price: 0,
      quantity: 0,
      status: 'AVAILABLE',
      productType: 'PARENT',
      createdAt: '',
      updatedAt: '',
    };

    const tabs = buildDynamicTabs([parentMotors, parentFrames, emptyParent], false, false);
    expect(tabs.some((t) => t.id === 'parent-999')).toBe(true);

    const allItems = buildAllIndividualProducts([parentMotors, parentFrames, emptyParent], childMap, tabs);
    const inEmpty = filterHardwareProducts(allItems, 'parent-999');
    expect(inEmpty).toHaveLength(0);
  });

  it('8. Supports search filtering within dynamic parent tabs and across All Hardware Systems', () => {
    const tabs = buildDynamicTabs([parentMotors, parentFrames], true, true);
    const allItems = buildAllIndividualProducts([parentMotors, parentFrames], childMap, tabs);

    // Search across All Hardware Systems
    const searchInAll = filterHardwareProducts(allItems, 'all', '8017');
    expect(searchInAll).toHaveLength(1);
    expect(searchInAll[0].product.name).toBe('DZ-8017 Motor');

    // Search within Motors parent tab
    const searchInMotors = filterHardwareProducts(allItems, 'parent-9', '8017');
    expect(searchInMotors).toHaveLength(1);

    // Search within Frames parent tab returns empty when item is in Motors
    const searchInFrames = filterHardwareProducts(allItems, 'parent-29', '8017');
    expect(searchInFrames).toHaveLength(0);
  });
});
