-- Business profiles are created the moment a domain is verified by its admin (see
-- ensureBusinessForDomain). Domains verified before that behaviour existed have no profile at
-- all, so their owners open Settings to an empty create form — the very thing the auto-create
-- was meant to remove. This backfills a starter profile for each of them: name from the domain,
-- everything else left for the owner to fill in.
--
-- Every migration re-runs on every deploy here, and this one must not: an owner who deletes
-- their business profile would get it back at the next deploy. The marker table makes it a
-- genuine one-off. It also means a profile deleted *before* this first run comes back once;
-- deleting it after that sticks.
CREATE TABLE IF NOT EXISTS one_off_backfills (
  name       TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE
  site   RECORD;
  v_name TEXT;
  v_slug TEXT;
  v_base TEXT;
  v_n    INT;
BEGIN
  IF EXISTS (SELECT 1 FROM one_off_backfills WHERE name = 'business_profiles_for_verified_domains') THEN
    RETURN;
  END IF;

  FOR site IN
    -- One row per domain; if two accounts somehow hold the same domain, the earliest wins,
    -- matching the "first verification owns it" rule the controller enforces.
    SELECT DISTINCT ON (domain) domain, user_id, url
      FROM (
        SELECT regexp_replace(
                 split_part(regexp_replace(lower(url), '^https?://', ''), '/', 1),
                 '^www\.', ''
               ) AS domain,
               user_id, url, created_at
          FROM verified_websites
         WHERE verified = true
      ) v
     WHERE domain <> ''
     ORDER BY domain, created_at
  LOOP
    CONTINUE WHEN EXISTS (SELECT 1 FROM businesses b WHERE b.domain = site.domain);

    -- "gamble-how.co.uk" -> "Gamble How", matching businessNameFromDomain() in JS.
    v_name := initcap(replace(replace(split_part(site.domain, '.', 1), '-', ' '), '_', ' '));

    -- Prefer the short slug; fall back to the whole domain, which is unique by table constraint.
    v_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
    IF length(v_slug) < 3
       OR v_slug IN ('u','b','chat','api','login','signup','admin','join','verify','settings',
                     'privacy','terms','cookies','kyc-policy','how-it-works','uploads','payment')
       OR EXISTS (SELECT 1 FROM businesses b WHERE b.slug = v_slug) THEN
      v_base := trim(both '-' from regexp_replace(lower(site.domain), '[^a-z0-9]+', '-', 'g'));
      v_slug := v_base;
      v_n := 1;
      WHILE EXISTS (SELECT 1 FROM businesses b WHERE b.slug = v_slug) LOOP
        v_n := v_n + 1;
        v_slug := v_base || '-' || v_n;
      END LOOP;
    END IF;

    INSERT INTO businesses (domain, slug, owner_id, name, website_url)
    VALUES (site.domain, v_slug, site.user_id, v_name, site.url)
    ON CONFLICT (domain) DO NOTHING;
  END LOOP;

  INSERT INTO one_off_backfills (name) VALUES ('business_profiles_for_verified_domains');
END $$;
