-- Part 2: remap old hotel/spa types to company
-- Run AFTER 003_client_focus.sql has succeeded (separate query)

UPDATE accounts
SET type = 'company'
WHERE type IN ('hotel', 'spa', 'both');
