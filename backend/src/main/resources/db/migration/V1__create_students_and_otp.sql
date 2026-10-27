-- V1: Student accounts and OTP verification

CREATE TABLE student (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'STUDENT'
                    CHECK (role IN ('STUDENT', 'ADMIN')),
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    restricted      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_student_email UNIQUE (email)
);

CREATE TABLE otp_verification (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID         NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    otp_hash    VARCHAR(255) NOT NULL,
    purpose     VARCHAR(30)  NOT NULL
                CHECK (purpose IN ('REGISTRATION', 'PASSWORD_RESET')),
    attempts    INT          NOT NULL DEFAULT 0,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_student_purpose ON otp_verification (student_id, purpose);
