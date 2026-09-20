package com.dronestore.system.config;

/**
 * Constants defining standard cache region names used across the application.
 */
public final class CacheNames {

    private CacheNames() {
        // Prevent instantiation
    }

    /**
     * Cache for public product catalog listing with pagination, search, and filters.
     */
    public static final String PRODUCTS_CATALOG = "products:catalog";

    /**
     * Cache for public product detail views by product ID.
     */
    public static final String PRODUCT_DETAIL = "products:detail";

    /**
     * Cache for child product variants of a parent series by parent ID.
     */
    public static final String PRODUCT_CHILDREN = "products:children";

    /**
     * Cache for product image metadata and URLs by product ID.
     */
    public static final String PRODUCT_IMAGES = "products:images";

    /**
     * Cache for product content sections and specifications by product ID.
     */
    public static final String PRODUCT_SECTIONS = "products:sections";

    /**
     * Cache for the list of all categories.
     */
    public static final String CATEGORIES_LIST = "categories:list";

    /**
     * Cache for individual category details by category ID.
     */
    public static final String CATEGORY_DETAIL = "categories:detail";
}
