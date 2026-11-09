-- Claiming Christmas giveaway prizes on Pulse (services/giveawayClaim.service.js).

-- Pulse Pro given for a set time, separate from a paid Stripe plan: someone is Pro while
-- pro_ends_at is in the future (utils/plan.js), so nothing has to switch it off when it ends.
-- Pro for life is stored as 9999-12-31. pro_reminder_sent_at: the "your Pro ends soon" email
-- went out for the current end date (cleared whenever the end date changes).
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_ends_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_reminder_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS users_pro_ends_at_idx ON users (pro_ends_at) WHERE pro_ends_at IS NOT NULL;

-- The chat Pulse opened with the winner when they claimed.
ALTER TABLE giveaway_wins ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Editable under Tools → System Emails.
INSERT INTO system_email_settings (email_key, subject, body_html) VALUES
(
  'pro_ending_soon',
  'Your free {{appName}} Pro ends on {{endDate}}',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Your Pro time is almost up</h2>
        <p>Hi {{name}}, the free {{appName}} Pro you won ends on <strong>{{endDate}}</strong>. After that your account moves to the free plan. Your chats and contacts stay exactly as they are.</p>
        <p>To keep Pro features like group creation, longer calls and bigger files, you can upgrade at any time.</p>
        <p style="padding:12px 0">
          <a href="{{upgradeUrl}}" style="background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px;display:inline-block">Keep Pro</a>
        </p>
      </div>
    $$
)
ON CONFLICT (email_key) DO NOTHING;
