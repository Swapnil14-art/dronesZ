-- Migration V12: Safely remove categories, orders, and order_items tables
-- 1. Remove products.category_id foreign key constraint and column
-- 2. Drop categories table and related index
-- 3. Drop order_items table and related indexes
-- 4. Drop orders table and related indexes

-- Step 1: Drop foreign key constraint on products(category_id)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'products'
          AND kcu.column_name = 'category_id'
    ) LOOP
        EXECUTE 'ALTER TABLE products DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Drop index on products.category_id
DROP INDEX IF EXISTS idx_products_category_id;

-- Drop category_id column from products
ALTER TABLE products DROP COLUMN IF EXISTS category_id;

-- Step 2: Drop categories table and its indexes
DROP INDEX IF EXISTS idx_categories_is_deleted;
DROP TABLE IF EXISTS categories;

-- Step 3: Drop order_items table and its indexes
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP TABLE IF EXISTS order_items;

-- Step 4: Drop orders table and its indexes
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_order_number;
DROP TABLE IF EXISTS orders;
