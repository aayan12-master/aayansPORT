-- Migration: Add social_links JSONB and SEO OpenGraph fields to site_settings
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Seed social_links from existing legacy columns if social_links is currently empty
UPDATE site_settings
SET social_links = jsonb_build_array(
  jsonb_build_object(
    'id', 'github',
    'platform', 'github',
    'label', 'GitHub',
    'url', COALESCE(NULLIF(github_url, ''), 'https://github.com/aayan-sec'),
    'icon', 'github',
    'display_order', 1,
    'enabled', true
  ),
  jsonb_build_object(
    'id', 'linkedin',
    'platform', 'linkedin',
    'label', 'LinkedIn',
    'url', COALESCE(NULLIF(linkedin_url, ''), 'https://linkedin.com/in/aayan-sec'),
    'icon', 'linkedin',
    'display_order', 2,
    'enabled', true
  ),
  jsonb_build_object(
    'id', 'twitter',
    'platform', 'twitter',
    'label', 'Twitter (X)',
    'url', COALESCE(NULLIF(twitter_url, ''), 'https://twitter.com/aayan_sec'),
    'icon', 'twitter',
    'display_order', 3,
    'enabled', true
  )
)
WHERE id = 'current' AND (social_links IS NULL OR social_links = '[]'::jsonb);
