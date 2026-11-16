-- Christmas giveaway admin panel: who marked a prize as delivered (the admin's email), and an index
-- for the panel's newest-first list of entries. Safe to run on every deploy.
ALTER TABLE giveaway_wins ADD COLUMN IF NOT EXISTS fulfilled_by VARCHAR(255);
CREATE INDEX IF NOT EXISTS giveaway_entrants_created_idx ON giveaway_entrants (created_at DESC);
