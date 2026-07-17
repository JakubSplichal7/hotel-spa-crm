-- Soft flag: user declined setting linked booking to Completed when offer is Completed
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS completed_booking_declined BOOLEAN NOT NULL DEFAULT false;
