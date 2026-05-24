-- Idempotent catch-up: ensures every column added in migrations 002-010 exists.
-- Safe to re-run on any environment (all statements use IF NOT EXISTS).

-- ── users: profile fields (002) ──────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio          TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender       VARCHAR(20);

-- ── users: 2FA fields (003) ──────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret  VARCHAR(255);

-- ── conversation_participants: per-user flags (004) ───────────────────────────
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_pinned   BOOLEAN DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_muted    BOOLEAN DEFAULT false;

-- ── messages: reply threading (004) ──────────────────────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_message_id);

-- ── messages: delivery/read status (010) ─────────────────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';

-- ── messages: video/audio types (007) ────────────────────────────────────────
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'call'));

-- ── conversation_participants: per-user clear cursor (006) ───────────────────
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS messages_cleared_at TIMESTAMPTZ;

-- ── conversation_participants: soft-delete (005) ─────────────────────────────
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- ── users: website and location (009) ────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS website  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- ── support tables: blocked users, reports (004) ─────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason           TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── support tables: message reactions (008) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS message_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji      VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);

-- ── support tables: social connections (003) ─────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_social_user ON social_connections(user_id);

-- ── support tables: password reset OTPs (003) ────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  otp_hash   VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user ON password_reset_otps(user_id);
