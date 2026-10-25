-- Add independent stat visibility toggles and auto-rotate option
ALTER TABLE hero_content
  ADD COLUMN IF NOT EXISTS stat_1_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stat_2_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stat_3_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS spotlight_auto_rotate BOOLEAN NOT NULL DEFAULT true;
