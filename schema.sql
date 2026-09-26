-- ============================================================================
-- سامانه مدیریت و رزرواسیون هوشمند اتاق‌های جلسات سازمانی «روم‌چی»
-- اسکریپت ساخت جداول و داده‌های اولیه برای دیتابیس PostgreSQL (rooomchi_db)
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
    logo VARCHAR(32) DEFAULT '🏢',
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

CREATE INDEX idx_auth_settings_org ON organization_auth_settings(organization_id);
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

-- ============================================================================
-- داده‌های نمونه و پیش‌فرض اولیه (Seed Data)
-- ============================================================================

-- درج سازمان‌ها
INSERT INTO organizations (id, name, code, domain, status, slug, logo, primary_color, plan, contact_email, buildings, departments)
VALUES 
(
    'org-1',
    'شرکت فناوری پیشرو (TechNova)',
    'TECHNOVA',
    'technova.ir',
    'ACTIVE',
    'technova',
    '🏢',
    '#2563eb',
    'enterprise',
    'admin@technova.ir',
    '["برج مرکزی سعادت‌آباد", "پردیس فناوری پردیس"]'::jsonb,
    '["تیم فنی و مهندسی", "مارکتینگ و رشد", "منابع انسانی", "محصول و طراحی", "مدیریت ارشد"]'::jsonb
),
(
    'org-2',
    'هلدینگ سرمایه‌گذاری تابان (Taban Holding)',
    'TABAN',
    'taban.group',
    'ACTIVE',
    'taban-holding',
    '🏛️',
    '#059669',
    'business',
    'reservations@taban.group',
    '["ساختمان مرکزی جردن"]'::jsonb,
    '["سرمایه‌گذاری خطرپذیر", "مالی و حسابداری", "حقوقی و قراردادها", "روابط عمومی"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- درج سالن‌های کنفرانس
INSERT INTO rooms (id, organization_id, name, code, floor, building, capacity, amenities, status, color, hourly_rate, image_url, description, requires_approval)
VALUES 
(
    'room-101',
    'org-1',
    'اتاق نوآوری البرz (سالن اصلی)',
    'ALB-101',
    4,
    'برج مرکزی سعادت‌آباد',
    12,
    '["ویدئو وال ۴K", "تخته وایت‌برد نوری", "میکروفون کنفرانسی", "اینترنت اختصاصی", "پذیرایی"]'::jsonb,
    'available',
    '#2563eb',
    180000,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    'سالن مدرن مناسب جلسات استراتژیک و هماهنگی تیم‌های محصول',
    false
),
(
    'room-102',
    'org-1',
    'سالن همایش حافظ (VIP)',
    'HAF-202',
    6,
    'برج مرکزی سعادت‌آباد',
    24,
    '["ویدئو وال ۶۵ اینچ", "سیستم صوتی استریو", "ترجمه همزمان", "پذیرایی VIP", "وب‌کم ۴K"]'::jsonb,
    'occupied',
    '#0d9488',
    350000,
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80',
    'سالن تشریفات و هیئت مدیره با تجهیزات کامل کنفرانس بین‌المللی',
    true
),
(
    'room-103',
    'org-1',
    'اتاق اسپرینت زاگرس',
    'ZAG-103',
    3,
    'پردیس فناوری پردیس',
    8,
    '["پروژکتور هوشمند", "میز ایستاده ارگونومیک", "وایت‌برد شیشه‌ای"]'::jsonb,
    'available',
    '#8b5cf6',
    120000,
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&auto=format&fit=crop&q=80',
    'فضای پویا جهت جلسات روزانه (Daily Standup) و طوفان فکری',
    false
)
ON CONFLICT (id) DO NOTHING;

-- درج کاربران کلیدی
INSERT INTO users (id, organization_id, employee_number, first_name, last_name, email, role, status, department, job_title)
VALUES 
(
    'usr-1',
    'org-1',
    'EMP-1001',
    'سارا',
    'احمدی',
    'sara.ahmadi@technova.ir',
    'super_admin',
    'ACTIVE',
    'مدیریت ارشد',
    'مدیر عامل و بنیان‌گذار'
),
(
    'usr-2',
    'org-1',
    'EMP-1002',
    'امیرحسین',
    'کریمی',
    'amir.karimi@technova.ir',
    'room_manager',
    'ACTIVE',
    'فناوری اطلاعات و زیرساخت',
    'مدیر ارشد IT و پشتیبانی'
),
(
    'usr-3',
    'org-1',
    'EMP-1003',
    'رضا',
    'صادقی',
    'reza.sadeghi@technova.ir',
    'employee',
    'ACTIVE',
    'محصول و طراحی',
    'سرپرست طراحان محصول'
)
ON CONFLICT (id) DO NOTHING;

-- درج رزرو نمونه
INSERT INTO bookings (id, organization_id, room_id, title, description, organizer_name, organizer_email, organizer_id, date, start_time, end_time, attendees_count, status, catering)
VALUES 
(
    'bk-101',
    'org-1',
    'room-102',
    'بررسی اسپرینت سه‌ماهه اول و نقشه راه Q2',
    'جلسه هماهنگی مدیران تیم‌های توسعه فنی، طراحی محصول و مارکتینگ',
    'امیرحسین کریمی',
    'amir.karimi@technova.ir',
    'usr-2',
    CURRENT_DATE,
    '10:00',
    '11:30',
    14,
    'confirmed',
    true
)
ON CONFLICT (id) DO NOTHING;

-- درج لاگ اولیه
INSERT INTO audit_logs (id, organization_id, user_id, action, entity_type, entity_id, details)
VALUES 
(
    'log-init',
    'org-1',
    'usr-1',
    'DATABASE_INIT',
    'SYSTEM',
    'rooomchi_db',
    '{"message": "پایگاه داده روم‌چی (Rooomchi) با موفقیت راه‌اندازی شد."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- ۷. جدول تیم‌ها و گروه‌ها (teams)
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

-- داده‌های اولیه تیم‌ها
INSERT INTO teams (id, organization_id, name, description, created_by)
VALUES
(
    'team-1',
    'org-1',
    'تیم محصول و طراحی',
    'اعضای بخش مدیریت محصول، تجربه کاربری (UX) و رابط کاربری (UI)',
    'usr-1'
),
(
    'team-2',
    'org-1',
    'تیم مارکتینگ و رشد',
    'اعضای بازاریابی دیجیتال، برندینگ و روابط عمومی',
    'usr-1'
)
ON CONFLICT (id) DO NOTHING;

-- اعضای اولیه تیم‌ها
INSERT INTO team_members (id, team_id, user_id)
VALUES
('tm-1', 'team-1', 'usr-1'),
('tm-2', 'team-1', 'usr-2'),
('tm-3', 'team-1', 'usr-3')
ON CONFLICT (id) DO NOTHING;

