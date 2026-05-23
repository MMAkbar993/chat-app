-- Password reset OTPs
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  otp_hash    VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user ON password_reset_otps(user_id);

-- Two-factor authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Social account connections (verified social profiles)
CREATE TABLE IF NOT EXISTS social_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  platform         VARCHAR(50) NOT NULL,
  platform_user_id VARCHAR(255),
  username         VARCHAR(255),
  display_name     VARCHAR(255),
  profile_url      TEXT,
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

DROP TRIGGER IF EXISTS social_connections_updated_at ON social_connections;
CREATE TRIGGER social_connections_updated_at
  BEFORE UPDATE ON social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_social_user ON social_connections(user_id);
