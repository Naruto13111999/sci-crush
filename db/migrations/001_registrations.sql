-- PostgreSQL table: registrations
-- Stores beta sign-ups (name, class, email, phone)

-- +goose Up
CREATE TABLE IF NOT EXISTS registrations (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    class       VARCHAR(50)  NOT NULL DEFAULT '8',
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_email_unique ON registrations (email);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations (created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS registrations;
