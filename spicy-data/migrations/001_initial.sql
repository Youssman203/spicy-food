CREATE TABLE admins (
 id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL CHECK(role IN ('admin','super_admin')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE clients (
 id SERIAL PRIMARY KEY, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL,
 phone VARCHAR(20) NOT NULL UNIQUE, address TEXT,
 order_count INTEGER NOT NULL DEFAULT 0 CHECK(order_count >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE menu_items (
 id SERIAL PRIMARY KEY, seed_key VARCHAR(100) UNIQUE,
 name VARCHAR(120) NOT NULL, description TEXT NOT NULL DEFAULT '', price NUMERIC(12,2) NOT NULL CHECK(price > 0),
 category VARCHAR(20) NOT NULL CHECK(category IN ('tacos','sandwichs','combos','boissons')),
 image_url TEXT NOT NULL DEFAULT '', spiciness_level VARCHAR(10) NOT NULL CHECK(spiciness_level IN ('Doux','Moyen','Fiery')),
 is_available BOOLEAN NOT NULL DEFAULT true,
 variants JSONB NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(variants) = 'array'),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE orders (
 id SERIAL PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id),
 total_amount NUMERIC(12,2) NOT NULL CHECK(total_amount > 0),
 status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','preparing','completed','cancelled')),
 order_details JSONB NOT NULL, delivery_address TEXT NOT NULL CHECK(length(trim(delivery_address)) >= 5),
 location VARCHAR(20) NOT NULL CHECK(location IN ('Lubumbashi','Kolwezi')),
 request_key UUID NOT NULL UNIQUE, request_hash VARCHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_idx ON orders(created_at DESC);
CREATE INDEX orders_client_idx ON orders(client_id);
CREATE TABLE site_settings (
 id SERIAL PRIMARY KEY, setting_key VARCHAR(80) NOT NULL UNIQUE,
 setting_value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE admin_sessions (
 id UUID PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
 audience VARCHAR(20) NOT NULL CHECK(audience IN ('admin','superadmin')),
 csrf_token VARCHAR(64) NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX admin_sessions_expiry_idx ON admin_sessions(expires_at);
