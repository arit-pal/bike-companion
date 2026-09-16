-- 002_create_service_intervals
CREATE TABLE service_intervals (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id           UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    interval_miles    INT  NOT NULL CHECK (interval_miles > 0),
    interval_days     INT  CHECK (interval_days IS NULL OR interval_days > 0),
    last_done_mileage INT  NOT NULL DEFAULT 0 CHECK (last_done_mileage >= 0),
    last_done_date    DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bike_id, name)
);

CREATE INDEX idx_service_intervals_bike_id ON service_intervals (bike_id);

CREATE TRIGGER trg_service_intervals_updated_at
BEFORE UPDATE ON service_intervals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
