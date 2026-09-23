-- Verifying by email now makes someone a representative of a company, not its admin.
--
-- Admin rights follow control of the website itself (a meta tag or a DNS record). A company
-- email only shows that someone works there: at a 300-person operator that would hand the
-- listing to whoever signed up first, and leaving the company wouldn't take it back.

-- A representative can now exist before anyone has claimed the domain. The admin is filled in
-- when someone finally verifies ownership, so reps gathered in the meantime show up for them.
ALTER TABLE website_representation_requests ALTER COLUMN owner_id DROP NOT NULL;

-- How the representation was established: 'email' (self-verified) or 'approval' (the older
-- flow, where an owner approved a request).
ALTER TABLE website_representation_requests ADD COLUMN IF NOT EXISTS verified_via TEXT;

-- Codes for representative verification. Separate from verified_websites, which from now on
-- holds admin claims only.
CREATE TABLE IF NOT EXISTS website_rep_email_codes (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain      TEXT NOT NULL,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, domain)
);
