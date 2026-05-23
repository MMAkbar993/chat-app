-- Per-user message clear timestamp: messages before this time are hidden for that user only
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS messages_cleared_at TIMESTAMPTZ DEFAULT NULL;
