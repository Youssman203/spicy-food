ALTER TABLE clients ADD COLUMN location VARCHAR(20) NOT NULL DEFAULT 'Lubumbashi' CHECK(location IN ('Lubumbashi','Kolwezi'));
CREATE TABLE customer_sessions (
 token_hash VARCHAR(64) PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customer_sessions_expiry ON customer_sessions(expires_at);
CREATE TABLE customer_verifications (
 phone VARCHAR(20) PRIMARY KEY, id UUID NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
 expires_at TIMESTAMPTZ NOT NULL, last_sent TIMESTAMPTZ NOT NULL DEFAULT now(),
 window_start TIMESTAMPTZ NOT NULL DEFAULT now(), send_count INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE orders ADD COLUMN status_history JSONB NOT NULL DEFAULT '[]'::jsonb;
UPDATE orders SET status_history=jsonb_build_array(jsonb_build_object('status',status,'at',created_at));
INSERT INTO site_settings(setting_key,setting_value) VALUES('tiktok_url','') ON CONFLICT(setting_key) DO NOTHING;
