INSERT INTO system_email_settings (email_key, subject, body_html) VALUES
(
  'invite',
  '{{senderName}} invited you to join {{appName}}',
  $$
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">{{senderName}} invited you to {{appName}}</h2>
        <p style="white-space:pre-wrap;border-left:3px solid #7c3aed;padding-left:12px">{{message}}</p>
        <p style="margin-top:20px"><a href="{{signupUrl}}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;display:inline-block">Join {{appName}}</a></p>
      </div>
    $$
)
ON CONFLICT (email_key) DO NOTHING;
