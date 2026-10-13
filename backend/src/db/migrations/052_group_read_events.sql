-- When each group member read new messages, so a sender can see "Read by Mihai at 14:18" on a
-- group message. conversation_participants.last_read_at only keeps the latest read, which is
-- not when a particular message was read. One row is written each time a member reads messages
-- they had not seen yet (db/queries/conversations.js markRead); a member's read time for a
-- message is their first event at or after it was sent. Groups only.
CREATE TABLE IF NOT EXISTS group_read_events (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Serves the "read by" lookup: one member's first read at or after a time, in one chat.
CREATE INDEX IF NOT EXISTS idx_group_read_events_lookup
  ON group_read_events (conversation_id, user_id, read_at);
