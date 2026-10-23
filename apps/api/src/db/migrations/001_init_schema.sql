-- Schema migration 001: Initial schema for DevBappa Live Feedback Wall
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(60) NOT NULL,
  public_display_name VARCHAR(60) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('Student', 'Faculty', 'Other Visitor')),
  department VARCHAR(100),
  designation VARCHAR(100),
  institution_name VARCHAR(150),
  message TEXT NOT NULL,
  visibility_status VARCHAR(20) NOT NULL DEFAULT 'visible' CHECK (visibility_status IN ('visible', 'hidden')),
  deleted_at TIMESTAMP WITH TIME ZONE NULL,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  color_variant VARCHAR(20) NOT NULL DEFAULT 'yellow',
  pin_variant VARCHAR(20) NOT NULL DEFAULT 'brass',
  size_variant VARCHAR(20) NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Canvas Layout table (1:1 relation with feedback)
CREATE TABLE IF NOT EXISTS canvas_layout (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE UNIQUE,
  world_x DOUBLE PRECISION NOT NULL,
  world_y DOUBLE PRECISION NOT NULL,
  rotation DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  width DOUBLE PRECISION NOT NULL DEFAULT 240.0,
  height DOUBLE PRECISION NOT NULL DEFAULT 240.0,
  layer_order INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users table
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR(128) PRIMARY KEY,
  admin_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Events table
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id VARCHAR(64) NOT NULL,
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  correlation_id VARCHAR(128)
);

-- Indexes for performance and query optimization
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_role ON feedback(role);
CREATE INDEX IF NOT EXISTS idx_feedback_visibility ON feedback(visibility_status);
CREATE INDEX IF NOT EXISTS idx_feedback_deleted_at ON feedback(deleted_at);
CREATE INDEX IF NOT EXISTS idx_feedback_public_query ON feedback(created_at DESC) WHERE deleted_at IS NULL AND visibility_status = 'visible';
CREATE INDEX IF NOT EXISTS idx_feedback_idempotency ON feedback(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_canvas_layout_coords ON canvas_layout(world_x, world_y);
CREATE INDEX IF NOT EXISTS idx_canvas_layout_layer ON canvas_layout(layer_order);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_feedback_time ON audit_events(feedback_id, timestamp DESC);
