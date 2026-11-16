-- Christmas giveaway rule change (Affiliate Roulette, 2026-11-17): everyone keeps opening a door
-- every day, even after a big prize. Each person can win one big prize; after that, landing on a
-- big prize counts as no prize ('big_done'). Small prizes (ends_game = false) can still be won,
-- each once per person: the 5% and 10% vouchers, and now 1 and 3 months of Pulse Pro too.
-- ends_game now means "big prize, one per person". Safe to run on every deploy.
UPDATE giveaway_prizes SET ends_game = FALSE, updated_at = NOW()
WHERE key IN ('pro_1m', 'pro_3m') AND ends_game;

ALTER TABLE giveaway_spins DROP CONSTRAINT IF EXISTS giveaway_spins_outcome_check;
ALTER TABLE giveaway_spins ADD CONSTRAINT giveaway_spins_outcome_check
  CHECK (outcome IN ('none', 'prize', 'duplicate', 'limit', 'big_done'));
