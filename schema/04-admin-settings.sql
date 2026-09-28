-- Enterprise admin: system settings + configuration audit trail

CREATE TABLE IF NOT EXISTS system_settings (
  organization_id VARCHAR(64) PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  app_url VARCHAR(500),
  default_timezone VARCHAR(64) DEFAULT 'Asia/Tehran',
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  max_upload_mb INTEGER NOT NULL DEFAULT 10,
  security JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS config_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  summary TEXT,
  before_state JSONB,
  after_state JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_config_audit_org ON config_audit_logs(organization_id, created_at DESC);
