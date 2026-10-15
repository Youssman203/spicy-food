-- A phone is now contact information, not proof of identity.
-- Keep existing sessions/orders; new registrations always get their own client id.
ALTER TABLE clients DROP CONSTRAINT clients_phone_key;
CREATE INDEX clients_phone_idx ON clients(phone);
DROP TABLE customer_verifications;
