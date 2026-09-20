-- IANA zone name (e.g. "Asia/Karachi") reported by the user's own browser. Nullable: accounts
-- that haven't signed in since this shipped have none, and the UI hides "Local Time" rather
-- than guessing.
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT;
