import { CategoryDto, ProductDto } from './api';

export interface DynamicCategoryTab {
  id: string; // e.g. "all", "cat-1", "parent-9", "parachute", "agri"
  name: string; // Display label, e.g. "All Hardware Systems", "Motors", "Frames"
  type: 'all' | 'category' | 'parent' | 'parachute' | 'agri';
  categoryId?: number;
  parentId?: number;
}

export interface IndividualHardwareItem {
  product: ProductDto;
  parent: ProductDto | null;
  categoryLabel: string;
  tabIds: string[]; // List of tab IDs this product belongs to
}

/**
 * Checks if a name indicates a standalone landing page (Recovery Parachutes or Agricultural Drones)
 * to avoid turning them into duplicate generic hardware category tabs.
 */
export function isStandaloneException(name?: string | null): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    n.includes('parachute') ||
    n.includes('agricultural') ||
    n.includes('agri drone') ||
    n.includes('agri-drone')
  );
}

/**
 * Resolves the primary category label to display on product cards.
 */
export function resolveItemCategoryLabel(
  child: ProductDto,
  parent: ProductDto | null,
  categories: CategoryDto[]
): string {
  if (child.categoryName?.trim()) return child.categoryName.trim();
  if (child.categoryId) {
    const found = categories.find((c) => c.id === child.categoryId);
    if (found?.name?.trim()) return found.name.trim();
  }
  if (parent?.categoryName?.trim()) return parent.categoryName.trim();
  if (parent?.categoryId) {
    const found = categories.find((c) => c.id === parent.categoryId);
    if (found?.name?.trim()) return found.name.trim();
  }
  if (parent?.name?.trim()) return parent.name.trim();
  return 'Hardware';
}

/**
 * Dynamically builds all catalogue tabs based on database categories, parent series,
 * and standalone module configurations.
 */
export function buildDynamicTabs(
  categories: CategoryDto[],
  parentProducts: ProductDto[],
  parachuteEnabled: boolean = false,
  agriDroneEnabled: boolean = true
): DynamicCategoryTab[] {
  const tabs: DynamicCategoryTab[] = [
    {
      id: 'all',
      name: 'All Hardware Systems',
      type: 'all',
    },
  ];

  const seenNormalizedNames = new Set<string>();
  seenNormalizedNames.add('all hardware systems');
  seenNormalizedNames.add('all');

  // 1. Process active database categories
  const activeCategories = (categories || []).filter(
    (c) => !c.isDeleted && !isStandaloneException(c.name)
  );

  for (const cat of activeCategories) {
    const norm = cat.name.trim().toLowerCase();
    if (!norm || seenNormalizedNames.has(norm)) continue;
    seenNormalizedNames.add(norm);
    tabs.push({
      id: `cat-${cat.id}`,
      name: cat.name.trim(),
      type: 'category',
      categoryId: cat.id,
    });
  }

  // 2. Process parent product series (eligible parent products not yet represented by a category)
  for (const parent of parentProducts || []) {
    if (parent.productType !== 'PARENT' || parent.status === 'ARCHIVED') continue;
    if (isStandaloneException(parent.name)) continue;

    const parentName = parent.name.trim();
    const parentNorm = parentName.toLowerCase();

    // Check if parent product is already represented by an existing category tab
    const alreadyRepresented = tabs.some((t) => {
      if (t.type !== 'category') return false;
      if (parent.categoryId && t.categoryId === parent.categoryId) return true;
      const tNorm = t.name.toLowerCase();
      if (tNorm === parentNorm) return true;
      if (parent.categoryName && tNorm === parent.categoryName.trim().toLowerCase()) return true;
      return false;
    });

    if (!alreadyRepresented && !seenNormalizedNames.has(parentNorm)) {
      seenNormalizedNames.add(parentNorm);
      tabs.push({
        id: `parent-${parent.id}`,
        name: parentName,
        type: 'parent',
        parentId: parent.id,
      });
    }
  }

  // 3. Standalone product tabs (Recovery Parachutes & Agricultural Drones)
  if (parachuteEnabled) {
    tabs.push({
      id: 'parachute',
      name: 'Recovery Parachutes',
      type: 'parachute',
    });
  }

  if (agriDroneEnabled) {
    tabs.push({
      id: 'agri',
      name: 'Agricultural Drones',
      type: 'agri',
    });
  }

  return tabs;
}

/**
 * Aggregates all purchasable individual hardware products from parent series and standalone items.
 * Each product appears exactly once in the master list, with all matching tab IDs tracked.
 */
export function buildAllIndividualProducts(
  parentProducts: ProductDto[],
  childProductsMap: Record<number, ProductDto[]>,
  categories: CategoryDto[],
  tabs: DynamicCategoryTab[],
  standaloneProducts: ProductDto[] = []
): IndividualHardwareItem[] {
  const items: IndividualHardwareItem[] = [];
  const seenIds = new Set<number>();

  // Process child products under parent series
  (parentProducts || []).forEach((parent) => {
    if (parent.status === 'ARCHIVED') return;
    if (isStandaloneException(parent.name)) return;

    const children = childProductsMap[parent.id] || [];
    children.forEach((child) => {
      // Exclude parent products and duplicates
      if (child.productType === 'PARENT') return;
      if (child.status === 'ARCHIVED') return;
      if (isStandaloneException(child.name)) return;
      if (seenIds.has(child.id)) return;

      const categoryLabel = resolveItemCategoryLabel(child, parent, categories);

      // Match child product to all applicable tabs
      const matchedTabIds = tabs
        .filter((tab) => {
          if (tab.type === 'all') return true;
          if (tab.type === 'category') {
            if (child.categoryId && child.categoryId === tab.categoryId) return true;
            if (parent.categoryId && parent.categoryId === tab.categoryId) return true;
            const tabNorm = tab.name.toLowerCase();
            if (child.categoryName && child.categoryName.trim().toLowerCase() === tabNorm) return true;
            if (parent.categoryName && parent.categoryName.trim().toLowerCase() === tabNorm) return true;
            if (parent.name && parent.name.trim().toLowerCase() === tabNorm) return true;
            if (categoryLabel.toLowerCase() === tabNorm) return true;
            return false;
          }
          if (tab.type === 'parent') {
            if (child.parentId && child.parentId === tab.parentId) return true;
            if (parent.id === tab.parentId) return true;
            const tabNorm = tab.name.toLowerCase();
            if (parent.name && parent.name.trim().toLowerCase() === tabNorm) return true;
            return false;
          }
          return false;
        })
        .map((t) => t.id);

      seenIds.add(child.id);
      items.push({
        product: child,
        parent,
        categoryLabel,
        tabIds: matchedTabIds,
      });
    });
  });

  // Process standalone hardware products (if any)
  (standaloneProducts || []).forEach((standalone) => {
    if (standalone.productType === 'PARENT') return;
    if (standalone.status === 'ARCHIVED') return;
    if (isStandaloneException(standalone.name)) return;
    if (seenIds.has(standalone.id)) return;

    const categoryLabel = resolveItemCategoryLabel(standalone, null, categories);
    const matchedTabIds = tabs
      .filter((tab) => {
        if (tab.type === 'all') return true;
        if (tab.type === 'category') {
          if (standalone.categoryId && standalone.categoryId === tab.categoryId) return true;
          const tabNorm = tab.name.toLowerCase();
          if (standalone.categoryName && standalone.categoryName.trim().toLowerCase() === tabNorm) return true;
          if (categoryLabel.toLowerCase() === tabNorm) return true;
          return false;
        }
        return false;
      })
      .map((t) => t.id);

    seenIds.add(standalone.id);
    items.push({
      product: standalone,
      parent: null,
      categoryLabel,
      tabIds: matchedTabIds,
    });
  });

  return items;
}

/**
 * Filters the aggregate hardware list based on the active tab and search query.
 */
export function filterHardwareProducts(
  items: IndividualHardwareItem[],
  activeTabId: string,
  search: string = ''
): IndividualHardwareItem[] {
  // Parachute and Agricultural Drones tabs render their dedicated hero cards, not hardware grid
  if (activeTabId === 'parachute' || activeTabId === 'agri') {
    return [];
  }

  const query = search.trim().toLowerCase();

  return items.filter(({ product, categoryLabel, tabIds }) => {
    // 1. Tab membership
    if (activeTabId !== 'all' && !tabIds.includes(activeTabId)) {
      return false;
    }

    // 2. Search query
    if (!query) return true;

    return (
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query)) ||
      categoryLabel.toLowerCase().includes(query)
    );
  });
}
