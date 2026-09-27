-- Repair DBs where schema.sql stopped early (e.g. duplicate index on organization_auth_settings).
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    employee_number VARCHAR(64),
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(32) DEFAULT 'employee',
    status VARCHAR(32) DEFAULT 'ACTIVE',
    department VARCHAR(128),
    job_title VARCHAR(128),
    phone VARCHAR(32),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_permanent_admin BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL,
    floor INTEGER DEFAULT 1,
    building VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 6,
    amenities JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) DEFAULT 'available',
    color VARCHAR(32) DEFAULT '#2563eb',
    hourly_rate NUMERIC(12, 2) DEFAULT 0,
    image_url TEXT,
    description TEXT,
    requires_approval BOOLEAN DEFAULT false,
    smart_display_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_org ON rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_name VARCHAR(128) NOT NULL,
    organizer_email VARCHAR(191) NOT NULL,
    organizer_id VARCHAR(64),
    date DATE NOT NULL,
    start_time VARCHAR(16) NOT NULL,
    end_time VARCHAR(16) NOT NULL,
    attendees_count INTEGER DEFAULT 1,
    status VARCHAR(32) DEFAULT 'confirmed',
    equipment JSONB DEFAULT '[]'::jsonb,
    catering BOOLEAN DEFAULT false,
    catering_items JSONB DEFAULT '[]'::jsonb,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_org ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
