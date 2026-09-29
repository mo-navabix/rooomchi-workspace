-- ============================================================================
-- سامانه مدیریت و رزرواسیون هوشمند اتاق‌های جلسات سازمانی «روم‌چی»
-- اسکریپت ساخت جداول برای دیتابیس PostgreSQL (rooomchi_db) — بدون داده نمونه
-- ============================================================================

-- فعال‌سازی افزونه جهت تولید شناسه‌های یکتا در صورت نیاز
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- ۱. جدول سازمان‌ها (organizations)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

CREATE TABLE organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    domain VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    slug VARCHAR(128) NOT NULL,
    logo TEXT DEFAULT '🏢',
    primary_color VARCHAR(32) DEFAULT '#2563EB',
    plan VARCHAR(32) DEFAULT 'enterprise',
    contact_email VARCHAR(128),
    buildings JSONB DEFAULT '[]'::jsonb,
    departments JSONB DEFAULT '[]'::jsonb,
    work_hours JSONB DEFAULT '{"start": "08:00", "end": "20:00"}'::jsonb,
    settings JSONB DEFAULT '{"autoApprove": true, "maxBookingHours": 4, "allowWeekend": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- ۱.۱ تنظیمات احراز هویت یکپارچه سازمانی (organization_auth_settings - SSO Ready)
-- ----------------------------------------------------------------------------
CREATE TABLE organization_auth_settings (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(64) DEFAULT 'LOCAL', -- 'LOCAL', 'MICROSOFT_ENTRA_ID', 'GOOGLE_WORKSPACE', 'SAML'
    enabled BOOLEAN DEFAULT FALSE,
    client_id VARCHAR(255),
    client_secret VARCHAR(255),
    issuer_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_settings_org ON organization_auth_settings(organization_id);
-- ----------------------------------------------------------------------------
CREATE TABLE users (
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

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- ۳. جدول سالن‌ها و اتاق‌های جلسات (rooms)
-- ----------------------------------------------------------------------------
CREATE TABLE rooms (
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

CREATE INDEX idx_rooms_org ON rooms(organization_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- ----------------------------------------------------------------------------
-- ۴. جدول رزروها (bookings)
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
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

CREATE INDEX idx_bookings_org ON bookings(organization_id);
CREATE INDEX idx_bookings_room_date ON bookings(room_id, date);
CREATE INDEX idx_bookings_date ON bookings(date);

-- ----------------------------------------------------------------------------
-- ۵. جدول لاگ‌های امنیتی و عملیاتی (audit_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
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

CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ----------------------------------------------------------------------------
-- ۶. جدول تیم‌ها و گروه‌ها (teams)
-- نصب تازه بدون داده نمونه — اتاق‌ها و سازمان از wizard یا پنل ادمین اضافه می‌شوند.
-- داده دمو: npm run db:sync -- --reference --demo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_creator ON teams(created_by);

-- ----------------------------------------------------------------------------
-- ۸. جدول اعضای تیم (team_members)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(64) PRIMARY KEY,
    team_id VARCHAR(64) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_user UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

