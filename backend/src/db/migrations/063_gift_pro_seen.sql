-- The "You've been upgraded" popup for free Pro from the Christmas giveaway (GiftProNotice.jsx):
-- the Pro end date the member has already been told about, kept on the account so the popup
-- shows once per win on any device, not once per browser. Safe to run on every deploy.
ALTER TABLE users ADD COLUMN IF NOT EXISTS gift_pro_seen_for TIMESTAMPTZ;
