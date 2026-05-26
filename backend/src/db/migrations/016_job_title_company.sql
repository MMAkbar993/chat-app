ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_representation_approved BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS website_representation_requests (
  id SERIAL PRIMARY KEY,
  website_url TEXT NOT NULL,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_url, requester_id)
);
