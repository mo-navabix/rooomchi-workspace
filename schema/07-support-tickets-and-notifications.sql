-- Support tickets + org notification channel settings (enterprise admin)

CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  category VARCHAR(32) NOT NULL,
  priority VARCHAR(16) NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  contact_phone VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, created_at DESC);

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS notification_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS notification_logs JSONB NOT NULL DEFAULT '[]'::jsonb;
