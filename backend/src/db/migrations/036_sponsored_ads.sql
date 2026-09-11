-- Sponsored placements: a single small card in the desktop sidebar and one row in the
-- mobile chat list. Served entirely first-party — the creative lives in our uploads
-- directory and clicks are counted by us — so no third-party ad script or tracking pixel
-- ever runs in a user's session and no user data leaves the platform.

CREATE TABLE IF NOT EXISTS ads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(120) NOT NULL,
  body         VARCHAR(300),
  image_url    TEXT,
  link_url     TEXT NOT NULL,
  link_text    VARCHAR(60) NOT NULL DEFAULT 'Learn More',
  -- Empty array means "show to everyone". Values are users.primary_role keys.
  target_roles TEXT[] NOT NULL DEFAULT '{}',
  active       BOOLEAN NOT NULL DEFAULT true,
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  -- Relative share of impressions when several ads match the same user.
  weight       INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
  clicks       BIGINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ads_active_idx ON ads (active, starts_at, ends_at);

-- One row per user per ad per day, so the impression count is daily uniques rather than a
-- number inflated by every re-render and reconnect. This is the figure we can defend to an
-- advertiser at renewal.
CREATE TABLE IF NOT EXISTS ad_impressions (
  ad_id   UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day     DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (ad_id, user_id, day)
);

CREATE INDEX IF NOT EXISTS ad_impressions_ad_day_idx ON ad_impressions (ad_id, day);

-- Dismissing hides that one ad for a week and lets a different one rotate in, rather than
-- suppressing the slot outright.
CREATE TABLE IF NOT EXISTS ad_dismissals (
  ad_id        UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ad_id, user_id)
);
