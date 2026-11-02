-- Tracks which booking reminder slots were already dispatched (per org).
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS reminder_dispatch_state JSONB NOT NULL DEFAULT '{}'::jsonb;
