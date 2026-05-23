-- Fix message_type constraint to include audio and video
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'audio', 'video', 'file', 'call'));

-- Set is_active default to true so new users can use the app without KYC/payment
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
UPDATE users SET is_active = true WHERE is_active = false;
