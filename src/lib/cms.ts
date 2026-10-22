import { getDb } from './db';
import { getSupabaseServerClient, isSupabaseConfigured } from './supabase/server';
import { getSupabaseAdminClient } from './supabase/admin';

export interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  footer_brand: string;
  footer_text: string;
  footer_subtext: string;
  status_text: string;
  open_for_collaboration: boolean;
  contact_email: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  pgp_key?: string;
  updated_at?: string;
}

export interface HeroContent {
  id: string;
  brand_name: string;
  headline: string;
  manifesto_line_1: string;
  manifesto_line_2: string;
  manifesto_line_3: string;
  status_label: string;
  status_subtext: string;
  stat_projects: string;
  stat_writeups: string;
  stat_curiosity: string;
  quote: string;
  cta_text: string;
  cta_target: string;
  updated_at?: string;
}

export interface AboutContent {
  id: string;
  status_badge: string;
  spec_text: string;
  bio_paragraph_1: string;
  bio_paragraph_2: string;
  motto_quote: string;
  updated_at?: string;
}

export interface ResearchDomain {
  id: string | number;
  domain_num: string;
  domain_code: string;
  title: string;
  description: string;
  display_order: number;
}

export interface MethodologyStep {
  id: string | number;
  step_num: string;
  title: string;
  description: string;
  display_order: number;
}

export interface Project {
  id: string | number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  tech_stack: string;
  category: string;
  repo_url?: string;
  demo_url?: string;
  image_url?: string;
  status: 'published' | 'draft';
  featured: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ResearchPost {
  id: string | number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  cve_id?: string;
  published_date: string;
  tags: string;
  external_url?: string;
  image_url?: string;
  status: 'published' | 'draft';
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SkillCategory {
  id: string | number;
  category_num: string;
  category_title: string;
  description: string;
  skills: string[];
  tools: string[];
  display_order: number;
  status: 'published' | 'draft';
}

export interface ContactSubmission {
  id: string | number;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  ip_address?: string;
  created_at?: string;
}

export interface DashboardStats {
  projects: {
    total: number;
    published: number;
    draft: number;
  };
  research: {
    total: number;
    published: number;
    draft: number;
  };
  skills: {
    totalCategories: number;
  };
  submissions: {
    total: number;
    unread: number;
  };
  backend: 'supabase' | 'local_sqlite';
  lastUpdated?: string;
}

// -----------------------------------------------------------------------------
// 1. SITE SETTINGS
// -----------------------------------------------------------------------------
export async function getSiteSettings(): Promise<SiteSettings> {
  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'current')
        .single();
      if (!error && data) return data as SiteSettings;
    }
  }

  // Local SQLite fallback
  const db = getDb();
  const row = db.prepare('SELECT * FROM site_settings WHERE id = ?').get('current') as any;
  if (row) {
    return {
      ...row,
      open_for_collaboration: Boolean(row.open_for_collaboration),
    };
  }

  return {
    id: 'current',
    site_title: 'AAYAN.Sec — Security Researcher & Penetration Tester',
    site_description: 'Offensive security researcher and penetration tester dossier.',
    footer_brand: 'AAYAN.SEC',
    footer_text: 'SECURITY RESEARCH DOSSIER // 2025',
    footer_subtext: 'BUILT WITH PRECISION',
    status_text: 'OPEN FOR COLLABORATION',
    open_for_collaboration: true,
    contact_email: 'contact@aayan-sec.com',
    github_url: 'https://github.com/aayan-sec',
    linkedin_url: 'https://linkedin.com/in/aayan-sec',
    twitter_url: 'https://twitter.com/aayan_sec',
  };
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ id: 'current', ...settings, updated_at: new Date().toISOString() });
      if (!error) return true;
    }
  }

  const db = getDb();
  const fields = Object.keys(settings).filter((k) => k !== 'id' && k !== 'updated_at');
  if (fields.length === 0) return true;

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => {
    const val = (settings as any)[f];
    return typeof val === 'boolean' ? (val ? 1 : 0) : val;
  });

  db.prepare(`UPDATE site_settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = 'current'`).run(...values);
  return true;
}

// -----------------------------------------------------------------------------
// 2. HERO CONTENT
// -----------------------------------------------------------------------------
export async function getHeroContent(): Promise<HeroContent> {
  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('hero_content')
        .select('*')
        .eq('id', 'current')
        .single();
      if (!error && data) return data as HeroContent;
    }
  }

  const db = getDb();
  const row = db.prepare('SELECT * FROM hero_content WHERE id = ?').get('current') as any;
  if (row) return row as HeroContent;

  return {
    id: 'current',
    brand_name: 'AAYAN.',
    headline: 'SECURITY RESEARCHER & PENTESTER',
    manifesto_line_1: 'EXPLORING SYSTEMS.',
    manifesto_line_2: 'FINDING FLAWS.',
    manifesto_line_3: 'CREATING IMPACT.',
    status_label: 'OPEN FOR COLLABORATION',
    status_subtext: 'Research • Bug Bounty • Projects',
    stat_projects: '10+',
    stat_writeups: '5+',
    stat_curiosity: '∞',
    quote: 'CURIOSITY ALWAYS FINDS A WAY IN.',
    cta_text: 'VIEW MY RESEARCH',
    cta_target: 'research',
  };
}

export async function updateHeroContent(content: Partial<HeroContent>): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase
        .from('hero_content')
        .upsert({ id: 'current', ...content, updated_at: new Date().toISOString() });
      if (!error) return true;
    }
  }

  const db = getDb();
  const fields = Object.keys(content).filter((k) => k !== 'id' && k !== 'updated_at');
  if (fields.length === 0) return true;

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => (content as any)[f]);

  db.prepare(`UPDATE hero_content SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = 'current'`).run(...values);
  return true;
}

// -----------------------------------------------------------------------------
// 3. ABOUT CONTENT, DOMAINS & METHODOLOGY
// -----------------------------------------------------------------------------
export async function getAboutContent(): Promise<{
  about: AboutContent;
  domains: ResearchDomain[];
  methodology: MethodologyStep[];
}> {
  let about: AboutContent | null = null;
  let domains: ResearchDomain[] = [];
  let methodology: MethodologyStep[] = [];

  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data: aboutData } = await supabase
        .from('about_content')
        .select('*')
        .eq('id', 'current')
        .single();
      if (aboutData) about = aboutData as AboutContent;

      const { data: domainData } = await supabase
        .from('research_domains')
        .select('*')
        .order('display_order', { ascending: true });
      if (domainData) domains = domainData as ResearchDomain[];

      const { data: methData } = await supabase
        .from('methodology_steps')
        .select('*')
        .order('display_order', { ascending: true });
      if (methData) methodology = methData as MethodologyStep[];
    }
  }

  const db = getDb();
  if (!about) {
    about = db.prepare('SELECT * FROM about_content WHERE id = ?').get('current') as any;
  }
  if (domains.length === 0) {
    domains = db.prepare('SELECT * FROM research_domains ORDER BY display_order ASC').all() as any;
  }
  if (methodology.length === 0) {
    methodology = db.prepare('SELECT * FROM methodology_steps ORDER BY display_order ASC').all() as any;
  }

  return {
    about: about || {
      id: 'current',
      status_badge: 'ACTIVE RESEARCHER',
      spec_text: 'OFFENSIVE SECURITY & PENTESTING',
      bio_paragraph_1: 'Aayan is an offensive security researcher...',
      bio_paragraph_2: 'Approaching security research with an inquisitive...',
      motto_quote: 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
    },
    domains,
    methodology,
  };
}

export async function updateAboutContent(data: Partial<AboutContent>): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase
        .from('about_content')
        .upsert({ id: 'current', ...data, updated_at: new Date().toISOString() });
      if (!error) return true;
    }
  }

  const db = getDb();
  const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'updated_at');
  if (fields.length === 0) return true;

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => (data as any)[f]);

  db.prepare(`UPDATE about_content SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = 'current'`).run(...values);
  return true;
}

export async function updateResearchDomain(id: string | number, domain: Partial<ResearchDomain>): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('research_domains').update(domain).eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  const fields = Object.keys(domain).filter((k) => k !== 'id');
  if (fields.length === 0) return true;

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => (domain as any)[f]);
  db.prepare(`UPDATE research_domains SET ${setClause} WHERE id = ?`).run(...values, id);
  return true;
}

export async function updateMethodologyStep(id: string | number, step: Partial<MethodologyStep>): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('methodology_steps').update(step).eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  const fields = Object.keys(step).filter((k) => k !== 'id');
  if (fields.length === 0) return true;

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => (step as any)[f]);
  db.prepare(`UPDATE methodology_steps SET ${setClause} WHERE id = ?`).run(...values, id);
  return true;
}

// -----------------------------------------------------------------------------
// 4. PROJECTS / ARSENAL
// -----------------------------------------------------------------------------
export async function getProjects(options: { publishedOnly?: boolean } = {}): Promise<Project[]> {
  const publishedOnly = options.publishedOnly ?? true;

  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      let query = supabase.from('projects').select('*').order('display_order', { ascending: true });
      if (publishedOnly) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map((p) => ({
          ...p,
          featured: Boolean(p.featured),
        })) as Project[];
      }
    }
  }

  const db = getDb();
  let sql = 'SELECT * FROM projects';
  if (publishedOnly) {
    sql += " WHERE status = 'published' OR status = 'active'";
  }
  sql += ' ORDER BY id ASC';

  const rows = db.prepare(sql).all() as any[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    summary: r.summary,
    description: r.description,
    tech_stack: r.tech_stack,
    category: r.category,
    repo_url: r.repo_url,
    demo_url: r.demo_url,
    image_url: r.image_url,
    status: (r.status === 'active' || r.status === 'published' ? 'published' : 'draft') as 'published' | 'draft',
    featured: Boolean(r.featured),
    display_order: r.display_order ?? r.id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: project.title,
          slug: project.slug,
          summary: project.summary,
          description: project.description,
          tech_stack: project.tech_stack,
          category: project.category,
          repo_url: project.repo_url,
          demo_url: project.demo_url,
          image_url: project.image_url,
          status: project.status,
          featured: project.featured,
          display_order: project.display_order || 0,
        })
        .select()
        .single();
      if (!error && data) return data as Project;
    }
  }

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO projects (title, slug, summary, description, tech_stack, category, repo_url, demo_url, status, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    project.title,
    project.slug,
    project.summary,
    project.description,
    project.tech_stack,
    project.category,
    project.repo_url || null,
    project.demo_url || null,
    project.status,
    project.featured ? 1 : 0
  );

  return {
    ...project,
    id: Number(result.lastInsertRowid),
  };
}

export async function updateProject(id: string | number, updates: Partial<Project>): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  const fields = Object.keys(updates).filter((k) => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
  if (fields.length === 0) return true;

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => {
    const v = (updates as any)[f];
    return typeof v === 'boolean' ? (v ? 1 : 0) : v;
  });

  db.prepare(`UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
  return true;
}

export async function deleteProject(id: string | number): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return true;
}

// -----------------------------------------------------------------------------
// 5. RESEARCH POSTS & ADVISORIES
// -----------------------------------------------------------------------------
export async function getResearchPosts(options: { publishedOnly?: boolean } = {}): Promise<ResearchPost[]> {
  const publishedOnly = options.publishedOnly ?? true;

  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      let query = supabase.from('research_posts').select('*').order('published_date', { ascending: false });
      if (publishedOnly) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query;
      if (!error && data) return data as ResearchPost[];
    }
  }

  const db = getDb();
  let sql = 'SELECT * FROM research_posts';
  if (publishedOnly) {
    sql += " WHERE status = 'published'";
  }
  sql += ' ORDER BY published_date DESC';

  return db.prepare(sql).all() as any[];
}

export async function createResearchPost(post: Omit<ResearchPost, 'id'>): Promise<ResearchPost> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { data, error } = await supabase
        .from('research_posts')
        .insert({
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          content: post.content,
          category: post.category,
          severity: post.severity,
          cve_id: post.cve_id || null,
          published_date: post.published_date,
          tags: post.tags,
          external_url: post.external_url || null,
          image_url: post.image_url || null,
          status: post.status,
          display_order: post.display_order || 0,
        })
        .select()
        .single();
      if (!error && data) return data as ResearchPost;
    }
  }

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO research_posts (title, slug, summary, content, category, severity, cve_id, published_date, tags, external_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    post.title,
    post.slug,
    post.summary,
    post.content,
    post.category,
    post.severity,
    post.cve_id || null,
    post.published_date,
    post.tags,
    post.external_url || null,
    post.status
  );

  return {
    ...post,
    id: Number(result.lastInsertRowid),
  };
}

export async function updateResearchPost(id: string | number, updates: Partial<ResearchPost>): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('research_posts').update(updates).eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  const fields = Object.keys(updates).filter((k) => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
  if (fields.length === 0) return true;

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => (updates as any)[f]);

  db.prepare(`UPDATE research_posts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
  return true;
}

export async function deleteResearchPost(id: string | number): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('research_posts').delete().eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  db.prepare('DELETE FROM research_posts WHERE id = ?').run(id);
  return true;
}

// -----------------------------------------------------------------------------
// 6. SKILLS MATRIX
// -----------------------------------------------------------------------------
export async function getSkills(options: { publishedOnly?: boolean } = {}): Promise<SkillCategory[]> {
  const publishedOnly = options.publishedOnly ?? true;

  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      let query = supabase.from('skills').select('*').order('display_order', { ascending: true });
      if (publishedOnly) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as SkillCategory[];
      }
    }
  }

  const db = getDb();
  let sql = 'SELECT * FROM skills';
  if (publishedOnly) {
    sql += " WHERE status = 'published'";
  }
  sql += ' ORDER BY display_order ASC';

  const rows = db.prepare(sql).all() as any[];
  return rows.map((r) => ({
    id: r.id,
    category_num: r.category_num,
    category_title: r.category_title,
    description: r.description,
    skills: JSON.parse(r.skills_json || '[]'),
    tools: JSON.parse(r.tools_json || '[]'),
    display_order: r.display_order,
    status: r.status,
  }));
}

export async function updateSkillCategory(id: string | number, updates: Partial<SkillCategory>): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('skills').update(updates).eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  const fields = Object.keys(updates).filter((k) => k !== 'id');
  if (fields.length === 0) return true;

  const setClause: string[] = [];
  const values: any[] = [];

  for (const key of fields) {
    if (key === 'skills') {
      setClause.push('skills_json = ?');
      values.push(JSON.stringify(updates.skills));
    } else if (key === 'tools') {
      setClause.push('tools_json = ?');
      values.push(JSON.stringify(updates.tools));
    } else {
      setClause.push(`${key} = ?`);
      values.push((updates as any)[key]);
    }
  }

  db.prepare(`UPDATE skills SET ${setClause.join(', ')} WHERE id = ?`).run(...values, id);
  return true;
}

// -----------------------------------------------------------------------------
// 7. CONTACT SUBMISSIONS
// -----------------------------------------------------------------------------
export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as ContactSubmission[];
    }
  }

  const db = getDb();
  return db.prepare('SELECT * FROM contact_submissions ORDER BY created_at DESC').all() as any[];
}

export async function updateSubmissionStatus(id: string | number, status: 'unread' | 'read' | 'archived'): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('contact_submissions').update({ status }).eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  db.prepare('UPDATE contact_submissions SET status = ? WHERE id = ?').run(status, id);
  return true;
}

export async function deleteSubmission(id: string | number): Promise<boolean> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdminClient() || (await getSupabaseServerClient());
    if (supabase) {
      const { error } = await supabase.from('contact_submissions').delete().eq('id', id);
      if (!error) return true;
    }
  }

  const db = getDb();
  db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(id);
  return true;
}

// -----------------------------------------------------------------------------
// 8. DASHBOARD STATISTICS (Real data counts)
// -----------------------------------------------------------------------------
export async function getDashboardStats(): Promise<DashboardStats> {
  const allProjects = await getProjects({ publishedOnly: false });
  const allResearch = await getResearchPosts({ publishedOnly: false });
  const allSkills = await getSkills({ publishedOnly: false });
  const allSubmissions = await getContactSubmissions();

  const publishedProjects = allProjects.filter((p) => p.status === 'published').length;
  const draftProjects = allProjects.filter((p) => p.status === 'draft').length;

  const publishedResearch = allResearch.filter((r) => r.status === 'published').length;
  const draftResearch = allResearch.filter((r) => r.status === 'draft').length;

  const unreadSubmissions = allSubmissions.filter((s) => s.status === 'unread').length;

  return {
    projects: {
      total: allProjects.length,
      published: publishedProjects,
      draft: draftProjects,
    },
    research: {
      total: allResearch.length,
      published: publishedResearch,
      draft: draftResearch,
    },
    skills: {
      totalCategories: allSkills.length,
    },
    submissions: {
      total: allSubmissions.length,
      unread: unreadSubmissions,
    },
    backend: isSupabaseConfigured ? 'supabase' : 'local_sqlite',
    lastUpdated: new Date().toISOString(),
  };
}
