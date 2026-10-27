-- Multi-tenant verification codes (idempotent)

ALTER TABLE verification_codes
  ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64) NOT NULL DEFAULT '';

-- Replace PK to include organization_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verification_codes_pkey'
      AND conrelid = 'verification_codes'::regclass
  ) THEN
    ALTER TABLE verification_codes DROP CONSTRAINT verification_codes_pkey;
  END IF;
END $$;

ALTER TABLE verification_codes
  ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (email, purpose, organization_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_org ON verification_codes(organization_id);
