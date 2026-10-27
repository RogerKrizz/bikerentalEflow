-- V2: Stands and bikes

CREATE TABLE stand (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(255) NOT NULL,
    latitude             NUMERIC(10,7) NOT NULL,
    longitude            NUMERIC(10,7) NOT NULL,
    capacity             INT           NOT NULL DEFAULT 10,
    return_radius_meters NUMERIC(6,1)  NOT NULL DEFAULT 40.0,
    active               BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uk_stand_name UNIQUE (name)
);

CREATE TABLE bike (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code       VARCHAR(100) NOT NULL,
    stand_id      UUID         REFERENCES stand(id) ON DELETE SET NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE'
                  CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE')),
    battery_level INT          NOT NULL DEFAULT 100
                  CHECK (battery_level BETWEEN 0 AND 100),
    lock_state    VARCHAR(20)  NOT NULL DEFAULT 'LOCKED'
                  CHECK (lock_state IN ('LOCKED', 'UNLOCKED', 'UNKNOWN')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_bike_qr_code UNIQUE (qr_code)
);

CREATE INDEX idx_bike_stand_status ON bike (stand_id, status);
