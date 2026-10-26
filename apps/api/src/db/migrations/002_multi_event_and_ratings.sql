-- Schema migration 002: Multi-event management and 1-5 ratings upgrade

-- 0. If an old legacy table named 'events' without 'slug' exists (from another prototype), rename it safely
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'slug'
  ) THEN
    ALTER TABLE events RENAME TO legacy_college_buddy_events;
  END IF;
END $$;

-- 1. Create normalized events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  event_date DATE NOT NULL,
  venue VARCHAR(200) NOT NULL,
  description TEXT NULL,
  is_displayed_on_wall BOOLEAN NOT NULL DEFAULT true,
  is_accepting_feedback BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed inaugural "Tech Expo" event
INSERT INTO events (
  name,
  slug,
  event_date,
  venue,
  description,
  is_displayed_on_wall,
  is_accepting_feedback
) VALUES (
  'Tech Expo',
  'tech-expo-2026-10-23',
  '2026-10-23',
  'VPPCOE&VA, Sion',
  'Inaugural DevBappa Solutions Live Feedback Wall at Tech Expo',
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Add rating column to feedback table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'rating'
  ) THEN
    ALTER TABLE feedback ADD COLUMN rating SMALLINT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- 4. Add event_id referencing events(id) ON DELETE RESTRICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE feedback ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 5. Backfill all existing rows where event_id IS NULL with Tech Expo ID
UPDATE feedback
SET event_id = (SELECT id FROM events WHERE slug = 'tech-expo-2026-10-23' LIMIT 1)
WHERE event_id IS NULL;

-- 6. Enforce NOT NULL on feedback.event_id
ALTER TABLE feedback ALTER COLUMN event_id SET NOT NULL;

-- 7. Audit events table updates (support event-level audit logging)
ALTER TABLE audit_events ALTER COLUMN feedback_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_events' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE audit_events ADD COLUMN event_id UUID NULL REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE audit_events ALTER COLUMN action TYPE VARCHAR(64);

-- 8. Composite indexes for high performance
CREATE INDEX IF NOT EXISTS idx_feedback_event_public
  ON feedback(event_id, visibility_status, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_wall_accepting
  ON events(is_displayed_on_wall, is_accepting_feedback, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_event_time
  ON audit_events(event_id, timestamp DESC);
