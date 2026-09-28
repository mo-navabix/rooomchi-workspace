-- Installation wizard & integrations (idempotent)

CREATE TABLE IF NOT EXISTS installation_status (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
  initialized BOOLEAN NOT NULL DEFAULT false,
  organization_created BOOLEAN NOT NULL DEFAULT false,
  admin_created BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO installation_status (id, initialized, organization_created, admin_created)
VALUES ('default', false, false, false)
ON CONFLICT (id) DO NOTHING;

UPDATE installation_status
SET
  initialized = true,
  organization_created = true,
  admin_created = true,
  completed_at = COALESCE(completed_at, NOW()),
  updated_at = NOW()
WHERE id = 'default'
  AND initialized = false
  AND EXISTS (SELECT 1 FROM organizations LIMIT 1)
  AND EXISTS (SELECT 1 FROM users LIMIT 1);

CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(organization_id);
