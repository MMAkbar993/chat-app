-- Joining the Christmas giveaway (and signing back in to it) with a 6 digit email code.
-- One pending code per email; only its hash is kept. See controllers/giveaway.controller.js.
CREATE TABLE IF NOT EXISTS giveaway_email_codes (
  email        VARCHAR(255) PRIMARY KEY,          -- stored lower case
  code_hash    TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  sent_count   INTEGER NOT NULL DEFAULT 1,        -- codes sent in the current hour
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A random id the giveaway page keeps in the browser, so one browser cannot open many entries.
-- Easy to clear on purpose, so it sits next to the IP limit and the ID check at claim, not instead.
ALTER TABLE giveaway_entrants ADD COLUMN IF NOT EXISTS device_id VARCHAR(64);
CREATE INDEX IF NOT EXISTS giveaway_entrants_device_idx ON giveaway_entrants (device_id);

-- Editable under Tools → System Emails. Always sent (no off switch): without it nobody can join.
INSERT INTO system_email_settings (email_key, subject, body_html) VALUES
(
  'giveaway_code',
  'Your Christmas giveaway code: {{code}}',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#b91c1c">25 Days of Christmas 🎄</h2>
        <p>Here is your code for the Affiliate Roulette × {{appName}} Christmas giveaway. It expires in 15 minutes.</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.3em;color:#b91c1c;padding:16px 0">{{code}}</div>
        <p>Come back every day from 1 to 25 December for a new spin.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you did not ask for this code, you can ignore this email.</p>
      </div>
    $$
)
ON CONFLICT (email_key) DO NOTHING;
