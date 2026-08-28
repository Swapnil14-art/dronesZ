-- Seed initial admin user if no admins exist in Supabase database
-- Initial Admin Email: admin@example.com
-- Initial Admin Password Hash (Argon2id for: AdminPassword123!)

INSERT INTO admins (email, password_hash, role, enabled, created_at, updated_at)
SELECT 'admin@example.com', '$argon2id$v=19$m=65536,t=3,p=1$74fOshm+z0Hj28xI1S6n8A$q+pB00h6h9V7W5o5A4V5w+n3K8u7I6O5P4Q3R2S1T0U', 'ADMIN', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE email = 'admin@example.com');
