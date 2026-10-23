import { getRequiredSupabaseServerClient, isSupabaseConfigured, checkIsSupabaseConfigured } from './supabase/server';
import { getRequiredSupabaseAdminClient, isSupabaseAdminConfigured, checkIsSupabaseAdminConfigured } from './supabase/admin';

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
  readme_preview?: string;
  readme_status?: 'available' | 'missing' | 'error';
  default_branch?: string;
  readme_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type Tool = Project;

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
  display_order?: number;
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
    totalSkills: number;
    totalTools: number;
  };
  submissions: {
    total: number;
    unread: number;
  };
  backend: 'supabase';
  lastUpdated?: string;
}

// -----------------------------------------------------------------------------
// 1. SITE SETTINGS
// -----------------------------------------------------------------------------
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await getRequiredSupabaseServerClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'current')
    .maybeSingle();

  if (error) {
    console.error('[CMS] Failed to fetch site_settings from Supabase:', error.message);
    throw new Error(`Failed to fetch site settings from Supabase: ${error.message}`);
  }

  if (data) {
    return {
      ...data,
      open_for_collaboration: Boolean(data.open_for_collaboration),
    } as SiteSettings;
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
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 'current', ...settings, updated_at: new Date().toISOString() });

  if (error) {
    console.error('[CMS] Failed to update site_settings in Supabase:', error.message);
    throw new Error(`Failed to update site settings in Supabase: ${error.message}`);
  }
  return true;
}

// -----------------------------------------------------------------------------
// 2. HERO CONTENT
// -----------------------------------------------------------------------------
export async function getHeroContent(): Promise<HeroContent> {
  const supabase = await getRequiredSupabaseServerClient();
  const { data, error } = await supabase
    .from('hero_content')
    .select('*')
    .eq('id', 'current')
    .maybeSingle();

  if (error) {
    console.error('[CMS] Failed to fetch hero_content from Supabase:', error.message);
    throw new Error(`Failed to fetch hero content from Supabase: ${error.message}`);
  }

  if (data) return data as HeroContent;

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
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase
    .from('hero_content')
    .upsert({ id: 'current', ...content, updated_at: new Date().toISOString() });

  if (error) {
    console.error('[CMS] Failed to update hero_content in Supabase:', error.message);
    throw new Error(`Failed to update hero content in Supabase: ${error.message}`);
  }
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
  const supabase = await getRequiredSupabaseServerClient();

  const [aboutRes, domainRes, methRes] = await Promise.all([
    supabase.from('about_content').select('*').eq('id', 'current').maybeSingle(),
    supabase.from('research_domains').select('*').order('display_order', { ascending: true }),
    supabase.from('methodology_steps').select('*').order('display_order', { ascending: true }),
  ]);

  if (aboutRes.error) {
    console.error('[CMS] Failed to fetch about_content from Supabase:', aboutRes.error.message);
    throw new Error(`Failed to fetch about content from Supabase: ${aboutRes.error.message}`);
  }
  if (domainRes.error) {
    console.error('[CMS] Failed to fetch research_domains from Supabase:', domainRes.error.message);
    throw new Error(`Failed to fetch research domains from Supabase: ${domainRes.error.message}`);
  }
  if (methRes.error) {
    console.error('[CMS] Failed to fetch methodology_steps from Supabase:', methRes.error.message);
    throw new Error(`Failed to fetch methodology steps from Supabase: ${methRes.error.message}`);
  }

  const about = (aboutRes.data as AboutContent) || {
    id: 'current',
    status_badge: 'ACTIVE RESEARCHER',
    spec_text: 'OFFENSIVE SECURITY & PENTESTING',
    bio_paragraph_1: 'Aayan is an offensive security researcher...',
    bio_paragraph_2: 'Approaching security research with an inquisitive...',
    motto_quote: 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
  };

  return {
    about,
    domains: (domainRes.data || []) as ResearchDomain[],
    methodology: (methRes.data || []) as MethodologyStep[],
  };
}

export async function updateAboutContent(data: Partial<AboutContent>): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase
    .from('about_content')
    .upsert({ id: 'current', ...data, updated_at: new Date().toISOString() });

  if (error) {
    console.error('[CMS] Failed to update about_content in Supabase:', error.message);
    throw new Error(`Failed to update about content in Supabase: ${error.message}`);
  }
  return true;
}

export async function updateResearchDomain(id: string | number, domain: Partial<ResearchDomain>): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('research_domains').update(domain).eq('id', id);
  if (error) {
    console.error('[CMS] Failed to update research_domain in Supabase:', error.message);
    throw new Error(`Failed to update research domain in Supabase: ${error.message}`);
  }
  return true;
}

export async function createResearchDomain(domain: Omit<ResearchDomain, 'id'>): Promise<ResearchDomain> {
  const supabase = getRequiredSupabaseAdminClient();
  const { data, error } = await supabase
    .from('research_domains')
    .insert({
      domain_num: domain.domain_num,
      domain_code: domain.domain_code,
      title: domain.title,
      description: domain.description,
      display_order: domain.display_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[CMS] Failed to create research domain in Supabase:', error?.message);
    throw new Error(`Failed to create research domain in Supabase: ${error?.message || 'Unknown error'}`);
  }

  return data as ResearchDomain;
}

export async function deleteResearchDomain(id: string | number): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('research_domains').delete().eq('id', id);
  if (error) {
    console.error('[CMS] Failed to delete research domain in Supabase:', error.message);
    throw new Error(`Failed to delete research domain in Supabase: ${error.message}`);
  }
  return true;
}

export async function updateMethodologyStep(id: string | number, step: Partial<MethodologyStep>): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('methodology_steps').update(step).eq('id', id);
  if (error) {
    console.error('[CMS] Failed to update methodology_step in Supabase:', error.message);
    throw new Error(`Failed to update methodology step in Supabase: ${error.message}`);
  }
  return true;
}

export async function createMethodologyStep(step: Omit<MethodologyStep, 'id'>): Promise<MethodologyStep> {
  const supabase = getRequiredSupabaseAdminClient();
  const { data, error } = await supabase
    .from('methodology_steps')
    .insert({
      step_num: step.step_num,
      title: step.title,
      description: step.description,
      display_order: step.display_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[CMS] Failed to create methodology step in Supabase:', error?.message);
    throw new Error(`Failed to create methodology step in Supabase: ${error?.message || 'Unknown error'}`);
  }

  return data as MethodologyStep;
}

export async function deleteMethodologyStep(id: string | number): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('methodology_steps').delete().eq('id', id);
  if (error) {
    console.error('[CMS] Failed to delete methodology step in Supabase:', error.message);
    throw new Error(`Failed to delete methodology step in Supabase: ${error.message}`);
  }
  return true;
}

// -----------------------------------------------------------------------------
// 4. PROJECTS / ARSENAL / TOOLS (Supabase is sole source of truth)
// -----------------------------------------------------------------------------
export async function getProjects(options: { publishedOnly?: boolean } = {}): Promise<Project[]> {
  const publishedOnly = options.publishedOnly ?? true;
  const supabase = publishedOnly
    ? await getRequiredSupabaseServerClient()
    : (checkIsSupabaseAdminConfigured() ? getRequiredSupabaseAdminClient() : await getRequiredSupabaseServerClient());

  let query = supabase.from('projects').select('*').order('display_order', { ascending: true });
  if (publishedOnly) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) {
    console.error('[CMS] Failed to fetch projects from Supabase:', error.message);
    throw new Error(`Failed to fetch projects from Supabase: ${error.message}`);
  }

  return (data || []).map((p: any) => ({
    ...p,
    readme_preview: p.readme_preview || p.description || p.summary,
    readme_status: p.readme_status || 'available',
    default_branch: p.default_branch || 'main',
    readme_synced_at: p.readme_synced_at || p.updated_at,
    featured: Boolean(p.featured),
  })) as Project[];
}

export const getTools = getProjects;

export async function getProjectById(id: string | number): Promise<Project | null> {
  const supabase = checkIsSupabaseAdminConfigured()
    ? getRequiredSupabaseAdminClient()
    : await getRequiredSupabaseServerClient();
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error(`[CMS] Failed to fetch project ${id} from Supabase:`, error.message);
    throw new Error(`Failed to fetch project from Supabase: ${error.message}`);
  }
  if (!data) return null;
  return {
    ...data,
    readme_preview: data.readme_preview || data.description || data.summary,
    readme_status: data.readme_status || 'available',
    default_branch: data.default_branch || 'main',
    readme_synced_at: data.readme_synced_at || data.updated_at,
    featured: Boolean(data.featured),
  } as Project;
}

export const getToolById = getProjectById;

export async function findProjectByRepoUrl(repoUrl: string): Promise<Project | null> {
  if (!repoUrl) return null;
  const normalized = repoUrl.trim().toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');
  const supabase = checkIsSupabaseAdminConfigured()
    ? getRequiredSupabaseAdminClient()
    : await getRequiredSupabaseServerClient();
  const { data, error } = await supabase.from('projects').select('*');
  if (error || !data) return null;

  const found = data.find((p: any) => {
    if (!p.repo_url) return false;
    const existingNorm = p.repo_url.trim().toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');
    return existingNorm === normalized;
  });

  if (!found) return null;
  return {
    ...found,
    readme_preview: found.readme_preview || found.description || found.summary,
    readme_status: found.readme_status || 'available',
    default_branch: found.default_branch || 'main',
    readme_synced_at: found.readme_synced_at || found.updated_at,
    featured: Boolean(found.featured),
  } as Project;
}

export const findToolByRepoUrl = findProjectByRepoUrl;

export async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
  const supabase = getRequiredSupabaseAdminClient();

  const primaryPayload: Record<string, any> = {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description || project.readme_preview || project.summary,
    tech_stack: project.tech_stack,
    category: project.category,
    repo_url: project.repo_url || null,
    demo_url: project.demo_url || null,
    image_url: project.image_url || null,
    status: project.status,
    featured: Boolean(project.featured),
    display_order: project.display_order || 0,
    readme_preview: project.readme_preview || null,
    readme_status: project.readme_status || 'available',
    default_branch: project.default_branch || 'main',
    readme_synced_at: project.readme_synced_at || new Date().toISOString(),
  };

  // Attempt insert with complete schema; fall back to core schema if columns are not yet migrated
  let result = await supabase.from('projects').insert(primaryPayload).select().single();

  if (result.error && (result.error.code === '42703' || result.error.message?.includes('column'))) {
    console.warn('[CMS] Supabase projects table does not have readme columns yet. Using core fallback columns.');
    const fallbackPayload = { ...primaryPayload };
    delete fallbackPayload.readme_preview;
    delete fallbackPayload.readme_status;
    delete fallbackPayload.default_branch;
    delete fallbackPayload.readme_synced_at;
    result = await supabase.from('projects').insert(fallbackPayload).select().single();
  }

  if (result.error || !result.data) {
    console.error('[CMS] Failed to create project in Supabase:', result.error?.message);
    throw new Error(`Failed to create project in Supabase: ${result.error?.message || 'Unknown error'}`);
  }

  return {
    ...result.data,
    readme_preview: result.data.readme_preview || result.data.description || result.data.summary,
    readme_status: result.data.readme_status || 'available',
    default_branch: result.data.default_branch || 'main',
    readme_synced_at: result.data.readme_synced_at || result.data.updated_at,
    featured: Boolean(result.data.featured),
  } as Project;
}

export const createTool = createProject;

export async function updateProject(id: string | number, updates: Partial<Project>): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();

  const payload: Record<string, any> = { ...updates };
  // Ensure description is also kept in sync with readme_preview if updated
  if (updates.readme_preview && !updates.description) {
    payload.description = updates.readme_preview;
  }

  let result = await supabase.from('projects').update(payload).eq('id', id);

  if (result.error && (result.error.code === '42703' || result.error.message?.includes('column'))) {
    console.warn('[CMS] Supabase projects table does not have readme columns yet. Updating core columns only.');
    const fallbackPayload = { ...payload };
    delete fallbackPayload.readme_preview;
    delete fallbackPayload.readme_status;
    delete fallbackPayload.default_branch;
    delete fallbackPayload.readme_synced_at;
    result = await supabase.from('projects').update(fallbackPayload).eq('id', id);
  }

  if (result.error) {
    console.error('[CMS] Failed to update project in Supabase:', result.error.message);
    throw new Error(`Failed to update project in Supabase: ${result.error.message}`);
  }
  return true;
}

export const updateTool = updateProject;

export async function deleteProject(id: string | number): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    console.error('[CMS] Failed to delete project in Supabase:', error.message);
    throw new Error(`Failed to delete project in Supabase: ${error.message}`);
  }
  return true;
}

export const deleteTool = deleteProject;

// -----------------------------------------------------------------------------
// 5. RESEARCH POSTS & ADVISORIES (Supabase is sole source of truth)
// -----------------------------------------------------------------------------
export async function getResearchPosts(options: { publishedOnly?: boolean } = {}): Promise<ResearchPost[]> {
  const publishedOnly = options.publishedOnly ?? true;
  const supabase = publishedOnly
    ? await getRequiredSupabaseServerClient()
    : (checkIsSupabaseAdminConfigured() ? getRequiredSupabaseAdminClient() : await getRequiredSupabaseServerClient());

  let query = supabase.from('research_posts').select('*').order('published_date', { ascending: false });
  if (publishedOnly) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) {
    console.error('[CMS] Failed to fetch research posts from Supabase:', error.message);
    throw new Error(`Failed to fetch research posts from Supabase: ${error.message}`);
  }

  return (data || []) as ResearchPost[];
}

export async function createResearchPost(post: Omit<ResearchPost, 'id'>): Promise<ResearchPost> {
  const supabase = getRequiredSupabaseAdminClient();
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

  if (error || !data) {
    console.error('[CMS] Failed to create research post in Supabase:', error?.message);
    throw new Error(`Failed to create research post in Supabase: ${error?.message || 'Unknown error'}`);
  }

  return data as ResearchPost;
}

export async function findResearchByExternalUrl(url: string): Promise<ResearchPost | null> {
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  const supabase = checkIsSupabaseAdminConfigured()
    ? getRequiredSupabaseAdminClient()
    : await getRequiredSupabaseServerClient();
  const { data, error } = await supabase
    .from('research_posts')
    .select('*')
    .eq('external_url', cleanUrl)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[CMS] Failed to query research post by URL in Supabase:', error.message);
    throw new Error(`Failed to query research post in Supabase: ${error.message}`);
  }

  return (data as ResearchPost) || null;
}

export async function updateResearchPost(id: string | number, updates: Partial<ResearchPost>): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('research_posts').update(updates).eq('id', id);
  if (error) {
    console.error('[CMS] Failed to update research post in Supabase:', error.message);
    throw new Error(`Failed to update research post in Supabase: ${error.message}`);
  }
  return true;
}

export async function deleteResearchPost(id: string | number): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('research_posts').delete().eq('id', id);
  if (error) {
    console.error('[CMS] Failed to delete research post in Supabase:', error.message);
    throw new Error(`Failed to delete research post in Supabase: ${error.message}`);
  }
  return true;
}

// -----------------------------------------------------------------------------
// 6. SKILLS MATRIX
// -----------------------------------------------------------------------------
export async function getSkills(options: { publishedOnly?: boolean } = {}): Promise<SkillCategory[]> {
  const publishedOnly = options.publishedOnly ?? true;
  const supabase = await getRequiredSupabaseServerClient();

  let query = supabase.from('skills').select('*').order('display_order', { ascending: true });
  if (publishedOnly) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) {
    console.error('[CMS] Failed to fetch skills from Supabase:', error.message);
    throw new Error(`Failed to fetch skills from Supabase: ${error.message}`);
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    category_num: r.category_num,
    category_title: r.category_title,
    description: r.description,
    skills: Array.isArray(r.skills) ? r.skills : (typeof r.skills_json === 'string' ? JSON.parse(r.skills_json) : []),
    tools: Array.isArray(r.tools) ? r.tools : (typeof r.tools_json === 'string' ? JSON.parse(r.tools_json) : []),
    display_order: r.display_order,
    status: r.status,
  })) as SkillCategory[];
}

export async function updateSkillCategory(id: string | number, updates: Partial<SkillCategory>): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const payload: Record<string, any> = { ...updates };
  if (updates.skills !== undefined) {
    payload.skills = Array.isArray(updates.skills) ? updates.skills : [];
  }
  if (updates.tools !== undefined) {
    payload.tools = Array.isArray(updates.tools) ? updates.tools : [];
  }
  const { error } = await supabase.from('skills').update(payload).eq('id', id);
  if (error) {
    console.error('[CMS] Failed to update skill category in Supabase:', error.message);
    throw new Error(`Failed to update skill category in Supabase: ${error.message}`);
  }
  return true;
}

export async function createSkillCategory(category: {
  category_num: string;
  category_title: string;
  description: string;
  skills?: string[];
  tools?: string[];
  display_order?: number;
  status?: 'published' | 'draft';
}): Promise<SkillCategory> {
  const supabase = getRequiredSupabaseAdminClient();

  const payload = {
    category_num: category.category_num.trim(),
    category_title: category.category_title.trim(),
    description: (category.description || '').trim(),
    skills: Array.isArray(category.skills) ? category.skills : [],
    tools: Array.isArray(category.tools) ? category.tools : [],
    display_order: typeof category.display_order === 'number' ? category.display_order : 0,
    status: category.status === 'draft' ? 'draft' : 'published',
  };

  const { data, error } = await supabase
    .from('skills')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    console.error('[CMS] Failed to create skill category in Supabase:', error?.message);
    throw new Error(`Failed to create skill category in Supabase: ${error?.message || 'Unknown error'}`);
  }

  return {
    id: data.id,
    category_num: data.category_num,
    category_title: data.category_title,
    description: data.description,
    skills: Array.isArray(data.skills) ? data.skills : [],
    tools: Array.isArray(data.tools) ? data.tools : [],
    display_order: data.display_order,
    status: data.status,
  };
}

export async function deleteSkillCategory(id: string | number): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('skills').delete().eq('id', id);
  if (error) {
    console.error('[CMS] Failed to delete skill category in Supabase:', error.message);
    throw new Error(`Failed to delete skill category in Supabase: ${error.message}`);
  }
  return true;
}


// -----------------------------------------------------------------------------
// 7. CONTACT SUBMISSIONS
// -----------------------------------------------------------------------------
export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const supabase = getRequiredSupabaseAdminClient();
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CMS] Failed to fetch contact submissions from Supabase:', error.message);
    throw new Error(`Failed to fetch contact submissions from Supabase: ${error.message}`);
  }

  return (data || []) as ContactSubmission[];
}

export async function updateSubmissionStatus(id: string | number, status: 'unread' | 'read' | 'archived'): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('contact_submissions').update({ status }).eq('id', id);
  if (error) {
    console.error('[CMS] Failed to update submission status in Supabase:', error.message);
    throw new Error(`Failed to update submission status in Supabase: ${error.message}`);
  }
  return true;
}

export async function deleteSubmission(id: string | number): Promise<boolean> {
  const supabase = getRequiredSupabaseAdminClient();
  const { error } = await supabase.from('contact_submissions').delete().eq('id', id);
  if (error) {
    console.error('[CMS] Failed to delete submission in Supabase:', error.message);
    throw new Error(`Failed to delete submission in Supabase: ${error.message}`);
  }
  return true;
}

export async function createContactSubmission(submission: {
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  ip_address?: string;
}): Promise<boolean> {
  const supabase = await getRequiredSupabaseServerClient();
  const { error } = await supabase.from('contact_submissions').insert(submission);
  if (error) {
    console.error('[CMS] Failed to create contact submission in Supabase:', error.message);
    throw new Error(`Failed to record transmission in Supabase: ${error.message}`);
  }
  return true;
}

// -----------------------------------------------------------------------------
// 8. DASHBOARD STATISTICS (Real Supabase data counts)
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

  const totalSkills = allSkills.reduce((acc, cat) => acc + (cat.skills ? cat.skills.length : 0), 0);
  const totalTools = allSkills.reduce((acc, cat) => acc + (cat.tools ? cat.tools.length : 0), 0);

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
      totalSkills,
      totalTools,
    },
    submissions: {
      total: allSubmissions.length,
      unread: unreadSubmissions,
    },
    backend: 'supabase',
    lastUpdated: new Date().toISOString(),
  };
}

export { isSupabaseConfigured, isSupabaseAdminConfigured };
