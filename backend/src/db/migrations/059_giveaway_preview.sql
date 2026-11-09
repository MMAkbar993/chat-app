-- Preview mode for the Christmas giveaway: people on GIVEAWAY_PREVIEW_EMAILS can play on the live
-- site before it starts, on any day they pick. Their spins and wins are flagged here and counted
-- apart from real ones, so testing never uses up real prize stock. Cleared before launch with
-- `npm run giveaway:reset-preview` (src/db/resetGiveawayPreview.js).
ALTER TABLE giveaway_spins ADD COLUMN IF NOT EXISTS is_preview BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE giveaway_wins ADD COLUMN IF NOT EXISTS is_preview BOOLEAN NOT NULL DEFAULT FALSE;
