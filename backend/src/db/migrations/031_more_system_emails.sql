ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS unread_notified_at TIMESTAMPTZ;

INSERT INTO system_email_settings (email_key, subject, body_html) VALUES
(
  'welcome',
  'Welcome to {{appName}}, {{name}}!',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">You're verified — welcome to {{appName}}!</h2>
        <p>Hi {{name}}, your identity verification is complete and your account is fully active.</p>
        <p>You can now message, call and connect with anyone on {{appName}}.</p>
      </div>
    $$
),
(
  'unread_message',
  'You have an unread message on {{appName}}',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">You have an unread message</h2>
        <p>Hi {{name}}, {{senderName}} sent you a message on {{appName}} over a day ago and it's still unread.</p>
        <p style="color:#6b7280;font-size:0.85rem">Log in to {{appName}} to read and reply.</p>
      </div>
    $$
),
(
  'two_factor_enabled',
  'Two-factor authentication enabled',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">2FA is now enabled</h2>
        <p>Two-factor authentication was just turned on for your {{appName}} account.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't do this, contact support immediately.</p>
      </div>
    $$
),
(
  'password_changed',
  'Your password was changed',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Password updated</h2>
        <p>Your {{appName}} account password was just changed.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't do this, contact support immediately.</p>
      </div>
    $$
),
(
  'email_changed',
  'Your account email was changed',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Email address updated</h2>
        <p>The email address on your {{appName}} account was changed to {{newEmail}}.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't do this, contact support immediately.</p>
      </div>
    $$
),
(
  'website_verified',
  'Your website has been verified',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">You've successfully verified your website</h2>
        <p>{{url}} is now a verified website on your {{appName}} profile.</p>
        <p>Do you have employees? They can add their own verified website the same way — just have them go through the same verification flow from their profile settings.</p>
      </div>
    $$
),
(
  'admin_new_signup',
  '[{{appName}}] New signup: {{username}}',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">New signup</h2>
        <p><strong>Username:</strong> @{{username}}</p>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Name:</strong> {{fullName}}</p>
      </div>
    $$
)
ON CONFLICT (email_key) DO NOTHING;
