-- Whether the sponsored-ad logo gets the thin card border around it. Defaults to true so
-- existing ads keep rendering exactly as they do today; an admin can turn it off per-ad for
-- a logo that already has its own edge (a badge, a rounded mark) where a second border read
-- as a stray outline rather than a frame.
ALTER TABLE ads ADD COLUMN IF NOT EXISTS logo_border BOOLEAN NOT NULL DEFAULT true;
