-- Soft pairing flags between offers (deals) and bookings.
-- One offer → one booking in the UI for now; deal_id stays many-capable (no unique constraint).

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS booking_create_declined BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_booking_declined BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS needs_confirmation BOOLEAN NOT NULL DEFAULT false;

-- Draft bookings created from offers may not have dates until confirmed
ALTER TABLE bookings ALTER COLUMN start_date DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_deal_id ON bookings (deal_id);
