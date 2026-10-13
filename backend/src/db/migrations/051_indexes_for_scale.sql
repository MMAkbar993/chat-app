-- migrate: no-transaction
-- Indexes chosen by measuring the app's real queries against a database filled to ~100k members
-- and ~5M messages (backend/scripts/bench). Each one names the query it serves. Built with
-- CONCURRENTLY so saving messages and signing in keep working while they build on a live
-- database. Undo: rollback/051_indexes_for_scale.down.sql.
--
-- The runner sends these one statement at a time (first line above). Keep every statement
-- ending in a semicolon at the end of a line, and no semicolons at line ends anywhere else.

-- Trigram matching for the username search below. Trusted extension: the database owner can
-- enable it without superuser (Postgres 13 and later), as 001 does for pgcrypto.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Read and delivery receipts (db/queries/messages.js markMessagesRead / markMessagesDelivered),
-- run every time a chat is opened or a message arrives:
--   WHERE conversation_id = $1 AND sender_id != $2 AND status != 'read'   (and status = 'sent')
-- The existing conversation index makes Postgres read every message in the chat and discard the
-- read ones. This index holds only messages not yet read, so it stays small: a message leaves
-- it the moment it is marked read.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_not_read
  ON messages (conversation_id)
  WHERE status <> 'read';

-- Find people by username (db/queries/contacts.js searchUsers): WHERE username ILIKE $1.
-- A plain index cannot serve a case-insensitive match, so every search read the whole users
-- table. A trigram index can, and also covers the same search with wildcards in it.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_trgm
  ON users USING gin (username gin_trgm_ops);

-- Deleting a chat (db/queries/conversations.js deleteConversation, and deleting a group).
-- Each deleted message makes Postgres clear any pin pointing at it, through the foreign key
-- conversations.pinned_message_id ON DELETE SET NULL. With no index that is one read of the
-- whole conversations table per message. Few chats have a pin, so the index is tiny.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_pinned_message
  ON conversations (pinned_message_id)
  WHERE pinned_message_id IS NOT NULL;
