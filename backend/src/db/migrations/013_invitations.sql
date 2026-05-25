CREATE TABLE IF NOT EXISTS invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient   VARCHAR(255) NOT NULL,
  message     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (sender_id, recipient)
);
