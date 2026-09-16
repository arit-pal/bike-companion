-- 004_create_users_and_link_bikes
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Link bikes to users (owner). Nullable for existing rows, then backfilled.
ALTER TABLE bikes
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN category TEXT,
    ADD COLUMN vin TEXT;

CREATE INDEX idx_bikes_user_id ON bikes (user_id);
