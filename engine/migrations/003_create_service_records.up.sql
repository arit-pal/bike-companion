-- 003_create_service_records
CREATE TABLE service_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id             UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
    service_interval_id UUID REFERENCES service_intervals(id) ON DELETE SET NULL,
    date_performed      DATE NOT NULL,
    mileage_at_service  INT  NOT NULL CHECK (mileage_at_service >= 0),
    cost                NUMERIC(10,2) CHECK (cost IS NULL OR cost >= 0),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_records_bike_id ON service_records (bike_id);
CREATE INDEX idx_service_records_interval_id ON service_records (service_interval_id);
CREATE INDEX idx_service_records_date ON service_records (date_performed DESC);
