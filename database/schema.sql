-- Airbnb Cleaning App - PostgreSQL schema
-- Roles:
--   admin  -> Tony / Ana
--   worker -> read-only access to assigned properties

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Users
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker')) DEFAULT 'worker',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

-- =========================
-- Properties / Houses
-- =========================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT,
    property_name TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    door_code TEXT,
    entry_instructions TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_active ON properties(is_active);
CREATE INDEX idx_properties_name ON properties(property_name);
CREATE INDEX idx_properties_city ON properties(city);

-- =========================
-- Assignments
-- One worker can have many properties
-- One property can be assigned to many workers if needed
-- =========================
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    assigned_from DATE,
    assigned_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_assignment_per_date UNIQUE (user_id, property_id, assigned_date)
);

CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_property_id ON assignments(property_id);
CREATE INDEX idx_assignments_active ON assignments(is_active);
CREATE INDEX idx_assignments_assigned_date ON assignments(assigned_date);

-- For existing databases, run:
-- ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_date DATE;
-- UPDATE assignments SET assigned_date = CURRENT_DATE WHERE assigned_date IS NULL;
-- ALTER TABLE assignments ALTER COLUMN assigned_date SET NOT NULL;
-- ALTER TABLE assignments DROP CONSTRAINT IF EXISTS unique_active_assignment;
-- ALTER TABLE assignments
--   ADD CONSTRAINT unique_assignment_per_date UNIQUE (user_id, property_id, assigned_date);

-- =========================
-- Optional service schedule
-- Use this if later you want to show houses by date
-- =========================
CREATE TABLE service_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_time TEXT,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_dates_property_id ON service_dates(property_id);
CREATE INDEX idx_service_dates_service_date ON service_dates(service_date);
CREATE INDEX idx_service_dates_assigned_user_id ON service_dates(assigned_user_id);

-- =========================
-- Updated_at helper
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_assignments_updated_at
BEFORE UPDATE ON assignments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_service_dates_updated_at
BEFORE UPDATE ON service_dates
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================
-- Seed admin users
-- Replace password hashes later from your backend
-- =========================
INSERT INTO users (name, email, password_hash, role, status)
VALUES
    ('Tony Hernandez', 'tony@example.com', 'CHANGE_ME_HASH', 'admin', 'active'),
    ('Ana', 'ana@example.com', 'CHANGE_ME_HASH', 'admin', 'active');

-- =========================
-- Helpful worker query
-- Shows only active assigned properties for a logged-in worker
-- =========================
-- SELECT p.*
-- FROM properties p
-- INNER JOIN assignments a ON a.property_id = p.id
-- INNER JOIN users u ON u.id = a.user_id
-- WHERE u.id = $1
--   AND u.status = 'active'
--   AND p.is_active = TRUE
--   AND a.is_active = TRUE
-- ORDER BY p.property_name ASC;
