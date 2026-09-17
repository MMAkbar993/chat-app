-- Both default to false: existing accounts keep behaving exactly as they do today, and these
-- are opt-in restrictions rather than something applied to people retroactively.
ALTER TABLE users ADD COLUMN IF NOT EXISTS hide_from_search BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS restrict_group_add BOOLEAN NOT NULL DEFAULT false;
