-- Nothing can create a pending representation request any more: anyone with a company email
-- verifies it themselves in under a minute, which is quicker than waiting on an approval.
-- Requests still sitting in the queue would never be actioned, so they're cleared. Approved
-- and revoked rows are left exactly as they are.
DELETE FROM website_representation_requests WHERE status = 'pending';
