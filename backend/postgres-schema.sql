BEGIN;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  provider_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  provider_id TEXT,
  customer_id TEXT,
  created_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  created_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_records (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT,
  provider_id TEXT,
  request_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id TEXT PRIMARY KEY,
  provider_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_locations (
  provider_id TEXT PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS device_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  created_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_customer ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_provider ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workflows_user_type ON workflow_records(user_id, type);
CREATE INDEX IF NOT EXISTS idx_workflows_provider_type ON workflow_records(provider_id, type);
CREATE INDEX IF NOT EXISTS idx_workflows_request ON workflow_records(request_id);

INSERT INTO meta(key,value) VALUES('schemaVersion','6')
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value;

COMMIT;
