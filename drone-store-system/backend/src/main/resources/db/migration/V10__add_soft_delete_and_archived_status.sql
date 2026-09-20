-- Migration V10: Comprehensive Soft-Delete & Entity Lifecycle Support
-- 1. Support 'ARCHIVED' in product status
-- 2. Add is_deleted and deleted_at columns to categories and users
-- 3. Protect orders from CASCADE DELETE on users
-- 4. Create performance indexes for soft-delete queries

-- Step 1: Update products status check constraint to include 'ARCHIVED'
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_status'
    ) THEN 
        ALTER TABLE products DROP CONSTRAINT chk_products_status;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_status_check'
    ) THEN 
        ALTER TABLE products DROP CONSTRAINT products_status_check;
    END IF;

    ALTER TABLE products ADD CONSTRAINT chk_products_status 
        CHECK (status IN ('AVAILABLE', 'OUT_OF_STOCK', 'COMING_SOON', 'ARCHIVED'));
END $$;

-- Step 2: Add soft delete columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITHOUT TIME ZONE;

-- Step 3: Add soft delete columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITHOUT TIME ZONE;

-- Step 4: Protect orders from accidental cascading deletion when a user is modified
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;
        ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Step 5: Performance indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_categories_is_deleted ON categories(is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
