-- Large chat files (over 100 MB) are deleted 30 days after upload to save disk space
-- (jobs/uploadCleanup.js); their messages stay, marked so the app shows "This file has expired"
-- instead of a broken video or link.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_expired BOOLEAN NOT NULL DEFAULT false;
