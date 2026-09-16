-- 001_create_bikes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE bikes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make             TEXT NOT NULL,
    model            TEXT NOT NULL,
    year             INT  NOT NULL CHECK (year >= 1960 AND year <= 2100),
    nickname         TEXT,
    current_mileage  INT  NOT NULL DEFAULT 0 CHECK (current_mileage >= 0),
    purchase_date    DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bikes_created_at ON bikes (created_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bikes_updated_at
BEFORE UPDATE ON bikes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
