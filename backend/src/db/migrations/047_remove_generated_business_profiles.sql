-- This migration used to backfill a business profile for every verified domain, and an earlier
-- build created one automatically whenever an admin verified a website. That was wrong: a
-- business profile is something an admin chooses to create, and auto-creating it put a company
-- card on the personal profile of people who had never made one. Verification now only reveals
-- the Business Profile entry in Settings.
--
-- So this removes the profiles that were made on people's behalf, whether by the backfill or by
-- the auto-create. It is deliberately narrow: a profile goes only when every field its owner
-- could have filled in is still empty AND its name is still the one derived from the domain.
-- Anything an admin has touched — a logo, an about, a services list, even a renamed title —
-- is left alone. A blank profile someone did create by hand looks identical to a generated one,
-- so that one goes too; recreating it in Settings takes a moment.
--
-- It runs once. Every migration here re-runs on each deploy, and without the marker this would
-- keep deleting blank profiles that people create from now on.
CREATE TABLE IF NOT EXISTS one_off_backfills (
  name       TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM one_off_backfills WHERE name = 'business_profiles_backfill_undone') THEN
    RETURN;
  END IF;

  DELETE FROM businesses b
   WHERE b.about IS NULL
     AND b.logo_url IS NULL
     AND b.cover_url IS NULL
     AND b.founded_on IS NULL
     AND b.email IS NULL
     AND b.industry IS NULL
     AND b.headquarters IS NULL
     AND COALESCE(array_length(b.services, 1), 0) = 0
     -- Still named exactly what the generator would have called it:
     -- "gamble-how.co.uk" -> "Gamble How".
     AND b.name = initcap(replace(replace(split_part(b.domain, '.', 1), '-', ' '), '_', ' '));

  INSERT INTO one_off_backfills (name) VALUES ('business_profiles_backfill_undone');
END $$;
