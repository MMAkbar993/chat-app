-- Affiliate Roulette x Pulse Christmas giveaway (1 to 25 December, one spin a day per entrant).
-- The spin itself is decided on the server (services/giveaway.service.js); these tables hold the
-- prize list with its odds and limits, the people taking part, every spin and every prize won.

-- One row per prize. chance is out of 100,000, so 0.025% is 25; whatever the active prizes do not
-- use up is the chance of No Prize, which is also where a sold out prize's chance goes.
-- total_limit / daily_limit: NULL means no limit. A prize that hits one shows "Limit Reached".
-- ends_game: winning it ends that person's game (one big prize each). The 5% and 10% vouchers
-- do not; a person can hold one of each, and drawing one they already hold counts as No Prize.
CREATE TABLE IF NOT EXISTS giveaway_prizes (
  key          VARCHAR(40) PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  prize_group  VARCHAR(20) NOT NULL DEFAULT 'standard',   -- 'standard' or 'mega', for the page
  chance       INTEGER NOT NULL CHECK (chance >= 0 AND chance <= 100000),
  total_limit  INTEGER CHECK (total_limit IS NULL OR total_limit >= 0),
  daily_limit  INTEGER CHECK (daily_limit IS NULL OR daily_limit >= 0),
  ends_game    BOOLEAN NOT NULL DEFAULT TRUE,
  needs_wallet BOOLEAN NOT NULL DEFAULT FALSE,             -- crypto: the winner gives a wallet address
  pro_months   INTEGER,                                    -- Pulse Pro for this many months
  pro_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS giveaway_entrants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) NOT NULL,
  category     VARCHAR(40) NOT NULL,
  ip           VARCHAR(64),
  country      VARCHAR(2),
  user_agent   VARCHAR(400),
  finished_at  TIMESTAMPTZ,            -- set when they win a prize that ends the game
  blocked_at   TIMESTAMPTZ,            -- an admin can stop someone abusing the giveaway
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS giveaway_entrants_email_idx ON giveaway_entrants (LOWER(email));
CREATE INDEX IF NOT EXISTS giveaway_entrants_ip_idx ON giveaway_entrants (ip);

-- One spin per entrant per day (spin_day is the UTC date). outcome:
--   'none'      the draw landed on No Prize
--   'prize'     won drawn_prize (win_id points at it)
--   'duplicate' drew a voucher they already hold, counts as No Prize
--   'limit'     drew a prize that had run out (in total or for the day), counts as No Prize
CREATE TABLE IF NOT EXISTS giveaway_spins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrant_id   UUID NOT NULL REFERENCES giveaway_entrants(id) ON DELETE CASCADE,
  spin_day     DATE NOT NULL,
  drawn_prize  VARCHAR(40) REFERENCES giveaway_prizes(key),
  outcome      VARCHAR(12) NOT NULL CHECK (outcome IN ('none', 'prize', 'duplicate', 'limit')),
  win_id       UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entrant_id, spin_day)
);
CREATE INDEX IF NOT EXISTS giveaway_spins_day_idx ON giveaway_spins (spin_day);

-- A prize won. code is what the winner enters on Pulse to claim it (until the claim deadline).
CREATE TABLE IF NOT EXISTS giveaway_wins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrant_id     UUID NOT NULL REFERENCES giveaway_entrants(id) ON DELETE CASCADE,
  prize_key      VARCHAR(40) NOT NULL REFERENCES giveaway_prizes(key),
  won_day        DATE NOT NULL,
  code           VARCHAR(20) NOT NULL UNIQUE,
  claimed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  claimed_at     TIMESTAMPTZ,
  wallet_address VARCHAR(200),
  fulfilled_at   TIMESTAMPTZ,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entrant_id, prize_key)        -- never the same prize twice for one person
);
CREATE INDEX IF NOT EXISTS giveaway_wins_prize_day_idx ON giveaway_wins (prize_key, won_day);
CREATE INDEX IF NOT EXISTS giveaway_wins_claimed_by_idx ON giveaway_wins (claimed_by);

-- The prize list as agreed with Eddie (Pro split into 1, 3, 6 and 12 months). This file runs on
-- every deploy, so DO NOTHING keeps any change made in the admin panel. The daily limits are a
-- starting point (one a day for anything with a total cap) until Eddie confirms them.
INSERT INTO giveaway_prizes (key, name, prize_group, chance, total_limit, daily_limit, ends_game, needs_wallet, pro_months, pro_lifetime, sort_order) VALUES
  ('voucher_5',      '5% Off Voucher (Affiliate Roulette)',             'standard', 25000, NULL, NULL, FALSE, FALSE, NULL, FALSE, 10),
  ('voucher_10',     '10% Off Voucher (Affiliate Roulette)',            'standard', 20000, NULL, NULL, FALSE, FALSE, NULL, FALSE, 20),
  ('voucher_20',     '20% Off Voucher (Affiliate Roulette)',            'standard',  3000, NULL, NULL, TRUE,  FALSE, NULL, FALSE, 30),
  ('voucher_50',     '50% Off Voucher (Affiliate Roulette)',            'standard',   100,   10,    1, TRUE,  FALSE, NULL, FALSE, 40),
  ('ads_7d',         'Free 7 Day Advertising on Affiliate Roulette',    'standard',   500,   10,    1, TRUE,  FALSE, NULL, FALSE, 50),
  ('ads_15d',        'Free 15 Day Advertising on Affiliate Roulette',   'standard',   200,    5,    1, TRUE,  FALSE, NULL, FALSE, 60),
  ('ads_30d',        'Free 30 Day Advertising on Affiliate Roulette',   'standard',   100,    2,    1, TRUE,  FALSE, NULL, FALSE, 70),
  ('email_campaign', 'Free Email Campaign',                             'standard',   200,    5,    1, TRUE,  FALSE, NULL, FALSE, 80),
  ('shoutout',       'Free Social Media Shoutout',                      'standard',   400,   10,    1, TRUE,  FALSE, NULL, FALSE, 90),
  ('pro_1m',         'Free Pulse Pro for 1 Month',                      'standard',  6000, NULL, NULL, TRUE,  FALSE,    1, FALSE, 100),
  ('pro_3m',         'Free Pulse Pro for 3 Months',                     'standard',  2500, NULL, NULL, TRUE,  FALSE,    3, FALSE, 110),
  ('pro_6m',         'Free Pulse Pro for 6 Months',                     'standard',  1000, NULL, NULL, TRUE,  FALSE,    6, FALSE, 120),
  ('pro_12m',        'Free Pulse Pro for 12 Months',                    'standard',   500, NULL, NULL, TRUE,  FALSE,   12, FALSE, 130),
  ('eth_10',         '€10 in ETH',                                      'standard',   150,   25,    1, TRUE,  TRUE,  NULL, FALSE, 140),
  ('btc_10',         '€10 in BTC',                                      'standard',   150,   25,    1, TRUE,  TRUE,  NULL, FALSE, 150),
  ('pro_lifetime',   'Free Pulse Pro for Life',                         'mega',        50,    1,    1, TRUE,  FALSE, NULL, TRUE,  200),
  ('apple_100',      '$100 Apple Gift Card',                            'mega',        25,    1,    1, TRUE,  FALSE, NULL, FALSE, 210),
  ('amazon_100',     '$100 Amazon Gift Card',                           'mega',        25,    1,    1, TRUE,  FALSE, NULL, FALSE, 220),
  ('ar_voucher_500', '$500 Affiliate Roulette Voucher',                 'mega',       100,    1,    1, TRUE,  FALSE, NULL, FALSE, 230)
ON CONFLICT (key) DO NOTHING;
