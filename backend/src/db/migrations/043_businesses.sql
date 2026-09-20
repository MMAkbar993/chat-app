-- A business profile belongs to a verified domain, not to a verified_websites row: transferring
-- ownership deletes the old owner's row and inserts a new one for the new owner, so a foreign
-- key to that row would take the profile down with it. Keyed by domain, a transfer is just an
-- owner_id update, and removing the website deletes the profile (handled in the controller).
CREATE TABLE IF NOT EXISTS businesses (
  id            SERIAL PRIMARY KEY,
  domain        TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  owner_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  about         TEXT,
  logo_url      TEXT,
  cover_url     TEXT,
  website_url   TEXT,
  founded_on    DATE,
  email         TEXT,
  industry      TEXT,
  headquarters  TEXT,
  services      TEXT[] NOT NULL DEFAULT '{}',
  -- Owner's choice whether the business card appears on their personal profile.
  show_on_profile BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS businesses_owner_idx ON businesses(owner_id);
-- Business-name search matches the same way user search does: case- and punctuation-insensitive.
CREATE INDEX IF NOT EXISTS businesses_name_idx ON businesses(LOWER(name));
