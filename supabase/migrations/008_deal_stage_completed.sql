-- Add Completed stage after Won in the offer pipeline
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'completed' AFTER 'won';
