-- Optional longer description on tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS description TEXT;
