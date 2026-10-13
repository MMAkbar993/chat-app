-- Undoes 051_indexes_for_scale.sql. Not run automatically (the migration runner only reads the
-- folder above this one). To roll back, run each statement on its own, outside a transaction:
--   psql "$DATABASE_URL" -f backend/src/db/migrations/rollback/051_indexes_for_scale.down.sql
-- and delete 051_indexes_for_scale.sql, or the next deploy builds the indexes again.
--
-- pg_trgm is left installed: dropping it is only safe once no index uses it, and it costs
-- nothing while unused. To remove it too: DROP EXTENSION IF EXISTS pg_trgm;

DROP INDEX CONCURRENTLY IF EXISTS idx_messages_conversation_not_read;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_username_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_conversations_pinned_message;
