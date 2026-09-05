-- Migration V6: Optimize product images with BYTEA storage, is_primary flag, and CASCADE constraints

CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_data BYTEA NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
    file_name VARCHAR(255),
    file_size BIGINT,
    content_hash VARCHAR(64),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance index for rapid product image lookup
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Enforce single primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_product_image ON product_images(product_id) WHERE is_primary = TRUE;
