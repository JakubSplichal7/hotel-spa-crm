-- Ideas: add email + phone; contact is name only
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;
