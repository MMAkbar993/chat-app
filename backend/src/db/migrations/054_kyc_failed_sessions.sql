-- Failed identity checks, kept so an admin can review them in the Didit dashboard. A successful
-- check is deleted at Didit straight away (verify and purge, kyc.service.js); a failed one is
-- recorded here instead and deleted 30 days after it failed (jobs/purgeKycSessions.js), or
-- sooner once the member is verified or an admin approves them or lets them retry.
-- Separate from users.kyc_session_id because a member who failed usually starts a new check
-- straight away, which would otherwise replace the failed one before anyone could look at it.
CREATE TABLE IF NOT EXISTS kyc_failed_sessions (
  session_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  didit_status TEXT,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_failed_sessions_user ON kyc_failed_sessions (user_id);
