-- ==============================================================================
-- AAYAN.SEC PORTFOLIO CMS — COMPLETE SUPABASE SCHEMA & RLS POLICIES
-- Paste this entire file into the Supabase SQL Editor to set up the database.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TRIGGER FUNCTION: AUTO UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ADMIN PROFILES & ALLOWLIST (Strict Role-Based Authorization)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function: verify if current authenticated caller is active admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$;

-- 4. SITE SETTINGS & METADATA
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  site_title TEXT NOT NULL DEFAULT 'AAYAN.Sec — Security Researcher & Penetration Tester',
  site_description TEXT NOT NULL DEFAULT 'Offensive security researcher and penetration tester dossier.',
  footer_brand TEXT NOT NULL DEFAULT 'AAYAN.SEC',
  footer_text TEXT NOT NULL DEFAULT 'SECURITY RESEARCH DOSSIER // 2025',
  footer_subtext TEXT NOT NULL DEFAULT 'BUILT WITH PRECISION',
  status_text TEXT NOT NULL DEFAULT 'OPEN FOR COLLABORATION',
  open_for_collaboration BOOLEAN NOT NULL DEFAULT true,
  contact_email TEXT NOT NULL DEFAULT 'contact@aayan-sec.com',
  github_url TEXT NOT NULL DEFAULT 'https://github.com/aayan-sec',
  linkedin_url TEXT NOT NULL DEFAULT 'https://linkedin.com/in/aayan-sec',
  twitter_url TEXT NOT NULL DEFAULT 'https://twitter.com/aayan_sec',
  pgp_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. HERO / OVERVIEW CONTENT
CREATE TABLE IF NOT EXISTS hero_content (
  id TEXT PRIMARY KEY DEFAULT 'current',
  brand_name TEXT NOT NULL DEFAULT 'AAYAN.',
  headline TEXT NOT NULL DEFAULT 'SECURITY RESEARCHER & PENTESTER',
  manifesto_line_1 TEXT NOT NULL DEFAULT 'EXPLORING SYSTEMS.',
  manifesto_line_2 TEXT NOT NULL DEFAULT 'FINDING FLAWS.',
  manifesto_line_3 TEXT NOT NULL DEFAULT 'CREATING IMPACT.',
  status_label TEXT NOT NULL DEFAULT 'OPEN FOR COLLABORATION',
  status_subtext TEXT NOT NULL DEFAULT 'Research • Bug Bounty • Projects',
  stat_projects TEXT NOT NULL DEFAULT '10+',
  stat_writeups TEXT NOT NULL DEFAULT '5+',
  stat_curiosity TEXT NOT NULL DEFAULT '∞',
  quote TEXT NOT NULL DEFAULT 'CURIOSITY ALWAYS FINDS A WAY IN.',
  cta_text TEXT NOT NULL DEFAULT 'VIEW MY RESEARCH',
  cta_target TEXT NOT NULL DEFAULT 'research',
  descriptor_1 TEXT NOT NULL DEFAULT '[ OFFENSIVE SECURITY ]',
  descriptor_2 TEXT NOT NULL DEFAULT '[ WEB / MOBILE / CLOUD ]',
  descriptor_3 TEXT NOT NULL DEFAULT '[ RESEARCH • EXPLOIT • BUILD ]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_hero_content_updated_at ON hero_content;
CREATE TRIGGER update_hero_content_updated_at
  BEFORE UPDATE ON hero_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. ABOUT / BACKGROUND CONTENT
CREATE TABLE IF NOT EXISTS about_content (
  id TEXT PRIMARY KEY DEFAULT 'current',
  status_badge TEXT NOT NULL DEFAULT 'ACTIVE RESEARCHER',
  spec_text TEXT NOT NULL DEFAULT 'OFFENSIVE SECURITY & PENTESTING',
  bio_paragraph_1 TEXT NOT NULL,
  bio_paragraph_2 TEXT NOT NULL,
  motto_quote TEXT NOT NULL DEFAULT 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_about_content_updated_at ON about_content;
CREATE TRIGGER update_about_content_updated_at
  BEFORE UPDATE ON about_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. RESEARCH DOMAINS
CREATE TABLE IF NOT EXISTS research_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_num TEXT NOT NULL,
  domain_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_research_domains_updated_at ON research_domains;
CREATE TRIGGER update_research_domains_updated_at
  BEFORE UPDATE ON research_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. METHODOLOGY STEPS
CREATE TABLE IF NOT EXISTS methodology_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_num TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_methodology_steps_updated_at ON methodology_steps;
CREATE TRIGGER update_methodology_steps_updated_at
  BEFORE UPDATE ON methodology_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. PROJECTS & ARSENAL
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Security Tool',
  repo_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  readme_preview TEXT,
  readme_status TEXT DEFAULT 'available' CHECK (readme_status IN ('available', 'missing', 'error')),
  default_branch TEXT DEFAULT 'main',
  readme_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects (slug);
CREATE INDEX IF NOT EXISTS idx_projects_repo_url ON projects (repo_url);

-- View: tools (direct alias mapping to projects)
CREATE OR REPLACE VIEW tools AS SELECT * FROM projects;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. RESEARCH POSTS & ADVISORIES
CREATE TABLE IF NOT EXISTS research_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Critical', 'High', 'Medium', 'Low', 'Info')),
  cve_id TEXT,
  published_date TEXT NOT NULL,
  tags TEXT NOT NULL,
  external_url TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_status ON research_posts (status);
CREATE INDEX IF NOT EXISTS idx_research_slug ON research_posts (slug);

DROP TRIGGER IF EXISTS update_research_posts_updated_at ON research_posts;
CREATE TRIGGER update_research_posts_updated_at
  BEFORE UPDATE ON research_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. SKILLS MATRIX
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_num TEXT NOT NULL,
  category_title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  tools TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_skills_updated_at ON skills;
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. CONTACT SUBMISSIONS
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions (status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Helper to safely drop existing policies
DO $$
BEGIN
  -- admin_profiles
  DROP POLICY IF EXISTS "Admins can view admin profiles" ON admin_profiles;
  DROP POLICY IF EXISTS "Admins can manage admin profiles" ON admin_profiles;
  -- site_settings
  DROP POLICY IF EXISTS "Public read access to site_settings" ON site_settings;
  DROP POLICY IF EXISTS "Admin write access to site_settings" ON site_settings;
  -- hero_content
  DROP POLICY IF EXISTS "Public read access to hero_content" ON hero_content;
  DROP POLICY IF EXISTS "Admin write access to hero_content" ON hero_content;
  -- about_content
  DROP POLICY IF EXISTS "Public read access to about_content" ON about_content;
  DROP POLICY IF EXISTS "Admin write access to about_content" ON about_content;
  -- research_domains
  DROP POLICY IF EXISTS "Public read access to research_domains" ON research_domains;
  DROP POLICY IF EXISTS "Admin write access to research_domains" ON research_domains;
  -- methodology_steps
  DROP POLICY IF EXISTS "Public read access to methodology_steps" ON methodology_steps;
  DROP POLICY IF EXISTS "Admin write access to methodology_steps" ON methodology_steps;
  -- projects
  DROP POLICY IF EXISTS "Public read published projects" ON projects;
  DROP POLICY IF EXISTS "Authenticated users with admin role can view all projects" ON projects;
  DROP POLICY IF EXISTS "Admin write access to projects" ON projects;
  -- research_posts
  DROP POLICY IF EXISTS "Public read published research posts" ON research_posts;
  DROP POLICY IF EXISTS "Authenticated users with admin role can view all research posts" ON research_posts;
  DROP POLICY IF EXISTS "Admin write access to research_posts" ON research_posts;
  -- skills
  DROP POLICY IF EXISTS "Public read published skills" ON skills;
  DROP POLICY IF EXISTS "Authenticated users with admin role can view all skills" ON skills;
  DROP POLICY IF EXISTS "Admin write access to skills" ON skills;
  -- contact_submissions
  DROP POLICY IF EXISTS "Public can submit contact inquiries" ON contact_submissions;
  DROP POLICY IF EXISTS "Admin can view and manage contact submissions" ON contact_submissions;
END $$;

-- A. ADMIN PROFILES
CREATE POLICY "Admins can view admin profiles"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can manage admin profiles"
  ON admin_profiles FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- B. SITE SETTINGS
CREATE POLICY "Public read access to site_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin write access to site_settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- C. HERO CONTENT
CREATE POLICY "Public read access to hero_content"
  ON hero_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin write access to hero_content"
  ON hero_content FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- D. ABOUT CONTENT
CREATE POLICY "Public read access to about_content"
  ON about_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin write access to about_content"
  ON about_content FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- E. RESEARCH DOMAINS
CREATE POLICY "Public read access to research_domains"
  ON research_domains FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin write access to research_domains"
  ON research_domains FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- F. METHODOLOGY STEPS
CREATE POLICY "Public read access to methodology_steps"
  ON methodology_steps FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin write access to methodology_steps"
  ON methodology_steps FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- G. PROJECTS (Strict Draft/Published Enforcement)
CREATE POLICY "Public read published projects"
  ON projects FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Authenticated users with admin role can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING ((status = 'published') OR is_admin());

CREATE POLICY "Admin write access to projects"
  ON projects FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- H. RESEARCH POSTS (Strict Draft/Published Enforcement)
CREATE POLICY "Public read published research posts"
  ON research_posts FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Authenticated users with admin role can view all research posts"
  ON research_posts FOR SELECT
  TO authenticated
  USING ((status = 'published') OR is_admin());

CREATE POLICY "Admin write access to research_posts"
  ON research_posts FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- I. SKILLS MATRIX
CREATE POLICY "Public read published skills"
  ON skills FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Authenticated users with admin role can view all skills"
  ON skills FOR SELECT
  TO authenticated
  USING ((status = 'published') OR is_admin());

CREATE POLICY "Admin write access to skills"
  ON skills FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- J. CONTACT SUBMISSIONS
CREATE POLICY "Public can submit contact inquiries"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(sender_name) > 0 AND
    char_length(sender_email) > 3 AND
    char_length(message) > 5
  );

CREATE POLICY "Admin can view and manage contact submissions"
  ON contact_submissions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 13. SCHEMA PERMISSIONS FOR SUPABASE ROLES
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

