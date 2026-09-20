-- Migration: V1__create_admin_table.sql
-- Description: Create Admin table with indexes, constraints, and timestamps for authentication

CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_admins_email UNIQUE (email)
);

-- Index on email for fast authentication query lookup
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Index on role for access checks
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Comment documentation for database schema clarity
COMMENT ON TABLE admins IS 'Stores administrative accounts for store management and authorization';
COMMENT ON COLUMN admins.id IS 'Primary key auto-incrementing identifier';
COMMENT ON COLUMN admins.email IS 'Unique email address / username used for admin login';
COMMENT ON COLUMN admins.password_hash IS 'Secure one-way Argon2id password digest';
COMMENT ON COLUMN admins.role IS 'Role specification for RBAC (Default: ADMIN)';
COMMENT ON COLUMN admins.enabled IS 'Account active status flag';
