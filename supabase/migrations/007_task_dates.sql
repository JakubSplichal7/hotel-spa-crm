-- Date-only completion stamp; due dates treated as calendar days
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completed_at DATE;

-- Store due as date (no time-of-day)
ALTER TABLE tasks
  ALTER COLUMN due_at TYPE DATE
  USING (
    CASE
      WHEN due_at IS NULL THEN NULL
      ELSE (due_at AT TIME ZONE 'UTC')::date
    END
  );
