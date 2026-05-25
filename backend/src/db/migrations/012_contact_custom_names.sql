-- Custom per-user contact nicknames
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS custom_first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS custom_last_name  VARCHAR(100);
