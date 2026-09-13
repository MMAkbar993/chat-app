-- A conversation can hold one message pinned at the top of the thread — the welcome note in a
-- group, the agreed terms in a DM. One pin per conversation on purpose: a list of pins is a
-- second inbox to maintain, and the ask was for a single always-visible message.
-- ON DELETE SET NULL so deleting the message quietly clears the pin instead of orphaning it.
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS pinned_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES users(id) ON DELETE SET NULL;
