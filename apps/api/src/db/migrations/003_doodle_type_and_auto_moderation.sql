-- Schema migration 003: Add doodle_type to feedback and support auto-moderated hold status

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'doodle_type'
  ) THEN
    ALTER TABLE feedback ADD COLUMN doodle_type VARCHAR(24) NOT NULL DEFAULT 'check' CHECK (doodle_type IN ('check', 'lightning', 'heart', 'spark', 'spiral', 'lightbulb', 'none'));
  END IF;
END $$;

-- Backfill any null doodle_type if present
UPDATE feedback
SET doodle_type = 'check'
WHERE doodle_type IS NULL;
