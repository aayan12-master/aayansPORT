-- ==============================================================================
-- AAYAN.Sec Portfolio — Non-Destructive Migration for Hero Scope Descriptors
-- Adds descriptor_1, descriptor_2, and descriptor_3 columns to hero_content table.
-- ==============================================================================

ALTER TABLE hero_content ADD COLUMN IF NOT EXISTS descriptor_1 TEXT DEFAULT '[ OFFENSIVE SECURITY ]';
ALTER TABLE hero_content ADD COLUMN IF NOT EXISTS descriptor_2 TEXT DEFAULT '[ WEB / MOBILE / CLOUD ]';
ALTER TABLE hero_content ADD COLUMN IF NOT EXISTS descriptor_3 TEXT DEFAULT '[ RESEARCH • EXPLOIT • BUILD ]';

-- Update existing 'current' row with defaults if null
UPDATE hero_content
SET
  descriptor_1 = COALESCE(descriptor_1, '[ OFFENSIVE SECURITY ]'),
  descriptor_2 = COALESCE(descriptor_2, '[ WEB / MOBILE / CLOUD ]'),
  descriptor_3 = COALESCE(descriptor_3, '[ RESEARCH • EXPLOIT • BUILD ]')
WHERE id = 'current';
