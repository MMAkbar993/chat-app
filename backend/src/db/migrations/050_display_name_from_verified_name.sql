-- The name members see must come from the ID. Before this, display_name could be any saved
-- value (the dropdown kept an old choice selectable even when it was not a rendering of the
-- verified name), so some members show a name that is not theirs on paper. This brings every
-- existing account into line, once:
--   1. a full_name in capitals with no lower case ("IVAN PETROV") is tidied ("Ivan Petrov"),
--      the same rule utils/names.js applies to new verifications;
--   2. a display_name that is not one of the renderings the Settings dropdown offers — the full
--      name, one part of it (a suffix alone does not count), or the first name with a later
--      part — is reset to the full name.
-- Runs once (one_off_backfills), since every migration here re-runs on each deploy. The number
-- of accounts changed is printed as a NOTICE in the migration output.
CREATE TABLE IF NOT EXISTS one_off_backfills (
  name       TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE
  u        RECORD;
  v_full   TEXT;
  v_disp   TEXT;
  v_parts  TEXT[];
  v_ok     BOOLEAN;
  v_count  INT := 0;
  i        INT;
BEGIN
  IF EXISTS (SELECT 1 FROM one_off_backfills WHERE name = 'display_name_from_verified_name') THEN
    RETURN;
  END IF;

  FOR u IN SELECT id, full_name, display_name FROM users WHERE is_admin = false AND full_name IS NOT NULL LOOP
    v_full := regexp_replace(btrim(u.full_name), '\s+', ' ', 'g');
    IF v_full ~ '[[:upper:]]' AND v_full !~ '[[:lower:]]' THEN
      v_full := initcap(v_full);
    END IF;

    v_disp := btrim(COALESCE(u.display_name, ''));
    IF v_disp ~ '[[:upper:]]' AND v_disp !~ '[[:lower:]]' THEN
      v_disp := initcap(v_disp);
    END IF;

    v_parts := regexp_split_to_array(v_full, ' ');
    v_ok := v_disp = v_full
         OR (v_disp = ANY (v_parts) AND lower(v_disp) NOT IN ('jr', 'jr.', 'snr', 'sr', 'sr.', 'ii', 'iii', 'iv'));
    IF NOT v_ok AND array_length(v_parts, 1) > 2 THEN
      FOR i IN 2 .. array_length(v_parts, 1) LOOP
        IF v_disp = v_parts[1] || ' ' || v_parts[i] THEN v_ok := TRUE; END IF;
      END LOOP;
    END IF;
    IF NOT v_ok THEN
      v_disp := v_full;
    END IF;

    IF v_full IS DISTINCT FROM u.full_name OR v_disp IS DISTINCT FROM u.display_name THEN
      UPDATE users SET full_name = v_full, display_name = v_disp, updated_at = NOW() WHERE id = u.id;
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'display_name_from_verified_name: % account(s) updated', v_count;
  INSERT INTO one_off_backfills (name) VALUES ('display_name_from_verified_name');
END $$;
