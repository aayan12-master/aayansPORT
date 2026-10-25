-- Add spotlight and custom statistic label fields to hero_content
ALTER TABLE hero_content
  ADD COLUMN IF NOT EXISTS stat_1_label TEXT DEFAULT 'PROJECTS',
  ADD COLUMN IF NOT EXISTS stat_2_label TEXT DEFAULT 'WRITE-UPS',
  ADD COLUMN IF NOT EXISTS stat_3_label TEXT DEFAULT 'CURIOSITY',
  ADD COLUMN IF NOT EXISTS stat_1_override TEXT,
  ADD COLUMN IF NOT EXISTS stat_2_override TEXT,
  ADD COLUMN IF NOT EXISTS spotlight_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spotlight_mode TEXT NOT NULL DEFAULT 'alternate',
  ADD COLUMN IF NOT EXISTS spotlight_title TEXT DEFAULT 'OPEN FOR COLLABORATION',
  ADD COLUMN IF NOT EXISTS spotlight_subtitle TEXT DEFAULT 'Web Security • Authorized Penetration Testing',
  ADD COLUMN IF NOT EXISTS spotlight_cta_text TEXT DEFAULT 'INITIATE CONTACT →',
  ADD COLUMN IF NOT EXISTS spotlight_cta_url TEXT DEFAULT '#collaborate',
  ADD COLUMN IF NOT EXISTS spotlight_messages JSONB NOT NULL DEFAULT '[]'::jsonb;
