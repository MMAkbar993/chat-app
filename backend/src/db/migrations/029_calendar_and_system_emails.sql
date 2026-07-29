CREATE TABLE IF NOT EXISTS google_calendar_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_email_settings (
  id         SERIAL PRIMARY KEY,
  email_key  VARCHAR(100) UNIQUE NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  subject    TEXT NOT NULL,
  body_html  TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seeded with today's exact hardcoded templates from backend/src/config/email.js, so behavior is
-- unchanged until an admin actually edits something.
INSERT INTO system_email_settings (email_key, subject, body_html) VALUES
(
  'password_reset_otp',
  'Your password reset code',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Reset your password</h2>
        <p>Use the code below to reset your password. It expires in 15 minutes.</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.3em;color:#7c3aed;padding:16px 0">{{otp}}</div>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't request this, you can ignore this email.</p>
      </div>
    $$
),
(
  'feedback_notification',
  '[{{label}}] Feedback from @{{username}}',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">{{label}}</h2>
        <p><strong>From:</strong> @{{username}} ({{userEmail}})</p>
        <p style="white-space:pre-wrap;border-left:3px solid #7c3aed;padding-left:12px">{{message}}</p>
      </div>
    $$
)
ON CONFLICT (email_key) DO NOTHING;
