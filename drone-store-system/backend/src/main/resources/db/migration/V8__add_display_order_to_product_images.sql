-- Migration V8: Add display_order column and index to product_images table for multi-image ordering

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(product_id, display_order);
