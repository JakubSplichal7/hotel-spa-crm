-- Part 1: add client types and new columns
-- Run this first, alone, then run 003b_remap_client_types.sql

DO $$ BEGIN
  ALTER TYPE account_type ADD VALUE 'company';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE account_type ADD VALUE 'individual';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS loyalty_tier TEXT;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS preferences TEXT;
