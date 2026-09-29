-- A short "what I'm up to" line on a profile, separate from bio: bio is who you are, status is
-- what's true this week ("At SiGMA next month", "Open to partnerships"). Capped at 100
-- characters in the UI and here, so it stays a line rather than becoming a second bio.
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(100);
