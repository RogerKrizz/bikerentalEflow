-- V3: Device management (smart locks)

CREATE TABLE device (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id   VARCHAR(100) NOT NULL,
    bike_id     UUID         REFERENCES bike(id) ON DELETE SET NULL,
    transport   VARCHAR(20)  NOT NULL DEFAULT 'SIMULATOR'
                CHECK (transport IN ('SIMULATOR', 'HTTP', 'MQTT')),
    address     VARCHAR(255),
    online      BOOLEAN      NOT NULL DEFAULT FALSE,
    last_seen   TIMESTAMPTZ,
    secret      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_device_device_id UNIQUE (device_id),
    CONSTRAINT uk_device_bike     UNIQUE (bike_id)
);

CREATE TABLE device_command (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id    UUID         NOT NULL REFERENCES device(id) ON DELETE CASCADE,
    command_id   VARCHAR(100) NOT NULL,
    command_type VARCHAR(20)  NOT NULL
                 CHECK (command_type IN ('UNLOCK', 'LOCK', 'STATUS')),
    status       VARCHAR(20)  NOT NULL DEFAULT 'SENT'
                 CHECK (status IN ('SENT', 'ACKED', 'FAILED', 'TIMED_OUT')),
    payload      JSONB,
    ack_payload  JSONB,
    sent_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    acked_at     TIMESTAMPTZ,
    timeout_at   TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uk_device_command_id UNIQUE (command_id)
);

CREATE TABLE device_telemetry (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id     UUID        NOT NULL REFERENCES device(id) ON DELETE CASCADE,
    battery_level INT,
    lock_state    VARCHAR(20) CHECK (lock_state IN ('LOCKED', 'UNLOCKED')),
    online        BOOLEAN     NOT NULL DEFAULT TRUE,
    reported_at   TIMESTAMPTZ NOT NULL,
    received_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_command_device_status ON device_command (device_id, status);
CREATE INDEX idx_device_telemetry_device      ON device_telemetry (device_id, received_at DESC);
CREATE INDEX idx_device_bike                  ON device (bike_id);
