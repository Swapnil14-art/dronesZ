# Drone Store System — Project Architecture & Implementation Specification

> **Strict Boundary Notice**: All new development for this project must reside strictly within this `/drone-store-system/` directory. The existing prebuilt drone website at the root level must remain untouched.

---

## 1. Project Overview

This project extends the existing drone-related website with a robust **Drone Store & Management System**.

The system includes:
- A public storefront interface with parent-child variant grouping and standalone item listings.
- Standardized JWT administrative authentication and secure CRUD management.
- Dynamic pricing, inventory tracking, and item availability states (`AVAILABLE`, `OUT_OF_STOCK`, `COMING_SOON`).
- Strict 3-tier product type system (`STANDALONE`, `PARENT`, `CHILD`).
- User authentication and customer account management (planned for Phase 5).

### Current Implementation & Specification Status

| Feature / Module | API / Entity Status | Implementation Phase |
| :--- | :--- | :--- |
| **Admin Authentication** | Standard Admin Path (`/api/auth/admin/login`) | Phase 1 (Completed & Verified) |
| **Admin Product APIs** | Implemented & Verified (3-Tier Types) | Phase 2 (Completed & Verified) |
| **Admin Category APIs** | Implemented & Verified | Phase 2 (Completed & Verified) |
| **Admin Dashboard UI** | Implemented & Verified | Phase 3 (Completed & Verified) |
| **Storefront & Public APIs** | Implemented & Verified (Parent/Standalone Only) | Phase 4 (Completed & Verified) |
| **User Authentication** | Customer Account Modal (Placeholder) | Phase 5 (Future Milestone) |

---

## 2. Dedicated Folder Architecture & Boundary Rules

To ensure a clear separation between the original prebuilt website and the new system, all implementation files exist within this directory:

```text
existing-project-root/
│
├── [existing-prebuilt-website-files]
├── style.css
│
└── drone-store-system/
    ├── project_readme.md
    ├── frontend/               # React (TypeScript & CSS) frontend for Admin/Store system
    └── backend/                # Java 8 / Spring Boot 2.7.18 REST API service
```

### Strict Isolation Rules
1. **Single Container**: All newly created or modified code files for this project must exist within `drone-store-system/`.
2. **No Scattering**: Do not add new files scattered throughout the root directory or existing website folders.
3. **No Unapproved Edits**: Do not modify, overwrite, delete, rename, move, or restructure any files outside of `drone-store-system/`.

---

## 3. Existing Website & Visual Design Reuse

The prebuilt website serves as the design and styling reference for the frontend components of the new system.

- **Visual Language Consistency**: Custom Vanilla CSS extensions inside `index.css` leverage existing design tokens (such as `--color-brand-red`, `--color-canvas`, and sleek typography) to maintain visual harmony across the web app.
- **No Unapproved Frameworks**: Native React + Vanilla CSS without third-party utility frameworks (Tailwind, Bootstrap).

---

## 4. Technology Stack

### Frontend
- **Framework & Language**: React, TypeScript, Vite
- **Styling**: Vanilla CSS, extending design tokens from the existing website styling (`style.css`).

### Backend
- **Framework & Language**: Java 8 / Spring Boot 2.7.18
- **Security**: Spring Security (JWT Bearer Token Authentication)
- **Data Access**: Spring Data JPA / Hibernate
- **API Standard**: RESTful JSON APIs

### Database
- **Database Engine**: PostgreSQL (Supabase Cloud Database)
- **Migration System**: Flyway version-controlled migrations (`V1` to `V4`)

---

## 5. Database Schema & Flyway Migrations

All database modifications are version-controlled using Flyway migration scripts located in `backend/src/main/resources/db/migration/`:

- `V1__create_admins_table.sql`: Creates `admins` entity table and default admin credentials.
- `V2__create_category_table.sql`: Creates legacy category structure.
- `V3__create_categories_and_products_tables.sql`: Establishes `categories` and `products` tables with foreign keys and index constraints.
- `V4__add_product_type.sql`: Adds `product_type` column (`STANDALONE`, `PARENT`, `CHILD`) and migrates existing rows.

---

## 6. Product Type System & Hierarchy Rules

The system enforces a strict 3-tier product type system:

1. **STANDALONE**: Independent product item (e.g. *Propeller X* or *FPV Frame*).
   - Must NOT have a `parentId`.
   - Displays price, quantity, and status on main public catalog and admin table.
2. **PARENT**: Represents a product series or variant category header (e.g. *Motors Series*).
   - Must NOT have a `parentId`.
   - Has NO price or quantity displayed on main storefront listings.
   - Clicking opens its parent-series page showing its associated model variants.
3. **CHILD**: Represents a specific model variant belonging to a `PARENT` product (e.g. *Motor 2207 1850KV*).
   - MUST reference a valid `PARENT` product ID via `parentId`.
   - Hidden from the main public store catalog view.
   - Displayed exclusively on its parent's product-series page.

### Hierarchy Validation Rules (Backend & Frontend)
- A `STANDALONE` product cannot have a `parentId`.
- A `PARENT` product cannot have a `parentId`.
- A `CHILD` product MUST have a `parentId` pointing to an existing `PARENT` product.
- A `CHILD` product CANNOT point to a `STANDALONE` or another `CHILD` product as its parent.
- Preventing circular references or orphan assignments.

---

## 7. Public Storefront Architecture

### Main Catalog View (`/api/products`)
- Lists ONLY `PARENT` and `STANDALONE` products.
- `CHILD` products are strictly filtered out from the main listing.
- Categories sorter/filter pills are removed from the main store page.
- Clean header with **Customer Sign In / Register** modal (zero admin URLs or login buttons exposed).

### Parent Series View (`/api/products/{parentId}/children`)
- Opened when a customer clicks **Explore Variant Series →** on a `PARENT` product card.
- Fetches and displays ONLY the child model variants belonging to that specific parent series.
- Displays each child product's image, name, description, price, quantity, and availability status.

---

## 8. Administrative Security & Gateway

- **Standard Admin Login Path**: `POST /api/auth/admin/login`
- **Admin Gateway URL**: Accessible via `http://localhost:3000/admin`
- **Authorization**: All `/api/admin/*` APIs require a valid JWT Bearer token with `ADMIN` authority header:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Administrative Portal Isolation**: Zero administrative links, buttons, or API paths are exposed on the public storefront.

---

## 9. API Endpoint Map

```text
Public Storefront APIs (Unauthenticated)
GET    /api/products                 --> Main storefront catalog (STANDALONE & PARENT products only)
GET    /api/products/{id}            --> Public single product details
GET    /api/products/{id}/children   --> Public child variants for parent series

Admin Authentication APIs
POST   /api/auth/admin/login        --> Admin Login (Returns JWT Bearer Token)
GET    /api/admin/me                 --> Fetch current admin profile

Admin Management APIs (JWT + ADMIN Role Required)
GET    /api/admin/categories         --> List all categories
POST   /api/admin/categories         --> Create category
PUT    /api/admin/categories/{id}    --> Update category
DELETE /api/admin/categories/{id}    --> Delete category (Blocked if products assigned)

GET    /api/admin/products           --> List products catalog (Supports pagination, search, status, type)
POST   /api/admin/products           --> Create product (STANDALONE, PARENT, or CHILD)
PUT    /api/admin/products/{id}      --> Update product & parent/category hierarchy
DELETE /api/admin/products/{id}      --> Delete product (Blocked if children exist)
```
