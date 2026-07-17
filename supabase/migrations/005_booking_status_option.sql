-- Add "option" booking status
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE 'option';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
