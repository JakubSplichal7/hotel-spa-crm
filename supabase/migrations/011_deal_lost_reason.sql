-- Required reason + detail when an offer is marked Lost
CREATE TYPE deal_lost_reason AS ENUM ('price', 'date', 'capacity', 'services');

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS lost_reason deal_lost_reason,
  ADD COLUMN IF NOT EXISTS lost_comment TEXT;
