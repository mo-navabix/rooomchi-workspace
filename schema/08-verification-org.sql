-- Multi-tenant verification codes (idempotent)

ALTER TABLE verification_codes
  ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64) NOT NULL DEFAULT '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verification_codes_pkey'
      AND conrelid = 'verification_codes'::regclass
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conname = 'verification_codes_pkey'
      AND c.conrelid = 'verification_codes'::regclass
      AND a.attname = 'organization_id'
  ) THEN
    ALTER TABLE verification_codes DROP CONSTRAINT verification_codes_pkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verification_codes_pkey'
      AND conrelid = 'verification_codes'::regclass
  ) THEN
    ALTER TABLE verification_codes
      ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (email, purpose, organization_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_verification_codes_org ON verification_codes(organization_id);
