-- Extra columns & tables for Express API (safe to re-run on existing DBs)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_permanent_admin BOOLEAN DEFAULT false;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS department VARCHAR(128) DEFAULT 'عمومی',
  ADD COLUMN IF NOT EXISTS attendee_emails JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS verification_codes (
  email VARCHAR(191) NOT NULL,
  purpose VARCHAR(32) NOT NULL,
  code VARCHAR(16) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email, purpose)
);
