-- Soft-delete flag so the other participant still appears in JOINs
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
