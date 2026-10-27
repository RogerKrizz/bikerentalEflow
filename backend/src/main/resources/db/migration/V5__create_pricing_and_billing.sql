-- V5: Pricing policy, invoices, payments, and account charges

CREATE TABLE pricing_policy (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    base_fare       NUMERIC(10,2) NOT NULL,
    per_minute_rate NUMERIC(10,2) NOT NULL,
    minimum_charge  NUMERIC(10,2) NOT NULL,
    grace_minutes   INT           NOT NULL DEFAULT 5,
    late_return_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'INR',
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    effective_from  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE invoice (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id           UUID          NOT NULL REFERENCES ride(id),
    student_id        UUID          NOT NULL REFERENCES student(id),
    invoice_number    VARCHAR(50)   NOT NULL,
    base_fare         NUMERIC(10,2) NOT NULL,
    duration_minutes  NUMERIC(10,2) NOT NULL,
    per_minute_charge NUMERIC(10,2) NOT NULL,
    late_fee          NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount      NUMERIC(10,2) NOT NULL,
    currency          VARCHAR(3)    NOT NULL DEFAULT 'INR',
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uk_invoice_ride    UNIQUE (ride_id),
    CONSTRAINT uk_invoice_number  UNIQUE (invoice_number)
);

CREATE TABLE payment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID          NOT NULL REFERENCES invoice(id),
    student_id      UUID          NOT NULL REFERENCES student(id),
    idempotency_key VARCHAR(100)  NOT NULL,
    amount          NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'INR',
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    provider        VARCHAR(30)   NOT NULL DEFAULT 'MOCK',
    provider_ref    VARCHAR(255),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uk_payment_idempotency UNIQUE (idempotency_key)
);

CREATE TABLE account_charge (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID          NOT NULL REFERENCES student(id),
    ride_id     UUID          REFERENCES ride(id),
    charge_type VARCHAR(30)   NOT NULL
                CHECK (charge_type IN ('FINE', 'DAMAGE', 'LATE_RETURN')),
    amount      NUMERIC(10,2) NOT NULL,
    currency    VARCHAR(3)    NOT NULL DEFAULT 'INR',
    reason      TEXT,
    paid        BOOLEAN       NOT NULL DEFAULT FALSE,
    due_date    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_student  ON invoice (student_id);
CREATE INDEX idx_payment_student  ON payment (student_id, status);
CREATE INDEX idx_payment_invoice  ON payment (invoice_id);
CREATE INDEX idx_charge_student   ON account_charge (student_id, paid);
