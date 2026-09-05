-- Migration V7: Add dynamic product details and product content sections (WORD and EXCEL boxes)

-- 1. Add dynamic product attributes to products table
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS dispatch_time VARCHAR(100) DEFAULT '24-48 Hours',
    ADD COLUMN IF NOT EXISTS warranty VARCHAR(100) DEFAULT '1-Yr Factory',
    ADD COLUMN IF NOT EXISTS grade VARCHAR(100) DEFAULT 'Aero Precision',
    ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS tax_note VARCHAR(150) DEFAULT 'GST & Taxes Included';

-- Ensure existing rows have non-null default values
UPDATE products SET dispatch_time = '24-48 Hours' WHERE dispatch_time IS NULL;
UPDATE products SET warranty = '1-Yr Factory' WHERE warranty IS NULL;
UPDATE products SET grade = 'Aero Precision' WHERE grade IS NULL;
UPDATE products SET tax_inclusive = TRUE WHERE tax_inclusive IS NULL;
UPDATE products SET tax_note = 'GST & Taxes Included' WHERE tax_note IS NULL;

-- 2. Create product_content_sections table for dynamic WORD and EXCEL boxes
CREATE TABLE IF NOT EXISTS product_content_sections (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('WORD', 'EXCEL')),
    content TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance and ordering indexes
CREATE INDEX IF NOT EXISTS idx_product_content_sections_product_id ON product_content_sections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_content_sections_order ON product_content_sections(product_id, display_order);
