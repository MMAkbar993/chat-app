-- Verifying a website by emailing a code to an address on that same domain, for owners who
-- can't add a meta tag or a DNS record. The code is stored hashed: a leaked database row
-- shouldn't hand someone a working verification code.
ALTER TABLE verified_websites ADD COLUMN IF NOT EXISTS email_code_hash TEXT;
ALTER TABLE verified_websites ADD COLUMN IF NOT EXISTS email_code_expires TIMESTAMPTZ;
ALTER TABLE verified_websites ADD COLUMN IF NOT EXISTS email_code_sent_to TEXT;
ALTER TABLE verified_websites ADD COLUMN IF NOT EXISTS email_code_attempts INTEGER NOT NULL DEFAULT 0;
-- How the site was proved, for support and for the record: 'meta', 'dns' or 'email'.
ALTER TABLE verified_websites ADD COLUMN IF NOT EXISTS verified_method TEXT;
