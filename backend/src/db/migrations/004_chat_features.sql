-- Conversation participant flags (per-user, per-conversation)
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_pinned   BOOLEAN DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_muted    BOOLEAN DEFAULT false;

-- Reply threading on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_message_id);

-- Blocked users
CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
