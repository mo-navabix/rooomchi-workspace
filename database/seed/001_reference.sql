-- Idempotent reference data (safe to re-run). Mirrors seed section of schema.sql.
-- Used by: npm run db:sync

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

INSERT INTO team_members (id, team_id, user_id)
VALUES
('tm-1', 'team-1', 'usr-1'),
('tm-2', 'team-1', 'usr-2'),
('tm-3', 'team-1', 'usr-3')
ON CONFLICT (id) DO NOTHING;
