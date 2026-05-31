-- Clear stale users.website values for users who have no verified websites.
-- The old verification flow wrote to users.website; the new system uses verified_websites.
-- Any user with website_verified = false and no verified_websites rows has stale data.
UPDATE users
SET website = NULL, updated_at = NOW()
WHERE website IS NOT NULL
  AND website_verified = false
  AND id NOT IN (
    SELECT DISTINCT user_id FROM verified_websites WHERE verified = true
  );
