-- ==============================================================================
-- AAYAN.Sec Portfolio — Non-Destructive Migration for Tools & Arsenal README Snapshot
-- Adds README snapshot, availability status, default branch, and refresh timestamp.
-- ==============================================================================

-- 1. Add README snapshot and GitHub metadata columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS readme_preview TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS readme_status TEXT DEFAULT 'available' CHECK (readme_status IN ('available', 'missing', 'error'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS default_branch TEXT DEFAULT 'main';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS readme_synced_at TIMESTAMPTZ;

-- 2. Create index on repo_url for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_projects_repo_url ON projects (repo_url);

-- 3. Create or replace 'tools' view pointing directly to 'projects'
CREATE OR REPLACE VIEW tools AS
  SELECT
    id,
    title,
    title AS name,
    slug,
    summary,
    description,
    readme_preview,
    readme_status,
    tech_stack,
    category,
    repo_url,
    demo_url,
    image_url,
    status,
    featured,
    display_order,
    default_branch,
    readme_synced_at,
    created_at,
    updated_at
  FROM projects;

-- 4. Ensure permissions for anon, authenticated, and service_role
GRANT SELECT ON tools TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated, service_role;
GRANT SELECT ON projects TO anon;
