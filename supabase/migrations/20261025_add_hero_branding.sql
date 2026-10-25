-- Add hero branding columns for wordmark prefix, suffix, and role title
ALTER TABLE hero_content
  ADD COLUMN IF NOT EXISTS wordmark_prefix TEXT NOT NULL DEFAULT 'AAYAN',
  ADD COLUMN IF NOT EXISTS wordmark_suffix TEXT NOT NULL DEFAULT '.Sec',
  ADD COLUMN IF NOT EXISTS role_title TEXT NOT NULL DEFAULT 'SECURITY RESEARCHER / PENTESTER';

UPDATE hero_content
SET
  wordmark_prefix = COALESCE(wordmark_prefix, 'AAYAN'),
  wordmark_suffix = COALESCE(wordmark_suffix, '.Sec'),
  role_title = COALESCE(role_title, 'SECURITY RESEARCHER / PENTESTER')
WHERE id = 'current';
