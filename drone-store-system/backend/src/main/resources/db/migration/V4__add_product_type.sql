-- Migration V4: Add product_type column to products table and update existing records

-- 1. Add column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'STANDALONE';

-- 2. Update existing rows based on hierarchy logic:
UPDATE products SET product_type = 'STANDALONE' WHERE product_type IS NULL;

-- 3. Products with a parent_id are CHILD products
UPDATE products SET product_type = 'CHILD' WHERE parent_id IS NOT NULL;

-- 4. Products that act as a parent (referenced by parent_id) are PARENT products
UPDATE products SET product_type = 'PARENT' WHERE id IN (SELECT DISTINCT parent_id FROM products WHERE parent_id IS NOT NULL);

-- 5. Enforce NOT NULL and CHECK constraints
ALTER TABLE products ALTER COLUMN product_type SET NOT NULL;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_product_type'
    ) THEN 
        ALTER TABLE products ADD CONSTRAINT chk_products_product_type CHECK (product_type IN ('STANDALONE', 'PARENT', 'CHILD'));
    END IF; 
END $$;

-- 6. Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
