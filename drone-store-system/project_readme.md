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

### Current Milestone Scope
The **current implementation phase is strictly limited to Admin-side Authentication**.
- User authentication is **not** to be implemented in this phase.
- Product catalog and store management features are **not** to be implemented until explicitly requested.
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

## 9. Initial Admin API Specification

### Endpoint
`POST /api/auth/admin/login`

### Request Body
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

### Success Response (200 OK)
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

### Error Responses & Handling
- **400 Bad Request**: Missing or malformed credentials.
- **401 Unauthorized**: Invalid email/password combination, expired JWT, or invalid JWT signature.
- **403 Forbidden**: Inactive/disabled admin account or insufficient permissions.
- **Information Leak Protection**: Error responses must be generic (e.g., "Invalid email or password") to prevent username enumeration. Password hashes and JWT secrets must never appear in responses or server logs.

---

## 10. Admin Database Entity Model

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

## 11. Future Product Architecture (Specification Only — Do Not Implement Yet)

The product catalog architecture must support both **hierarchical (parent-child)** and **standalone** products.

### Categories & Relationships
1. **Hierarchical Products**: Products that belong under a parent category or motor/frame series.
   - *Example*: `Motors` -> `Motor Model A`, `Motor Model B`.
2. **Standalone Products**: Independent products requiring no parent.
   - *Example*: `Drone Frame X`.

### Product Entity Model Draft
```text
Product Entity
├── id          : BigInt / UUID (Primary Key)
├── name        : String (Not Null)
├── description : Text
├── price       : BigDecimal (Not Null, Scale: 2)
├── quantity    : Integer (Not Null, Default: 0)
├── status      : Enum (AVAILABLE, OUT_OF_STOCK, COMING_SOON)
├── parentId    : BigInt / UUID (Nullable, Self-referential FK)
├── category    : String
├── image       : String (URL / Asset path)
├── createdAt   : Timestamp
└── updatedAt   : Timestamp
```

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

## 13. Mandatory Security Rules

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

## 14. Backend Layered Architecture

Backend code should maintain a clean, layered RESTful architecture:

```text
HTTP Request
     │
     ▼
Controller Layer (`/api/auth/**`, `/api/admin/**`, `/api/products/**`)
     │ (Maps HTTP requests, validates DTO inputs)
     ▼
Service Layer
     │ (Implements core business logic, hashing, JWT generation)
     ▼
Repository Layer (Spring Data JPA)
     │ (Database abstractions & queries)
     ▼
Database (PostgreSQL)
```

- **Separation of Concerns**: Keep Spring Security configuration classes isolated from business service logic.
- **REST Conventions**: Use standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) and standard status codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`).

---

## 15. Frontend Architecture & Auth Redirection

```text
Admin Login Page
      │ (Submits credentials to backend)
      ▼
Authentication State Manager
      │ (Stores JWT in memory / secure storage)
      ▼
Protected Admin Dashboard Route
```

- **Client Guarding**: Unauthenticated users attempting to access `/admin/*` routes must be automatically redirected to `/admin/login`.
- **Backend Priority**: Client routing guards are UX enhancements; backend API token validation is the true security gate.

---

## 16. Development Roadmap / Phase Breakdown

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

### Phase 3 — Product Management (Future)
- Product CRUD operations (Create, Read, Update, Delete).
- Parent-child hierarchy management & standalone product options.
- Inventory quantity, pricing, and availability status controls.

### Phase 4 — Storefront (Future)
- Public product catalog, category tree, product details page.
- Availability status UI badges ("Available", "Out of Stock", "Coming Soon").

### Phase 5 — User Authentication (Future)
- Customer registration, login, profile management, and `USER` role authorization.

---

## 17. Version Control & Change Process Rules

1. **Directory Boundary**: All newly created implementation files must remain inside `/drone-store-system/`.
2. **External Modification Protocol**: Before modifying any pre-existing files outside `/drone-store-system/`:
   - **Step 1**: Pause implementation.
   - **Step 2**: Provide clear technical reasoning for the required modification.
   - **Step 3**: Await explicit user approval before making the modification.
3. **No Hidden Edits**: Never make unannounced modifications to original template/website files.

---

## 18. Core Implementation Principles

1. **Security First**: Absolute protection of credentials, tokens, and backend boundaries.
2. **Maintainability & Clean Architecture**: Strict separation of concerns (Controller, Service, Repository).
3. **Clear Boundary**: Total decoupling between existing prebuilt website files and new `/drone-store-system/` code.
4. **Forward Compatibility**: Clean design to allow seamless addition of future product features and user authentication without breaking changes.
5. **Design Language Continuity**: Reusing visual tokens from the existing `style.css` for a cohesive look and feel.
