-- V4: Rides and ride events (state machine)

CREATE TABLE ride (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID         NOT NULL REFERENCES student(id),
    bike_id          UUID         NOT NULL REFERENCES bike(id),
    start_stand_id   UUID         NOT NULL REFERENCES stand(id),
    end_stand_id     UUID         REFERENCES stand(id),
    state            VARCHAR(30)  NOT NULL DEFAULT 'PENDING_UNLOCK'
                     CHECK (state IN (
                         'PENDING_UNLOCK', 'ACTIVE', 'TEMPORARILY_LOCKED',
                         'PENDING_RETURN', 'COMPLETED', 'FAILED', 'CANCELLED'
                     )),
    idempotency_key  VARCHAR(100) NOT NULL,
    started_at       TIMESTAMPTZ,
    ended_at         TIMESTAMPTZ,
    start_lat        NUMERIC(10,7),
    start_lng        NUMERIC(10,7),
    end_lat          NUMERIC(10,7),
    end_lng          NUMERIC(10,7),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_ride_idempotency UNIQUE (idempotency_key)
);

-- Partial unique index: at most one non-terminal ride per student
CREATE UNIQUE INDEX idx_ride_active_student ON ride (student_id)
    WHERE state NOT IN ('COMPLETED', 'FAILED', 'CANCELLED');

-- Partial unique index: at most one non-terminal ride per bike
CREATE UNIQUE INDEX idx_ride_active_bike ON ride (bike_id)
    WHERE state NOT IN ('COMPLETED', 'FAILED', 'CANCELLED');

CREATE INDEX idx_ride_student_state ON ride (student_id, state);
CREATE INDEX idx_ride_bike_state    ON ride (bike_id, state);

CREATE TABLE ride_event (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id     UUID         NOT NULL REFERENCES ride(id) ON DELETE CASCADE,
    from_state  VARCHAR(30),
    to_state    VARCHAR(30)  NOT NULL,
    trigger     VARCHAR(100) NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_ride_event_ride ON ride_event (ride_id, created_at);
