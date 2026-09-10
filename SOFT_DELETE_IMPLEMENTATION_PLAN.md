# Comprehensive Soft-Delete & Entity Lifecycle Implementation Specification

**Document Version:** 1.0.0  
**Target Project:** DronesZ E-Commerce Platform (Spring Boot Backend + React/TypeScript Frontend)  
**Status:** Approved Architectural Specification (Pre-Implementation Plan)

---

## 1. Executive Summary & Core Objectives

This document establishes the authoritative technical blueprint for implementing a robust, system-wide **Soft-Delete, Archive, and Restoration Lifecycle** across the DronesZ e-commerce platform.

### Primary Objectives:
1. **Preserve Data & Order Integrity**: Guarantee that historical transactions, order snapshots, user receipts, and audit trails remain 100% intact forever. No order or order item may ever be hard deleted or corrupted by lifecycle changes in products, categories, or user accounts.
2. **Products Lifecycle**: Utilize `ProductStatus.ARCHIVED` as the unified soft-delete mechanism for all product types (`STANDALONE`, `PARENT`, `CHILD`). Archive operations remove products from active browsing, searching, and cart purchases while preserving all relationships.
3. **Categories Lifecycle**: Add soft-delete flag (`is_deleted`, `deleted_at`) to categories, filtering them out of public stores while keeping existing product references intact.
4. **Users Lifecycle & Instant Auth Revocation**: Add soft-delete flag (`is_deleted`, `deleted_at`) to users. Soft-deleting a user immediately terminates authentication access, disables credentials, and preserves all user profile details, addresses, and order history.
5. **Orders & Order Items Immutable Retention**: Strictly enforce zero-delete policies on `orders` and `order_items` tables, repositories, and services.
6. **Parent-Child Product Hierarchy Safeguards**: Maintain clear integrity rules for multi-tier product variations so archiving a parent handles children gracefully, and restoring children requires valid parent hierarchy state.
7. **Admin Control & Visibility**: Provide toggleable "Include Archived / Deleted" filtering across admin management interfaces, along with dedicated "Restore" actions and a brand new **User Management** portal.

---

## 2. Current Architecture & Existing Delete Mechanisms

### 2.1 Current State Analysis

| Entity | Current Delete Mechanism | Database Constraint & Cascades | Issues / Risks |
| :--- | :--- | :--- | :--- |
| **Product** | Hard Delete: `ProductRepository.delete(product)` in `ProductService.deleteProduct(id)`. Blocked if child products exist (`productRepository.existsByParentId(id)`). | `parent_id REFERENCES products(id) ON DELETE RESTRICT`, `category_id REFERENCES categories(id) ON DELETE RESTRICT`. `product_images` and `product_content_sections` have `ON DELETE CASCADE`. `cart_items` has `ON DELETE CASCADE`. `order_items` has `ON DELETE SET NULL`. | Hard deleting a product sets `product_id = NULL` in `order_items`. While `order_items` stores snapshot title/price, losing the product row deletes image associations and prevents historical product drilldown. |
| **Category** | Hard Delete: `CategoryRepository.delete(category)` in `CategoryService.deleteCategory(id)`. Blocked if products reference it (`productRepository.existsByCategoryId(id)`). | `category_id REFERENCES categories(id) ON DELETE RESTRICT`. | Admin cannot remove a category without first migrating or deleting every single product in that category. No audit trail or restore capability exists. |
| **User** | No delete endpoint currently implemented in backend or frontend. Has `enabled` boolean flag in `users` table. | `orders.user_id REFERENCES users(id) ON DELETE CASCADE`! `carts.user_id REFERENCES users(id) ON DELETE CASCADE`. `user_addresses.user_id REFERENCES users(id) ON DELETE CASCADE`. | **CRITICAL DB RISK**: If a user row were ever deleted directly or via future code, Postgres `ON DELETE CASCADE` on `orders` would permanently obliterate all customer orders, transactions, and audit records! |
| **Order** | No delete endpoint. Read-only for users and admins. | `order_items.order_id REFERENCES orders(id) ON DELETE CASCADE`. | Correctly immutable at application layer, but needs explicit protection and documentation. |
| **OrderItem** | No delete endpoint. Snapshot record generated at checkout. | `order_items.product_id REFERENCES products(id) ON DELETE SET NULL`. | Immutable at application layer. |

### 2.2 Existing Database Migrations Overview

- **`V1__create_admin_table.sql`**: Admin authentication table.
- **`V2__seed_initial_admin.sql`**: Default admin account.
- **`V3__create_categories_and_products_tables.sql`**:
  - `categories` table with `name VARCHAR(100) NOT NULL UNIQUE`.
  - `products` table with `status VARCHAR(20) NOT NULL CHECK (status IN ('AVAILABLE', 'OUT_OF_STOCK', 'COMING_SOON'))`.
- **`V4__add_product_type.sql`**:
  - Added `product_type VARCHAR(20) NOT NULL DEFAULT 'STANDALONE' CHECK (product_type IN ('STANDALONE', 'PARENT', 'CHILD'))`.
  - Added `parent_id BIGINT NULL REFERENCES products(id) ON DELETE RESTRICT`.
- **`V5__add_user_auth_cart_checkout_orders.sql`**:
  - `users`: `id`, `full_name`, `email` (UNIQUE), `password_hash`, `phone`, `role`, `enabled`, `created_at`, `updated_at`.
  - `user_addresses`: `user_id BIGINT REFERENCES users(id) ON DELETE CASCADE`.
  - `carts`: `user_id BIGINT REFERENCES users(id) ON DELETE CASCADE`.
  - `cart_items`: `cart_id REFERENCES carts(id) ON DELETE CASCADE`, `product_id REFERENCES products(id) ON DELETE CASCADE`.
  - `orders`: `user_id BIGINT REFERENCES users(id) ON DELETE CASCADE` *(soft-delete prevents cascade)*.
  - `order_items`: `order_id REFERENCES orders(id) ON DELETE CASCADE`, `product_id REFERENCES products(id) ON DELETE SET NULL`. Snapshot columns: `product_name`, `price`, `quantity`, `subtotal`.
- **`V6__optimize_product_images_bytea.sql`** & **`V8__add_display_order_to_product_images.sql`**: Product image management.
- **`V7__add_product_details_and_content_sections.sql`**: Technical specifications and dynamic content sections with `product_id REFERENCES products(id) ON DELETE CASCADE`.
- **`V9__cleanup_duplicate_cart_items.sql`**: Cart item uniqueness constraint.

---

## 3. Required Soft-Delete & Lifecycle Design

```
+----------------------------------------------------------------------------------------------------+
|                                    LIFECYCLE STATE MACHINE                                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ PRODUCT ]                                                                                       |
|     AVAILABLE / OUT_OF_STOCK / COMING_SOON  <======== (Restore) ========>  ARCHIVED (Soft-Deleted)   |
|     (Visible in public catalog & searches)                                 (Hidden from public)    |
|                                                                            (Visible in Admin)      |
|                                                                                                    |
|  [ CATEGORY ]                                                                                      |
|     is_deleted = false  <==================== (Restore) ================>  is_deleted = true       |
|     (Publicly selectable)                                                  (Hidden from store)     |
|                                                                            (Products retained)     |
|                                                                                                    |
|  [ USER ]                                                                                          |
|     is_deleted = false, enabled = true  <==== (Restore) ================>  is_deleted = true       |
|     (Can log in, checkout, manage profile)                                 enabled = false         |
|                                                                            (Auth immediately blocked)
|                                                                            (Orders 100% preserved) |
|                                                                                                    |
|  [ ORDER & ORDER ITEMS ]                                                                           |
|     PERMANENT & IMMUTABLE (Never Deleted, Never Soft-Deleted)                                      |
+----------------------------------------------------------------------------------------------------+
```

### 3.1 Products Soft-Delete Specification
1. **Status Enum Value**: Use `ProductStatus.ARCHIVED`.
   - Update Java enum `ProductStatus { AVAILABLE, OUT_OF_STOCK, COMING_SOON, ARCHIVED }`.
   - Update database check constraint `chk_products_status` to include `'ARCHIVED'`.
2. **Soft Delete Action (Archive)**:
   - Endpoint: `DELETE /api/admin/products/{id}` or `PUT /api/admin/products/{id}/archive`.
   - Action: Updates `product.status = ProductStatus.ARCHIVED`.
   - Does **NOT** delete DB row, images, or content sections.
   - Cleans up active cart items containing this product across all user carts to prevent checkout of archived items.
   - Evicts product and category caches via `CacheEvictionService`.
3. **Restore Action**:
   - Endpoint: `PUT /api/admin/products/{id}/restore`.
   - Action: Checks stock quantity:
     - If `product.quantity > 0` or `product.productType == PARENT`: sets status to `AVAILABLE`.
     - If `product.quantity <= 0`: sets status to `OUT_OF_STOCK`.
   - Parent validation: If product is a `CHILD`, verifies whether the parent product is archived. If parent is archived, restoration requires either restoring the parent first or unlinking/reassigning parent.
4. **Public Store & Search Query Filtering**:
   - Public product queries (`/api/products`, `/api/products/category/{id}`, `/api/products/search`) MUST exclude `ARCHIVED` products:
     ```sql
     WHERE p.status != 'ARCHIVED' AND p.status IN ('AVAILABLE', 'OUT_OF_STOCK', 'COMING_SOON')
     ```
   - Direct detail lookup (`/api/products/{id}`): Returns HTTP 404 for public users if product status is `ARCHIVED`.
   - Child variations lookup (`/api/products/{id}/children`): Returns only non-archived children for public views.

### 3.2 Categories Soft-Delete Specification
1. **Schema Extension**:
   - Add `is_deleted BOOLEAN NOT NULL DEFAULT FALSE` to `categories` table.
   - Add `deleted_at TIMESTAMP NULL` to `categories` table.
   - Add composite/partial index: `CREATE INDEX idx_categories_active ON categories(is_deleted) WHERE is_deleted = FALSE;`.
2. **Category Soft Delete Action**:
   - Endpoint: `DELETE /api/admin/categories/{id}`.
   - Action: Updates `category.is_deleted = TRUE` and `category.deleted_at = LocalDateTime.now()`.
   - DB record is preserved.
   - Products assigned to this category keep their `category_id` (so historical data and admin categorization are maintained), but public category navigation filters out the soft-deleted category.
3. **Category Restore Action**:
   - Endpoint: `PUT /api/admin/categories/{id}/restore`.
   - Action: Sets `category.is_deleted = FALSE` and `category.deleted_at = NULL`.
   - Checks for name uniqueness against currently active categories to avoid duplicate active names.
4. **Category Uniqueness Rule**:
   - In database / application logic: Active category names must be unique (`WHERE is_deleted = FALSE`). If an admin creates a new category with the same name as a soft-deleted one, it either renames/restores the old one or allows uniqueness across active categories.
5. **Public Category Query Filtering**:
   - Public endpoint (`GET /api/categories`): Returns only categories where `is_deleted = FALSE`.
   - Public category product listing (`GET /api/products/category/{id}`): Returns 404 if category `is_deleted = TRUE`.

### 3.3 Users Soft-Delete & Security Specification
1. **Schema Extension**:
   - Add `is_deleted BOOLEAN NOT NULL DEFAULT FALSE` to `users` table.
   - Add `deleted_at TIMESTAMP NULL` to `users` table.
2. **User Soft Delete Action (Admin)**:
   - Endpoint: `DELETE /api/admin/users/{id}`.
   - Action: Sets `user.is_deleted = TRUE`, `user.enabled = FALSE`, and `user.deleted_at = LocalDateTime.now()`.
   - Clears user's active shopping cart items (`cart_items`).
   - Does **NOT** delete `orders`, `order_items`, `user_addresses`, or the `users` record.
3. **User Restore Action (Admin)**:
   - Endpoint: `PUT /api/admin/users/{id}/restore`.
   - Action: Sets `user.is_deleted = FALSE`, `user.enabled = TRUE`, and `user.deleted_at = NULL`.
4. **Authentication & Authorization Blocking**:
   - `UserService.loginUser()`:
     ```java
     if (Boolean.TRUE.equals(user.getIsDeleted()) || !Boolean.TRUE.equals(user.getEnabled())) {
         throw new BusinessRuleException("This account has been deactivated or deleted. Please contact support.");
     }
     ```
   - `JwtAuthenticationFilter`: When validating incoming requests with JWT, if the token belongs to a soft-deleted or disabled user, reject with HTTP 401/403.
   - `UserService.registerUser()`: Prevent registering with an email belonging to an active user. If a soft-deleted account exists with that email, display a friendly message directing them to contact support or reactivate.

### 3.4 Orders & Order Items Immutable Integrity
1. **Zero-Delete Enforcement**:
   - No `DELETE` endpoints for `orders` or `order_items` in any controller (`AdminOrderController`, `UserOrderController`, etc.).
   - No `delete()` or `deleteAll()` methods exposed in `OrderService`.
2. **Historical Order Display Guarantee**:
   - `order_items` preserves snapshot data (`product_name`, `price`, `quantity`, `subtotal`).
   - If a product is later `ARCHIVED`, order detail views continue displaying the historical snapshot name and pricing.
   - If a user is soft-deleted, admin order management can still query and render customer order records using the retained `user_id` and customer profile.

---

## 4. Product Hierarchy (Parent → Child) Lifecycle Rules

Multi-tier products (e.g., a drone platform as `PARENT` with motor/KV options as `CHILD` products) must adhere to rigorous hierarchical lifecycle rules:

```
                  +--------------------------------+
                  |     PARENT PRODUCT (Drone)     |
                  +---------------+----------------+
                                  |
               +------------------+------------------+
               |                                     |
+--------------v---------------+      +--------------v---------------+
|    CHILD PRODUCT (1850KV)    |      |    CHILD PRODUCT (2450KV)    |
+------------------------------+      +------------------------------+
```

### Hierarchy Rules:
1. **Archiving a CHILD Product**:
   - Allowed independently at any time.
   - Child's status becomes `ARCHIVED`.
   - The child option is immediately removed from the parent's product detail page variation selector in the public store.
   - Parent product and sibling child products remain active and unaffected.
2. **Archiving a PARENT Product**:
   - Option A (Recommended): Cascade archive all active child products associated with this parent, logging the cascade action.
   - Option B: If children are active, prompt the admin or automatically transition all child products to `ARCHIVED`.
   - Both parent and children are hidden from the public catalog.
3. **Restoring a CHILD Product**:
   - If parent is active (`status != ARCHIVED`): Child can be restored to `AVAILABLE` (or `OUT_OF_STOCK`).
   - If parent is `ARCHIVED`: System blocks restoration with a descriptive validation error: *"Cannot restore child product while its parent product '[Parent Name]' is archived. Please restore the parent product first."*
4. **Restoring a PARENT Product**:
   - Restoring a parent product sets the parent to `AVAILABLE`.
   - Children remain `ARCHIVED` until individually restored, or admin can select "Restore Parent and All Variations".
5. **Historical Orders Impact**:
   - Historical orders reference individual child product IDs or parent product IDs in `order_items`. Because records are never hard deleted, order lookup and receipt generation remain 100% operational.

---

## 5. Detailed Inventory of Files to Modify & Create

### 5.1 Database Migrations (Backend)

#### [NEW] `V10__add_soft_delete_and_archived_status.sql`
- **Path**: `drone-store-system/backend/src/main/resources/db/migration/V10__add_soft_delete_and_archived_status.sql`
- **Purpose**:
  1. Drop existing product status check constraint `chk_products_status` (or inline check constraint from `V3`) and recreate with `CHECK (status IN ('AVAILABLE', 'OUT_OF_STOCK', 'COMING_SOON', 'ARCHIVED'))`.
  2. Add `is_deleted BOOLEAN NOT NULL DEFAULT FALSE` and `deleted_at TIMESTAMP NULL` to `categories` table.
  3. Add `is_deleted BOOLEAN NOT NULL DEFAULT FALSE` and `deleted_at TIMESTAMP NULL` to `users` table.
  4. Create performance indexes for filtered queries:
     - `CREATE INDEX idx_products_status ON products(status);`
     - `CREATE INDEX idx_categories_is_deleted ON categories(is_deleted);`
     - `CREATE INDEX idx_users_is_deleted ON users(is_deleted);`

---

### 5.2 Backend Entities & Enums

#### [MODIFY] `ProductStatus.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/entity/ProductStatus.java`
- **Changes**: Add `ARCHIVED` enum constant.
```java
package com.dronestore.system.entity;

public enum ProductStatus {
    AVAILABLE,
    OUT_OF_STOCK,
    COMING_SOON,
    ARCHIVED
}
```

#### [MODIFY] `Category.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/entity/Category.java`
- **Changes**:
  - Add `@Column(name = "is_deleted", nullable = false) private Boolean isDeleted = false;`
  - Add `@Column(name = "deleted_at") private LocalDateTime deletedAt;`
  - Add getters, setters, and pre-persist default initialization.

#### [MODIFY] `User.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/entity/User.java`
- **Changes**:
  - Add `@Column(name = "is_deleted", nullable = false) private Boolean isDeleted = false;`
  - Add `@Column(name = "deleted_at") private LocalDateTime deletedAt;`
  - Add getters and setters.

---

### 5.3 Backend DTOs

#### [MODIFY] `CategoryDto.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/dto/CategoryDto.java`
- **Changes**: Add `Boolean isDeleted` and `LocalDateTime deletedAt` fields and constructor arguments.

#### [MODIFY] `UserDto.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/dto/UserDto.java`
- **Changes**: Add `Boolean enabled`, `Boolean isDeleted`, `LocalDateTime deletedAt`, `LocalDateTime updatedAt` fields.

#### [NEW] `AdminUserFilterRequest.java` / [MODIFY] `ProductFilterRequest.java`
- **Purpose**: Support query parameters `includeDeleted`, `keyword`, `role`, pagination, etc.

---

### 5.4 Backend Repositories

#### [MODIFY] `ProductRepository.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/repository/ProductRepository.java`
- **Changes**:
  - Add `List<Product> findByStatusNot(ProductStatus status);`
  - Add `List<Product> findByCategoryIdAndStatusNot(Long categoryId, ProductStatus status);`
  - Add `List<Product> findByParentIdAndStatusNot(Long parentId, ProductStatus status);`
  - Add `boolean existsByCategoryIdAndStatusNot(Long categoryId, ProductStatus status);`
  - Add `boolean existsByParentIdAndStatusNot(Long parentId, ProductStatus status);`

#### [MODIFY] `CategoryRepository.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/repository/CategoryRepository.java`
- **Changes**:
  - Add `List<Category> findByIsDeletedFalse();`
  - Add `Optional<Category> findByIdAndIsDeletedFalse(Long id);`
  - Add `boolean existsByNameIgnoreCaseAndIsDeletedFalse(String name);`
  - Add `boolean existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(String name, Long id);`

#### [MODIFY] `UserRepository.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/repository/UserRepository.java`
- **Changes**:
  - Add `List<User> findByIsDeletedFalse();`
  - Add `List<User> findAll();` (for admin view with `includeDeleted=true`)
  - Add `Optional<User> findByEmailIgnoreCaseAndIsDeletedFalse(String email);`
  - Add `boolean existsByEmailIgnoreCaseAndIsDeletedFalse(String email);`

---

### 5.5 Backend Services

#### [MODIFY] `ProductService.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/service/ProductService.java`
- **Replace Hard Delete with Archive**:
  ```java
  @Transactional
  public void archiveProduct(Long id) {
      Product product = productRepository.findById(id)
              .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));
      
      product.setStatus(ProductStatus.ARCHIVED);
      productRepository.save(product);

      // If parent product, archive all active children
      if (product.getProductType() == ProductType.PARENT) {
          List<Product> children = productRepository.findByParentId(id);
          for (Product child : children) {
              child.setStatus(ProductStatus.ARCHIVED);
              productRepository.save(child);
              cacheEvictionService.evictProductComplete(child.getId(), id);
          }
      }

      Long parentId = product.getParent() != null ? product.getParent().getId() : null;
      cacheEvictionService.evictProductComplete(id, parentId);
  }
  ```
- **Add Restore Method**:
  ```java
  @Transactional
  public ProductDto restoreProduct(Long id) {
      Product product = productRepository.findById(id)
              .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));

      if (product.getStatus() != ProductStatus.ARCHIVED) {
          throw new BusinessRuleException("Product is not archived.");
      }

      // Check parent constraint if child
      if (product.getProductType() == ProductType.CHILD && product.getParent() != null) {
          if (product.getParent().getStatus() == ProductStatus.ARCHIVED) {
              throw new BusinessRuleException("Cannot restore variation while parent product '" 
                      + product.getParent().getName() + "' is archived. Please restore parent first.");
          }
      }

      // Restore status based on quantity
      if (product.getProductType() == ProductType.PARENT || (product.getQuantity() != null && product.getQuantity() > 0)) {
          product.setStatus(ProductStatus.AVAILABLE);
      } else {
          product.setStatus(ProductStatus.OUT_OF_STOCK);
      }

      Product saved = productRepository.save(product);
      Long parentId = product.getParent() != null ? product.getParent().getId() : null;
      cacheEvictionService.evictProductComplete(id, parentId);
      return mapToDto(saved, false);
  }
  ```
- **Update Admin Product List**: Add `includeArchived` boolean parameter to `getAllAdminProducts(boolean includeArchived)`.
- **Update Public Queries**: Ensure all public methods filter out `ProductStatus.ARCHIVED`.

#### [MODIFY] `CategoryService.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/service/CategoryService.java`
- **Replace Hard Delete with Soft Delete**:
  ```java
  @Transactional
  public void deleteCategory(Long id) {
      Category category = categoryRepository.findById(id)
              .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + id + " not found"));

      category.setIsDeleted(true);
      category.setDeletedAt(LocalDateTime.now());
      categoryRepository.save(category);
      cacheEvictionService.evictCategoryComplete(id);
  }
  ```
- **Add Restore Method**:
  ```java
  @Transactional
  public CategoryDto restoreCategory(Long id) {
      Category category = categoryRepository.findById(id)
              .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + id + " not found"));

      if (!Boolean.TRUE.equals(category.getIsDeleted())) {
          throw new BusinessRuleException("Category is not deleted.");
      }

      if (categoryRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(category.getName(), id)) {
          throw new ResourceConflictException("An active category with name '" + category.getName() + "' already exists.");
      }

      category.setIsDeleted(false);
      category.setDeletedAt(null);
      Category saved = categoryRepository.save(category);
      cacheEvictionService.evictCategoryComplete(id);
      return mapToDto(saved);
  }
  ```
- **Update `getAllCategories`**: Admin can pass `includeDeleted=true`; public controller calls method with `includeDeleted=false`.

#### [MODIFY] `UserService.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/service/UserService.java`
- **Add Admin Management Methods**:
  - `List<UserDto> getAllUsers(boolean includeDeleted)`
  - `UserDto softDeleteUser(Long id)`: sets `isDeleted = true`, `enabled = false`, `deletedAt = now()`.
  - `UserDto restoreUser(Long id)`: sets `isDeleted = false`, `enabled = true`, `deletedAt = null`.
  - `UserDto toggleUserStatus(Long id, boolean enabled)`: activates / disables user login without soft deleting.
- **Update `loginUser()` & `registerUser()`**: Block soft-deleted users with explicit business rule exceptions.

#### [MODIFY] `CartService.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/service/CartService.java`
- **Validation**: Verify that products added to cart or retrieved in existing carts are not `ProductStatus.ARCHIVED`. Automatically sanitize cart if an item becomes archived.

---

### 5.6 Backend Controllers

#### [MODIFY] `AdminProductController.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/controller/AdminProductController.java`
- **Endpoints**:
  - `GET /api/admin/products?includeArchived=true|false`: Support filtering.
  - `DELETE /api/admin/products/{id}`: Maps to `productService.archiveProduct(id)`.
  - `PUT /api/admin/products/{id}/restore`: Maps to `productService.restoreProduct(id)`.

#### [MODIFY] `AdminCategoryController.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/controller/AdminCategoryController.java`
- **Endpoints**:
  - `GET /api/admin/categories?includeDeleted=true|false`: Support filtering.
  - `DELETE /api/admin/categories/{id}`: Maps to `categoryService.deleteCategory(id)` (soft delete).
  - `PUT /api/admin/categories/{id}/restore`: Maps to `categoryService.restoreCategory(id)`.

#### [NEW] `AdminUserController.java`
- **Path**: `drone-store-system/backend/src/main/java/com/dronestore/system/controller/AdminUserController.java`
- **Endpoints**:
  - `GET /api/admin/users?includeDeleted=true|false&keyword=...`: Returns list of all registered users.
  - `GET /api/admin/users/{id}`: Returns user profile, order statistics, and status.
  - `DELETE /api/admin/users/{id}`: Soft deletes user and disables account.
  - `PUT /api/admin/users/{id}/restore`: Restores soft-deleted user.
  - `PUT /api/admin/users/{id}/status?enabled=true|false`: Toggles enabled state.

---

### 5.7 Frontend Services & State Management

#### [MODIFY] `store/services/api.ts`
- **Updates**:
  - Add `'ARCHIVED'` to `ProductStatus` type: `export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'COMING_SOON' | 'ARCHIVED';`
  - Update `CategoryDto` to include `isDeleted?: boolean; deletedAt?: string;`
  - Update `UserDto` to include `enabled?: boolean; isDeleted?: boolean; deletedAt?: string;`
  - Add API client methods:
    - `archiveProduct(token, id)` / `restoreProduct(token, id)`
    - `fetchAdminProducts(token, includeArchived?: boolean)`
    - `fetchAdminCategories(token, includeDeleted?: boolean)`
    - `deleteCategory(token, id)` (soft delete) / `restoreCategory(token, id)`
    - `fetchAdminUsers(token, includeDeleted?: boolean, keyword?: string)`
    - `softDeleteUser(token, id)`
    - `restoreUser(token, id)`
    - `toggleUserEnabled(token, id, enabled)`

---

### 5.8 Frontend Components & Pages

#### [MODIFY] `store/components/ProductManagement.tsx`
- **Changes**:
  - Replace red "Delete" button with "Archive" action.
  - Add "Include Archived" toggle switch / checkbox in the top filter bar.
  - For archived products in the table:
    - Display an **ARCHIVED** badge (`#64748b` slate gray).
    - Render a green **Restore** button (`↺ Restore`).
    - Disable direct public viewing link for archived items.
  - Show confirmation modal: *"Are you sure you want to archive this product? It will be hidden from the store, but all past orders will be preserved."*

#### [MODIFY] `store/components/CategoryManagement.tsx`
- **Changes**:
  - Replace "Delete" with "Soft Delete (Deactivate)".
  - Add "Include Deleted Categories" toggle filter.
  - For deleted categories:
    - Display **DELETED** status badge.
    - Render **Restore** action button.
  - Confirmation modal explains that products in this category will not be lost.

#### [NEW] `store/components/UserManagement.tsx`
- **Purpose**: Brand new administrative interface for user accounts.
- **Features**:
  - Table columns: ID, Full Name, Email, Phone, Role, Status (`ACTIVE`, `DISABLED`, `DELETED`), Created At, Actions.
  - Search by Name or Email.
  - "Include Deleted Users" toggle filter.
  - Action buttons:
    - **Disable / Enable**: Immediate toggle of login access.
    - **Soft Delete**: Marks user as deleted and disables login.
    - **Restore**: Restores deleted user.
    - **View Orders**: Link to view orders associated with this user.

#### [MODIFY] `store/pages/ProtectedAdminDashboard.tsx`
- **Changes**:
  - Add new `'users'` tab to `TabType = 'overview' | 'products' | 'categories' | 'users';`
  - Add navigation item in sidebar: `Users` with icon.
  - Render `<UserManagement token={token} />` when active tab is `'users'`.

#### [MODIFY] `store/pages/PublicStore.tsx` & `store/pages/CartPage.tsx`
- Ensure client-side guards prevent interacting with or purchasing archived products.

---

## 6. Edge Cases, Validations, and Error Handling

| Scenario | Handled Behavior | Error / HTTP Code |
| :--- | :--- | :--- |
| **Archiving a Parent with Active Children** | Automatically cascades archive to all child variations, with detailed notification to admin. | HTTP 200 OK with cascade summary. |
| **Restoring a Child when Parent is Archived** | Blocked with descriptive error: *"Cannot restore variation while parent product is archived."* | HTTP 400 Bad Request / BusinessRuleException. |
| **Creating a Category with Name of Deleted Category** | Option to restore existing category or reactivate and update description. | Informative prompt or clean reactivation. |
| **Soft-deleted User Attempts Login** | Login rejected with clear message: *"This account has been deactivated. Please contact support."* | HTTP 400 / 401 BusinessRuleException. |
| **Soft-deleted User Registers Again** | Registration rejected with message: *"An account with this email was previously registered. Please contact support to reactivate your account."* | HTTP 400 BusinessRuleException. |
| **Historical Order Lookup for Archived Product** | Order detail renders snapshot name, unit price, quantity, and subtotal without error. Product thumbnail falls back to placeholder if image was unlinked. | HTTP 200 OK. |
| **Admin Restores Product with Quantity 0** | Product status is automatically restored to `OUT_OF_STOCK` instead of `AVAILABLE`. | HTTP 200 OK. |
| **Admin Restores Product with Quantity > 0** | Product status is restored to `AVAILABLE`. | HTTP 200 OK. |

---

## 7. Step-by-Step Implementation Sequence

To ensure zero downtime and complete backwards compatibility, the implementation must proceed in the following strict dependency order:

```
Step 1: Database Migration (V10)
   └── Apply check constraint changes and add is_deleted / deleted_at columns.

Step 2: Backend Entities & Repositories
   └── Update ProductStatus enum, Category, User entities, and repository queries.

Step 3: Backend Services & Cache Eviction
   └── Implement archive/restore logic in ProductService, CategoryService, UserService, CartService.

Step 4: Backend Controllers & Security
   └── Update AdminProductController, AdminCategoryController, create AdminUserController.

Step 5: Frontend API Client (api.ts)
   └── Add types, restore endpoints, and User management API methods.

Step 6: Frontend Admin Components
   └── Update ProductManagement.tsx, CategoryManagement.tsx with Archive/Restore & filters.

Step 7: Frontend User Management & Dashboard
   └── Create UserManagement.tsx and register in ProtectedAdminDashboard.tsx.

Step 8: End-to-End Verification & Testing
   └── Verify product archive/restore, parent-child cascade, user auth blocking, and order history retention.
```

---

## 8. Summary of Architectural Guarantees

1. **NO Hard Deletes**: Database records for Products, Categories, Users, Orders, and Order Items are never destroyed during normal operations.
2. **NO Broken Orders**: Historical orders maintain 100% data integrity with snapshots and valid foreign keys.
3. **Instant Auth Revocation**: Soft-deleted or disabled users cannot authenticate or generate valid sessions.
4. **Intuitive Admin UX**: Clear visual badges, safety confirmation dialogs, restore controls, and toggleable filters keep the administration experience clean and reliable.
