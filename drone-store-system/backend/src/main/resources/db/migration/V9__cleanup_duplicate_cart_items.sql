-- Migration V9: Clean up any duplicate cart_items rows and ensure unique constraint exists.
-- This script is designed to be run manually since Flyway is disabled.
-- It is idempotent and safe to run multiple times.

-- Step 1: Merge duplicate cart_items rows.
-- For each (cart_id, product_id) group with multiple rows, keep the one with the lowest id,
-- sum up all quantities (capped at the product's inventory), and delete the extras.

-- First, update the "keeper" row (the one with the lowest id) with the summed quantity
UPDATE cart_items ci
SET quantity = merged.total_qty,
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT
        cart_id,
        product_id,
        MIN(id) AS keeper_id,
        LEAST(
            SUM(quantity),
            COALESCE((SELECT p.quantity FROM products p WHERE p.id = cart_items.product_id), 999999)
        ) AS total_qty
    FROM cart_items
    GROUP BY cart_id, product_id
    HAVING COUNT(*) > 1
) merged
WHERE ci.id = merged.keeper_id;

-- Step 2: Delete all duplicate rows that are not the "keeper"
DELETE FROM cart_items
WHERE id NOT IN (
    SELECT MIN(id)
    FROM cart_items
    GROUP BY cart_id, product_id
)
AND (cart_id, product_id) IN (
    SELECT cart_id, product_id
    FROM cart_items
    GROUP BY cart_id, product_id
    HAVING COUNT(*) > 1
);

-- Step 3: Ensure the unique constraint exists (idempotent — will no-op if already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uk_cart_product'
    ) THEN
        ALTER TABLE cart_items ADD CONSTRAINT uk_cart_product UNIQUE (cart_id, product_id);
    END IF;
END $$;
