-- Reminders for members who signed up but have not finished the identity check. An admin sends
-- one from the member's details or to everyone still pending (admin.controller.js); at most one
-- per member per day, which kyc_reminded_at enforces and the admin panel shows.
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reminded_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reminder_count INTEGER NOT NULL DEFAULT 0;

-- Editable under Tools → System Emails. {{verifyUrl}} is the button: signing in from there leads
-- straight to the identity check.
INSERT INTO system_email_settings (email_key, subject, body_html) VALUES
(
  'kyc_reminder',
  'Finish verifying your identity on {{appName}}',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">You're one step away</h2>
        <p>Hi {{name}}, thanks for joining {{appName}}. Your account is ready, but you still need to verify your identity before you can start chatting.</p>
        <p>It only takes about 2 minutes: a photo of your ID and a quick selfie.</p>
        <p style="padding:12px 0">
          <a href="{{verifyUrl}}" style="background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px;display:inline-block">Verify my identity</a>
        </p>
        <p style="color:#6b7280;font-size:0.85rem">Your privacy comes first. Once your identity is successfully verified, your ID documents, selfie, and verification data are permanently deleted. {{appName}} only retains your verified name and confirmation that your identity has been verified.</p>
      </div>
    $$
)
ON CONFLICT (email_key) DO NOTHING;
