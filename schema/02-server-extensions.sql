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

-- Enterprise auth (idempotent — also in database/migrations/000003_enterprise_auth.sql)

ALTER TABLE organization_auth_settings
  ADD COLUMN IF NOT EXISTS local_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ldap_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ldap_configuration JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS google_configuration JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS auth_policies JSONB DEFAULT '{}'::jsonb;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS user_external_identities (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(512) NOT NULL,
  provider_email VARCHAR(191),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ext_id_user ON user_external_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ext_id_org ON user_external_identities(organization_id);

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
  provider VARCHAR(32) NOT NULL,
  action VARCHAR(64) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address VARCHAR(64),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_org ON auth_audit_logs(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ldap_group_role_mappings (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ldap_group VARCHAR(512) NOT NULL,
  role VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, ldap_group)
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state VARCHAR(128) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL DEFAULT 'google',
  redirect_after TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
