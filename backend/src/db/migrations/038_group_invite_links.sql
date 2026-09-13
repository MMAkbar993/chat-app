-- Shareable join links for groups. The code is what's in the URL, so it's generated randomly
-- rather than derived from the group id — a sequential or guessable code would let anyone
-- enumerate their way into private groups.
--
-- Nullable by design: a group has no link until an admin creates one, and revoking is just
-- replacing the code, which instantly invalidates every copy of the old link already shared.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS invite_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_invite_code_idx
  ON conversations (invite_code) WHERE invite_code IS NOT NULL;
