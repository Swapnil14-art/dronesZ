-- Migration: Add is_add_to_cart_enabled column to products table
-- Default to TRUE for all existing and newly created products

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_add_to_cart_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Explicitly ensure all existing rows have true
UPDATE products 
SET is_add_to_cart_enabled = TRUE 
WHERE is_add_to_cart_enabled IS NULL;
