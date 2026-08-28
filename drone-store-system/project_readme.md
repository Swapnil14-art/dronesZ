# Drone Store System — Project Architecture & Implementation Specification

> **Strict Boundary Notice**: All new development for this project must reside strictly within this `/drone-store-system/` directory. The existing prebuilt drone website at the root level must remain untouched.

---

## 1. Project Overview

This project extends the existing drone-related website with a robust **Drone Store & Management System**.

The complete system will eventually include:
- A public store and product storefront interface.
- Admin authentication and administrative store controls.
- User authentication and customer account management (future phase).
- Hierarchical and standalone product catalog management.
- Inventory quantity management, dynamic pricing, and item availability states.

### Current Implementation & Specification Status

| Feature / Module | API / Entity Status | Implementation Phase |
| :--- | :--- | :--- |
| **Admin Authentication** | Implemented & Verified | Phase 1 (Completed) |
| **Admin Product APIs** | Implemented & Verified | Phase 2 (Completed) |
| **Admin Category APIs** | Implemented & Verified | Phase 2 (Completed) |
| **Storefront & Public APIs** | Future Specification | Phase 4 (Future Phase) |
| **User Authentication** | Future Specification | Phase 5 (Future Phase) |

- User authentication is **not** to be implemented in this phase.
- Product catalog and category APIs documented herein are **planned specifications** for future implementation.
- The architectural design must remain flexible and forward-compatible for future phases.

---

## 2. Dedicated Folder Architecture & Boundary Rules

To ensure a clear separation between the original prebuilt website and the new system, all new implementation files must be created within this directory:

```text
existing-project-root/
│
├── [existing-prebuilt-website-files]
├── style.css
│
└── drone-store-system/
    ├── project_readme.md
    ├── frontend/               # TypeScript & CSS frontend for Admin/Store system
    └── backend/                # Java Spring Boot REST API service
```

### Strict Isolation Rules
1. **Single Container**: All newly created or modified code files for this project must exist within `drone-store-system/`.
2. **No Scattering**: Do not add new files scattered throughout the root directory or existing website folders.
3. **No Unapproved Edits**: Do not modify, overwrite, delete, rename, move, or restructure any files outside of `drone-store-system/`.

---

## 3. Existing Website & Visual Design Reuse

The prebuilt website serves as the design and styling reference for the frontend components of the new system.

- **Visual Language Consistency**: When frontend development begins, inspect and reuse existing styles (specifically referencing the root `style.css` and existing design tokens) to maintain visual harmony across the web app.
- **No Unapproved CSS Frameworks**: Do not introduce third-party CSS frameworks (e.g., Tailwind, Bootstrap, Material UI) unless explicitly authorized. Use Vanilla CSS / custom styling consistent with the existing codebase.

---

## 4. Technology Stack

### Frontend
- **Language**: TypeScript
- **Styling**: Vanilla CSS, leveraging and extending design tokens from the existing website styling (`style.css`).

### Backend
- **Language**: Java (JDK 17+)
- **Framework**: Spring Boot
- **Security**: Spring Security (JWT-based statutory authentication)
- **Data Access**: Spring Data JPA / Hibernate
- **API Standard**: RESTful JSON APIs

### Database
- **Database Engine**: PostgreSQL
- **Migration System**: Flyway (version-controlled schema migrations)

---

## 5. Database Direction & Schema Management

- **Engine**: PostgreSQL (relational database).
- **Environment Strategy**:
  - **Local Development**: Local PostgreSQL instance.
  - **Production Hosting**: Serverless / Managed PostgreSQL (e.g., Neon or Supabase PostgreSQL).
- **Vendor Agnosticism**: The architecture must remain standard ANSI SQL / PostgreSQL compliant without coupling to provider-specific features.
- **Migration Enforcement**:
  - All database schema creation and modifications must be managed via version-controlled Flyway scripts (`V1__...sql`, `V2__...sql`).
  - Manual modifications to production or local databases without migrations are strictly forbidden.
- **Credential Protection**: Database connection strings, passwords, and secrets must never be exposed to the frontend or committed to source control.

---

## 6. Authentication Architecture (Admin Authentication Scope)

### Scope
- **Phase 1 Target**: Admin Authentication ONLY.
- **Future Extensibility**: The authentication model must cleanly accommodate customer/user accounts (`USER` role) in subsequent phases without refactoring core security filters or JWT mechanics.

### JWT Flow Specification

```text
Admin Login Page (Frontend)
       │
       │ POST /api/auth/admin/login { email, password }
       ▼
Spring Boot Backend API
       │
       ├── 1. Locate Admin entity by email/username
       ├── 2. Verify password hash using BCrypt / Argon2id
       ├── 3. Confirm account status (enabled == true)
       └── 4. Generate signed JWT token containing Admin claims & roles
       │
       ▼
Frontend Application
       │
       └── Store JWT securely & attach to protected admin requests:
           Header: Authorization: Bearer <JWT>
```

### Security Enforcement
- Token validation must be handled automatically by a Spring Security Filter (`OncePerRequestFilter`).
- Individual controllers must **not** perform redundant manual authentication logic; security boundaries must be enforced via Spring Security configuration and role checking (`@PreAuthorize` / `hasRole('ADMIN')`).

---

## 7. Password Security & Storage

- **Zero Plaintext**: Passwords must **NEVER** be stored or logged in plaintext.
- **No Reversible Encryption**: Reversible encryption algorithms (e.g., AES) are strictly prohibited for passwords.
- **Secure Password Hashing**:
  - **Preferred**: Argon2id
  - **Standard Alternative**: BCrypt (via Spring Security `PasswordEncoder`)
- **Server-Side Hashing**: Password hashing must be performed strictly on the backend before persisting to the database.

---

## 8. Role-Based Authorization Model

- **Initial Role**: `ADMIN`
- **Future Roles**: `USER`, `MANAGER` (extensible enum/table design)
- **Protected Endpoint Rule**: All `/api/admin/**` endpoints require valid JWT authentication with the `ADMIN` authority.

---

## 9. Admin Database Entity Model

```text
Admin Entity
├── id           : BigInt / UUID (Primary Key, Auto-generated)
├── email        : String (Unique, Not Null, Indexed)
├── passwordHash : String (Not Null)
├── role         : Enum / String ("ADMIN", Not Null)
├── enabled      : Boolean (Default: true, Not Null)
├── createdAt    : Timestamp (Auto-set on creation, Not Null)
└── updatedAt    : Timestamp (Auto-set on update, Not Null)
```

- **Uniqueness Constraint**: Unique index on `email` at the database level.
- **Field Naming**: The field is named `passwordHash` to explicitly document that it stores hashed digest data.

---

## 10. Data Models: Product & Category Architecture

The product catalog architecture supports both **hierarchical (parent-child)** and **standalone** products, linked to stable store categories.

### Category Entity Model
```text
Category Entity
├── id          : BigInt / UUID (Primary Key, Auto-generated)
├── name        : String (Unique, Not Null, Length: 1-100)
├── description : Text (Nullable)
├── createdAt   : Timestamp (Auto-set on creation, Not Null)
└── updatedAt   : Timestamp (Auto-set on update, Not Null)
```

### Product Entity Model
```text
Product Entity
├── id          : BigInt / UUID (Primary Key, Auto-generated)
├── name        : String (Not Null, Length: 1-255)
├── description : Text (Nullable)
├── price       : BigDecimal (Not Null, Precision: 10, Scale: 2)
├── quantity    : Integer (Not Null, Default: 0)
├── status      : Enum (AVAILABLE, OUT_OF_STOCK, COMING_SOON, Not Null)
├── parentId    : BigInt / UUID (Nullable, Self-referential Foreign Key)
├── categoryId  : BigInt / UUID (Nullable / Foreign Key to Category Entity)
├── image       : String (Nullable, Asset Path / Image URL)
├── createdAt   : Timestamp (Auto-set on creation, Not Null)
└── updatedAt   : Timestamp (Auto-set on update, Not Null)
```

---

## 11. Category & Product Relationship Rules

### Category vs. Product Hierarchy Distinction
Two independent relationships exist in the domain model and must not be confused:

1. **Category Assignment (`categoryId`)**:
   - Categorizes products into logical store sections (e.g., *Motors, Frames, Propellers, ESCs, Flight Controllers, Batteries, Accessories*).
   - Foreign key relationship targeting `Category.id`.
   - String category names must **never** be hardcoded inside product records.

2. **Product Hierarchy (`parentId`)**:
   - Represents parent-child variants or product series relationships:
     - *Standalone Product*: `parentId` is `null` (e.g., *Drone Frame X*).
     - *Child Variant Product*: `parentId` points to a parent Product ID (e.g., *Motors* parent -> *Motor Model A*, *Motor Model B*).

---

## 12. Product Availability & Inventory Rules

### Product Availability States
Products must explicitly track availability using a 3-state enum:
1. `AVAILABLE` ("Available")
2. `OUT_OF_STOCK` ("Out of Stock")
3. `COMING_SOON` ("Coming Soon")

> **Constraint**: Do not simplify availability to a boolean flag (e.g., `isAvailable`).

### Quantity vs. Availability Decoupling
Inventory quantity and availability status must operate as distinct fields:
- `quantity = 0` + `status = OUT_OF_STOCK` (Product is currently sold out).
- `quantity = 0` + `status = COMING_SOON` (Product is announced but not yet released).
- Administrators can manually override and control `quantity`, `price`, and `status` independently.

---

## 13. Comprehensive API Specifications

All protected admin endpoints require authentication header:
```http
Authorization: Bearer <JWT>
```
and `ADMIN` role permission.

```text
Admin Authentication & Management Endpoint Map

POST   /api/auth/admin/login         --> Admin Authentication (Login & JWT issuance)

GET    /api/admin/categories         --> List all categories
POST   /api/admin/categories         --> Create category
GET    /api/admin/categories/{id}    --> Get single category details
PUT    /api/admin/categories/{id}    --> Update category
DELETE /api/admin/categories/{id}    --> Delete category (Blocked if products assigned)

GET    /api/admin/products           --> List products (Supports pagination, search & filtering)
POST   /api/admin/products           --> Create product (Standalone or Child variant)
GET    /api/admin/products/{id}      --> Get single product details
PUT    /api/admin/products/{id}      --> Update product & parent/category relationship
DELETE /api/admin/products/{id}      --> Delete product (Blocked if children exist)
```

---

### 13.1 Admin Authentication API

#### Endpoint
`POST /api/auth/admin/login`

#### Request Body
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "admin": {
    "id": 1,
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

---

### 13.2 Admin Category APIs

#### GET `/api/admin/categories`
Returns all store categories.
- **Status**: `200 OK`
- **Response**:
```json
[
  {
    "id": 1,
    "name": "Motors",
    "description": "Brushless and brushed drone motors",
    "createdAt": "2026-08-28T10:00:00Z",
    "updatedAt": "2026-08-28T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Frames",
    "description": "Carbon fiber drone frames",
    "createdAt": "2026-08-28T10:05:00Z",
    "updatedAt": "2026-08-28T10:05:00Z"
  }
]
```

#### POST `/api/admin/categories`
Creates a new category.
- **Status**: `201 Created`
- **Validation**:
  - `name`: Required, non-blank, max 100 chars, must be unique (case-insensitive).
- **Request**:
```json
{
  "name": "Propellers",
  "description": "2-blade and 3-blade propellers"
}
```
- **Response**: `201 Created` with created Category object.
- **Error**: `409 Conflict` if duplicate category name exists.

#### GET `/api/admin/categories/{id}`
Fetches details of a specific category by ID.
- **Status**: `200 OK`
- **Error**: `404 Not Found` if category ID does not exist.

#### PUT `/api/admin/categories/{id}`
Updates an existing category.
- **Status**: `200 OK`
- **Validation**: Name uniqueness check excluding current category ID.
- **Request**:
```json
{
  "name": "FPV Propellers",
  "description": "High performance racing and freestyle props"
}
```
- **Error**: `404 Not Found` if ID does not exist, `409 Conflict` if target name duplicates another existing category.

#### DELETE `/api/admin/categories/{id}`
Deletes a category.
- **Status**: `204 No Content`
- **Safety Boundary & Deletion Rule**:
  > **Strict Constraint**: A category cannot be deleted while products are assigned to it (`categoryId == id`).
- **Error**: Returns `409 Conflict` if products are linked to the category. The administrator must reassign or remove products first. No silent cascade deletion or orphan category references allowed.

---

### 13.3 Admin Product APIs

#### GET `/api/admin/products`
Retrieves products for the administration interface. Designed with query parameters to support filtering and pagination seamlessly without breaking changes:
- **Query Parameters**:
  - `page` (default: 0)
  - `size` (default: 20)
  - `search` (optional string search in name/description)
  - `status` (optional enum filter: `AVAILABLE`, `OUT_OF_STOCK`, `COMING_SOON`)
  - `categoryId` (optional filter by Category ID)
  - `parentId` (optional filter by Parent Product ID)
  - `sortBy` (default: `createdAt`)
  - `sortDir` (default: `desc`)
- **Status**: `200 OK`
- **Response**:
```json
{
  "content": [
    {
      "id": 10,
      "name": "Motor Model A",
      "description": "High KV racing motor",
      "price": 1499.00,
      "quantity": 20,
      "status": "AVAILABLE",
      "parentId": 1,
      "categoryId": 1,
      "image": "/assets/products/motor-a.jpg",
      "createdAt": "2026-08-28T11:00:00Z",
      "updatedAt": "2026-08-28T11:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

#### POST `/api/admin/products`
Creates a new standalone or child product.
- **Status**: `201 Created`
- **Request**:
```json
{
  "name": "Motor Model A",
  "description": "High KV brushless motor",
  "price": 1499.00,
  "quantity": 20,
  "status": "AVAILABLE",
  "parentId": 1,
  "categoryId": 1,
  "image": "/assets/products/motor-a.jpg"
}
```
- **Validation Rules**:
  - `name`: Required, non-blank, max 255 chars.
  - `price`: Required, non-negative decimal (`>= 0.00`).
  - `quantity`: Required, non-negative integer (`>= 0`).
  - `status`: Required valid enum (`AVAILABLE`, `OUT_OF_STOCK`, `COMING_SOON`).
  - `categoryId`: Optional, must reference existing Category ID if provided.
  - `parentId`: Optional. If specified, backend must validate:
    1. Referenced parent product exists (`404 Not Found`).
    2. Parent product itself is not a child (limit hierarchy depth to prevent deep tree complexities).

#### GET `/api/admin/products/{id}`
Fetches full details of a specific product by ID.
- **Status**: `200 OK`
- **Error**: `404 Not Found` if product ID does not exist.

#### PUT `/api/admin/products/{id}`
Updates an existing product.
- **Status**: `200 OK`
- **Hierarchy Validation Rules**:
  - Target product must exist (`404 Not Found`).
  - Self-parenting check: `parentId` cannot equal target product's `id`.
  - Circular hierarchy prevention: Cannot set `parentId` to an ID that is currently a direct or indirect child of this product.
  - Category existence check if `categoryId` is changed.

#### DELETE `/api/admin/products/{id}`
Deletes a product.
- **Status**: `204 No Content`
- **Safety Boundary & Deletion Rule**:
  > **Strict Constraint**: A parent product cannot be deleted while child products still reference it (`parentId == id`).
- **Error**: Returns `409 Conflict` if child products reference this item. The administrator must delete or reassign child products first. Silent cascade deletion of products is strictly forbidden.

---

## 14. Standardized Error Response Format

All APIs must utilize a standardized JSON error format across all endpoints:

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Cannot delete product ID 1 because 3 child products are associated with it. Reassign or delete child products first.",
  "timestamp": "2026-08-28T13:45:00Z"
}
```

### Standard HTTP Status Code Map

| HTTP Code | Condition / Meaning |
| :--- | :--- |
| **`200 OK`** | Successful retrieval, modification, or authentication request. |
| **`201 Created`** | Successful creation of a new Category or Product resource. |
| **`204 No Content`** | Successful deletion of a resource. |
| **`400 Bad Request`** | Validation failure (e.g. negative price, blank name, invalid status enum). |
| **`401 Unauthorized`** | Missing, expired, or invalid JWT bearer token. |
| **`403 Forbidden`** | Authenticated user lacks `ADMIN` authority. |
| **`404 Not Found`** | Resource (Product/Category ID or Parent ID) does not exist. |
| **`409 Conflict`** | Business rule conflict (e.g. deleting parent with children, category with products, or duplicate category name). |

---

## 15. API Versioning & Separation Strategy

### Path Boundary Separation
Admin administrative APIs are explicitly isolated under the `/api/admin/` prefix:
- **Admin Endpoints**: `/api/admin/products`, `/api/admin/categories` (Requires JWT & `ADMIN` role).
- **Authentication Endpoints**: `/api/auth/admin/login` (Public authentication entry point).
- **Future Public Endpoints**: `/api/products`, `/api/categories` (Read-only public storefront APIs to be created in Phase 4).

### API Versioning Decision
No URL versioning prefix (e.g., `/v1/`) is introduced at this stage to keep REST paths clean and straightforward while maintaining separation between Admin security boundaries and future public storefront endpoints.

---

## 16. Mandatory Security Rules

All implementation code must adhere strictly to the following 16 security rules:

1. **No Secrets in Code**: Never commit passwords, API keys, or JWT signing secrets to Git.
2. **No Hardcoded JWT Secrets**: JWT signing keys must be loaded from environment variables or secure configuration.
3. **No Hardcoded DB Passwords**: Database connection credentials must use externalized configuration.
4. **Sanitized APIs**: Never return password hashes, salt, or secrets in API responses.
5. **No Password Logging**: Never print or log user passwords in plaintext.
6. **No Secret Logging**: Never log JWT secret keys or bearer tokens.
7. **Authentication Input Validation**: Validate and sanitize login payloads (email format, non-empty fields).
8. **API Payload Validation**: Enforce strict data validation on all controller entry points.
9. **Enforce HTTPS**: Production traffic must mandate TLS/HTTPS.
10. **Appropriate JWT Expiration**: Set reasonable expiration times (e.g., 24 hours for admin sessions).
11. **Standardized Security Responses**: Standardize HTTP 401 Unauthorized and 403 Forbidden handling.
12. **Server-Side Authority**: Security and authorization logic must remain strictly on the backend server.
13. **Never Trust Frontend**: Client-side state is for UX only; backend must independently validate JWT on every protected request.
14. **Endpoint Enforcement**: Annotate and protect all administrative REST endpoints with Spring Security permissions.
15. **Secure Configuration Management**: Utilize `.env` / environment variables for application configuration.
16. **Generic Error Messages**: Prevent account enumeration by providing uniform authentication failure messages.

---

## 17. Backend Layered Architecture

Backend code should maintain a clean, layered RESTful architecture:

```text
HTTP Request
     │
     ▼
Controller Layer (`/api/auth/**`, `/api/admin/**`)
     │ (Maps HTTP requests, validates DTO inputs)
     ▼
Service Layer
     │ (Implements core business logic, validation, hashing, JWT generation)
     ▼
Repository Layer (Spring Data JPA)
     │ (Database abstractions & queries)
     ▼
Database (PostgreSQL)
```

- **Separation of Concerns**: Keep Spring Security configuration classes isolated from business service logic.
- **REST Conventions**: Use standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) and standard status codes (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`).

---

## 18. Frontend Architecture & Auth Redirection

```text
Admin Login Page
      │ (Submits credentials to backend)
      ▼
Authentication State Manager
      │ (Stores JWT in memory / secure storage)
      ▼
Protected Admin Dashboard Route (/admin/*)
```

- **Client Guarding**: Unauthenticated users attempting to access `/admin/*` routes must be automatically redirected to `/admin/login`.
- **Backend Priority**: Client routing guards are UX enhancements; backend API token validation is the true security gate.

---

## 19. Development Roadmap / Phase Breakdown

### Phase 1 — Admin Authentication (CURRENT MILESTONE)
- Setup backend project structure inside `drone-store-system/backend/`.
- Establish PostgreSQL connection and Flyway migrations for `Admin` table.
- Implement `Admin` entity, `AdminRepository`, and `PasswordEncoder` (Argon2id/BCrypt).
- Implement Admin Login API (`POST /api/auth/admin/login`).
- Implement JWT token generator and Spring Security filter chain.
- Create Admin Login frontend in `drone-store-system/frontend/`.
- Implement client token storage, session state handling, and protected route redirect.

### Phase 2 — Admin Dashboard (Future)
- Admin dashboard shell and navigation layout.
- Admin management utilities.

### Phase 3 — Category & Product Management (Planned Specification)
- Category CRUD operations (`/api/admin/categories`).
- Product CRUD operations (`/api/admin/products`).
- Parent-child hierarchy validation & standalone product options.
- Inventory quantity, pricing, and availability status controls.

### Phase 4 — Storefront (Future)
- Public product catalog, category tree, product details page (`/api/products`, `/api/categories`).
- Availability status UI badges ("Available", "Out of Stock", "Coming Soon").

### Phase 5 — User Authentication (Future)
- Customer registration, login, profile management, and `USER` role authorization.

---

## 20. Version Control & Change Process Rules

1. **Directory Boundary**: All newly created implementation files must remain inside `/drone-store-system/`.
2. **External Modification Protocol**: Before modifying any pre-existing files outside `/drone-store-system/`:
   - **Step 1**: Pause implementation.
   - **Step 2**: Provide clear technical reasoning for the required modification.
   - **Step 3**: Await explicit user approval before making the modification.
3. **No Hidden Edits**: Never make unannounced modifications to original template/website files.

---

## 21. Core Implementation Principles

1. **Security First**: Absolute protection of credentials, tokens, and backend boundaries.
2. **Maintainability & Clean Architecture**: Strict separation of concerns (Controller, Service, Repository).
3. **Clear Boundary**: Total decoupling between existing prebuilt website files and new `/drone-store-system/` code.
4. **Forward Compatibility**: Clean design to allow seamless addition of future product features and user authentication without breaking changes.
5. **Design Language Continuity**: Reusing visual tokens from the existing `style.css` for a cohesive look and feel.
