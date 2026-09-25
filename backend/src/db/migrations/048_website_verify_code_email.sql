-- The representative verification-code email was the only one still hard-coded, because it
-- arrived with the business-email feature after the rest had already moved into the admin
-- panel. Seeding it here puts it alongside the others under Tools → System Emails, so its
-- wording and design can be edited without a deploy.
--
-- {{code}} is what makes this email work at all. The sender re-attaches it if a template edit
-- drops the placeholder, so a mistake here costs a plain-looking email rather than a user who
-- cannot verify.
INSERT INTO system_email_settings (email_key, subject, body_html) VALUES
(
  'website_verify_code',
  'Your {{appName}} verification code for {{domain}}',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Verify {{domain}}</h2>
        <p>Enter this code in {{appName}} to confirm you control <strong>{{domain}}</strong>. It expires in 15 minutes.</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.3em;color:#7c3aed;padding:16px 0">{{code}}</div>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't request this, you can ignore this email — nothing has been verified.</p>
      </div>
    $$
)
ON CONFLICT (email_key) DO NOTHING;
