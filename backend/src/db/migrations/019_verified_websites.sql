-- Multiple verified websites per user
CREATE TABLE IF NOT EXISTS verified_websites (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  verify_token VARCHAR(255),
  verified     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- Migrate any existing single verified website
INSERT INTO verified_websites (user_id, url, verified)
SELECT id, website, true
FROM users
WHERE website IS NOT NULL AND website_verified = true
ON CONFLICT DO NOTHING;
