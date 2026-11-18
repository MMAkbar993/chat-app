-- Christmas giveaway Grand Prize Draw (agreed with Affiliate Roulette, 2026-11-18):
--   - every spin earns 1 entry into a draw for Free Pulse Pro for Life, one winner, drawn after the
--     last door closes on 25 December; more entries, more chances
--   - a "+2 entries" slice on the wheel, about 1 spin in 10
--   - Pulse Pro for Life comes off the wheel (it is the draw prize); the other mega prizes stay on
--     the wheel but can only be won from 21 December
-- Safe to run on every deploy: the prize changes happen once (when the +2 entries prize is first
-- added), so later changes in the admin panel are kept.

ALTER TABLE giveaway_prizes ADD COLUMN IF NOT EXISTS bonus_entries INTEGER;   -- a draw entries prize, not a real prize
ALTER TABLE giveaway_prizes ADD COLUMN IF NOT EXISTS available_from DATE;     -- cannot be won before this day
ALTER TABLE giveaway_spins ADD COLUMN IF NOT EXISTS entries INTEGER NOT NULL DEFAULT 1; -- draw entries this spin gave

ALTER TABLE giveaway_spins DROP CONSTRAINT IF EXISTS giveaway_spins_outcome_check;
ALTER TABLE giveaway_spins ADD CONSTRAINT giveaway_spins_outcome_check
  CHECK (outcome IN ('none', 'prize', 'duplicate', 'limit', 'big_done', 'entries', 'not_yet'));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM giveaway_prizes WHERE key = 'entries_2') THEN
    INSERT INTO giveaway_prizes (key, name, prize_group, chance, ends_game, needs_wallet, pro_lifetime, bonus_entries, sort_order)
    VALUES ('entries_2', '+2 Grand Prize Draw entries', 'standard', 10000, FALSE, FALSE, FALSE, 2, 5);
    UPDATE giveaway_prizes SET active = FALSE, updated_at = NOW() WHERE key = 'pro_lifetime';
    UPDATE giveaway_prizes SET available_from = DATE '2026-12-21', updated_at = NOW()
      WHERE prize_group = 'mega' AND key <> 'pro_lifetime';
  END IF;
END $$;

-- The draw itself. One live (not voided) draw at a time, for real play and for preview mode each.
-- A voided draw (say the winner turned out to be cheating) stays here for the record, and that
-- person is left out of any redraw.
CREATE TABLE IF NOT EXISTS giveaway_draws (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_preview     BOOLEAN NOT NULL DEFAULT FALSE,
  prize_key      VARCHAR(40) NOT NULL REFERENCES giveaway_prizes(key),
  entrant_id     UUID NOT NULL REFERENCES giveaway_entrants(id) ON DELETE CASCADE,
  win_id         UUID REFERENCES giveaway_wins(id) ON DELETE SET NULL,
  winner_entries INTEGER NOT NULL,
  total_entries  INTEGER NOT NULL,
  entrant_count  INTEGER NOT NULL,
  roll           BIGINT NOT NULL,
  drawn_by       VARCHAR(255) NOT NULL,            -- 'automatic' or the admin's email
  voided_at      TIMESTAMPTZ,
  voided_by      VARCHAR(255),
  void_reason    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS giveaway_draws_one_live_idx ON giveaway_draws (is_preview) WHERE voided_at IS NULL;

-- Editable under Tools → System Emails.
INSERT INTO system_email_settings (email_key, subject, body_html) VALUES
(
  'giveaway_draw_winner',
  'You won the Grand Prize: {{prizeName}} 🎄',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#b91c1c">You won the Grand Prize Draw! 🎉</h2>
        <p>Congratulations! You were drawn as the winner of the Affiliate Roulette × {{appName}} Christmas Grand Prize: <strong>{{prizeName}}</strong>.</p>
        <p>Your prize code:</p>
        <div style="font-size:1.6rem;font-weight:bold;letter-spacing:0.15em;color:#b91c1c;padding:8px 0 16px">{{code}}</div>
        <p style="padding:8px 0">
          <a href="{{claimUrl}}" style="background:#b91c1c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px;display:inline-block">Claim my prize</a>
        </p>
        <p>Please claim it on {{appName}} by {{claimDeadline}}.</p>
      </div>
    $$
)
ON CONFLICT (email_key) DO NOTHING;
