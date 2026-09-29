-- Organization logo may be emoji, URL, or base64 data URL (admin upload)
ALTER TABLE organizations
  ALTER COLUMN logo TYPE TEXT;
