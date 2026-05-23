CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name              VARCHAR(255) NOT NULL,
  username               VARCHAR(100) UNIQUE NOT NULL,
  country                VARCHAR(100) NOT NULL,
  email                  VARCHAR(255) UNIQUE NOT NULL,
  primary_role           VARCHAR(50)  NOT NULL,
  phone                  VARCHAR(50),
  password_hash          VARCHAR(255) NOT NULL,
  stripe_customer_id     VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_plan      VARCHAR(20),
  subscription_status    VARCHAR(50) DEFAULT 'pending',
  kyc_status             VARCHAR(50) DEFAULT 'pending',
  kyc_session_id         VARCHAR(255),
  is_active              BOOLEAN DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
