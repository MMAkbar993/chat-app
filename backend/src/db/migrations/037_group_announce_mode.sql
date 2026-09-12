-- "Only admins can send messages" — the Telegram-broadcast-channel pattern the product team
-- wants for things like the Affiliate Roulette announcements group: anyone can join and read,
-- only admins can post. conversation_participants.role already distinguishes admin/member, so
-- this is one flag plus an enforcement check, not a new conversation type.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS admins_only_messaging BOOLEAN NOT NULL DEFAULT false;
