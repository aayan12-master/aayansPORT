/**
 * Dedicated GitHub Server-Side Ingestion & Utility Service for AAYAN.Sec Arsenal & Tools.
 *
 * Used exclusively by admin endpoints for importing repository metadata and snapshotting READMEs into Supabase.
 * Public views query Supabase directly and never call GitHub API at runtime.
 */

import type { Project } from './cms';

export interface GitHubTool {
  id: number | string;
  name: string;
  slug: string;
  full_name: string;
  html_url: string;
  description: string;
  readme_excerpt: string;
  language: string;
  category: string;
  topics: string[];
  stars: number;
  forks: number;
  open_issues: number;
  license: string | null;
  updated_at: string;
  created_at: string;
  default_branch: string;
  is_archived: boolean;
  readme_status: 'available' | 'missing' | 'error';
  readme_synced_at?: string;
}

export interface ToolsApiResponse {
  success: boolean;
  username: string;
  tools: GitHubTool[];
  total: number;
  last_updated?: string;
  error?: string;
}

export interface GitHubImportResult {
  title: string;
  slug: string;
  summary: string;
  readme_preview: string;
  readme_status: 'available' | 'missing' | 'error';
  category: string;
  tech_stack: string;
  repo_url: string;
  demo_url?: string;
  default_branch: string;
  stars: number;
  forks: number;
  open_issues: number;
  license: string | null;
  owner: string;
  repo_name: string;
}

/**
 * Validates a GitHub repository URL format and guards against SSRF
 */
export function validateGitHubRepoUrl(rawUrl: string): { owner: string; repo: string; normalizedUrl: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('GitHub repository URL is required.');
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format. Provide a complete URL starting with https://github.com/...');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid protocol. Only HTTP and HTTPS URLs are permitted.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    throw new Error('Only github.com repository URLs are supported.');
  }

  // Pathname should match /:owner/:repo
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error('Invalid GitHub repository URL. Expected format: https://github.com/owner/repository');
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, '');

  if (!/^[a-zA-Z0-9_\-.]+$/.test(owner) || !/^[a-zA-Z0-9_\-.]+$/.test(repo)) {
    throw new Error('Repository owner or name contains invalid characters.');
  }

  const normalizedUrl = `https://github.com/${owner}/${repo}`;
  return { owner, repo, normalizedUrl };
}

/**
 * Extracts a concise, sanitized plain-text preview excerpt from a GitHub README (max 320 chars).
 * Strips raw markdown images, badges, headings, code blocks, HTML tags, and links.
 */
export function extractReadmeExcerpt(readmeContent?: string, maxChars: number = 320): string {
  if (!readmeContent || !readmeContent.trim()) return '';

  let raw = readmeContent;

  // 1. Strip badges & markdown images: [![alt](img-url)](link) or ![alt](img-url)
  raw = raw.replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '');
  raw = raw.replace(/!\[.*?\]\([^)]*\)/g, '');

  // 2. Strip raw image/badge URLs
  raw = raw.replace(/https?:\/\/(?:img\.shields\.io|raw\.githubusercontent\.com|user-images\.githubusercontent\.com|camo\.githubusercontent\.com)\S+/gi, '');

  // 3. Strip code blocks: ```...```
  raw = raw.replace(/```[\s\S]*?```/g, '');

  // 4. Strip inline code: `code`
  raw = raw.replace(/`([^`]+)`/g, '$1');

  // 5. Strip HTML scripts and tags
  raw = raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  raw = raw.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  raw = raw.replace(/<[^>]+>/g, '');

  // 6. Strip Markdown headings (# Title)
  raw = raw.replace(/^#{1,6}\s+.*$/gm, '');

  // 7. Strip blockquotes (> quote)
  raw = raw.replace(/^>\s*/gm, '');

  // 8. Strip markdown links: [text](url) -> text
  raw = raw.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 9. Strip bold / italics
  raw = raw.replace(/(\*\*|__)(.*?)\1/g, '$2');
  raw = raw.replace(/(\*|_)(.*?)\1/g, '$2');

  // 10. Strip bullet lists and numbering
  raw = raw.replace(/^[\s*•\-–]+\s*/gm, '');
  raw = raw.replace(/^\d+\.\s+/gm, '');

  // 11. Decode basic HTML entities
  raw = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // 12. Find first meaningful paragraph (> 25 chars, not just links or emojis)
  const paragraphs = raw
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 25);

  let cleaned = paragraphs.length > 0 ? paragraphs.slice(0, 2).join(' ') : '';
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (!cleaned) return '';

  if (cleaned.length <= maxChars) {
    return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
  }

  // Break cleanly at sentence or word boundary
  const truncated = cleaned.slice(0, maxChars);
  const sentenceEnd = truncated.lastIndexOf('. ');
  if (sentenceEnd > 140) {
    return truncated.slice(0, sentenceEnd + 1);
  }

  const wordEnd = truncated.lastIndexOf(' ');
  if (wordEnd > 120) {
    return `${truncated.slice(0, wordEnd).replace(/[,;:\s]+$/, '')}...`;
  }

  return `${truncated.replace(/[,;:\s]+$/, '')}...`;
}

/**
 * Derives a clean category from repository topics, name, description, and language using word boundaries.
 */
export function deriveToolCategory(repo: {
  name: string;
  description?: string | null;
  topics?: string[];
  language?: string | null;
}): string {
  const text = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();

  if (
    /\b(tor|anonym|privacy|wipe|trace|vpn|proxy)\b/i.test(text) ||
    /\bip\b/i.test(text) ||
    text.includes('ip rotat') ||
    text.includes('ip chang')
  ) {
    return 'Privacy & Anonymity';
  }

  if (/\b(recon|osint|subdomain|dns|scan|scanner|enumerate|enumeration|surface)\b/i.test(text)) {
    return 'Recon Tooling';
  }

  if (/\b(burp|jwt|web|oauth|xss|ssrf|api|sqli|csrf|tamper)\b/i.test(text)) {
    return 'Web Security';
  }

  if (/\b(cloud|aws|iam|azure|gcp|s3|kubernetes|k8s)\b/i.test(text)) {
    return 'Cloud Security';
  }

  if (/\b(exploit|payload|fuzz|fuzzer|injection|bypass)\b/i.test(text)) {
    return 'Exploit Tooling';
  }

  if (/\b(ai|llm|agent|gpt|claude|prompt|machine learning)\b/i.test(text)) {
    return 'AI & Offensive Tooling';
  }

  if (/\b(pentest|penetration|offensive|redteam|adversary|harness)\b/i.test(text)) {
    return 'Penetration Testing';
  }

  if (/\b(binary|firmware|mips|arm|reverse|ghidra|disassembly)\b/i.test(text)) {
    return 'Binary & Reverse';
  }

  if (repo.language) {
    return `${repo.language} Tooling`;
  }

  return 'Security Tool';
}

/**
 * Server-side ingestion function to fetch repository metadata and README excerpt from GitHub.
 * Runs only on the server inside admin endpoints.
 */
export async function fetchGitHubRepoForImport(rawUrl: string): Promise<GitHubImportResult> {
  const { owner, repo, normalizedUrl } = validateGitHubRepoUrl(rawUrl);

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'Aayan-Sec-Portfolio-Importer/1.0',
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 1. Fetch repository metadata from GitHub REST API (10s timeout)
  let repoData: any;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`GitHub repository "${owner}/${repo}" was not found or is private.`);
      }
      if (res.status === 403 || res.status === 429) {
        throw new Error(
          'GitHub API rate limit reached. Configure a server-side GITHUB_TOKEN or retry in a few minutes.'
        );
      }
      throw new Error(`GitHub returned HTTP ${res.status}: ${res.statusText}`);
    }

    repoData = await res.json();
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
      throw new Error('Connection to GitHub timed out after 10 seconds. Please check the network and retry.');
    }
    throw err;
  }

  // 2. Fetch raw README content from GitHub REST API
  let readmeContent = '';
  let readmeStatus: 'available' | 'missing' | 'error' = 'available';

  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        ...headers,
        Accept: 'application/vnd.github.raw+json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (readmeRes.ok) {
      readmeContent = await readmeRes.text();
      // Cap at 2MB
      if (readmeContent.length > 2 * 1024 * 1024) {
        readmeContent = readmeContent.slice(0, 2 * 1024 * 1024);
      }
      readmeStatus = 'available';
    } else if (readmeRes.status === 404) {
      readmeStatus = 'missing';
      readmeContent = '';
    } else {
      readmeStatus = 'error';
    }
  } catch {
    readmeStatus = 'error';
  }

  // 3. Extract faithful preview from README if available
  const excerpt = extractReadmeExcerpt(readmeContent);
  const repoDescription = (repoData.description || '').trim();

  let finalPreview = '';
  if (readmeStatus === 'available' && excerpt) {
    finalPreview = excerpt;
  } else if (repoDescription) {
    finalPreview = repoDescription;
  } else if (readmeStatus === 'missing') {
    finalPreview = 'No README available in repository.';
  } else {
    finalPreview = 'README snapshot could not be retrieved from GitHub.';
  }

  const generatedSlug = (repoData.name || repo)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const category = deriveToolCategory({
    name: repoData.name || repo,
    description: repoDescription,
    topics: Array.isArray(repoData.topics) ? repoData.topics : [],
    language: repoData.language,
  });

  return {
    title: repoData.name || repo,
    slug: generatedSlug,
    summary: repoDescription || finalPreview || 'Open-source security research tool.',
    readme_preview: finalPreview,
    readme_status: readmeStatus,
    category,
    tech_stack: repoData.language || 'Security Tool',
    repo_url: repoData.html_url || normalizedUrl,
    demo_url: repoData.homepage || undefined,
    default_branch: repoData.default_branch || 'main',
    stars: repoData.stargazers_count ?? 0,
    forks: repoData.forks_count ?? 0,
    open_issues: repoData.open_issues_count ?? 0,
    license: repoData.license?.spdx_id || repoData.license?.name || null,
    owner,
    repo_name: repo,
  };
}

/**
 * Maps a Supabase Project row into a clean GitHubTool object for frontend rendering.
 * Does not fabricate star counts, fork counts, or fake dates. Displays verified data only.
 */
export function normalizeToolFromProject(project: Project): GitHubTool {
  let fullName = project.slug;
  if (project.repo_url) {
    try {
      const u = new URL(project.repo_url);
      if (u.hostname.includes('github.com')) {
        fullName = u.pathname.replace(/^\/+/g, '').replace(/\.git$/i, '');
      }
    } catch {
      // Keep slug
    }
  }

  const excerpt = project.readme_preview || project.description || project.summary;

  const formattedUpdated = project.updated_at
    ? new Date(project.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Saved in Arsenal';

  const formattedCreated = project.created_at
    ? new Date(project.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  // Extract topics from tech_stack or category if comma separated
  const topics: string[] = [];
  if (project.tech_stack) {
    project.tech_stack.split(',').forEach((t) => {
      const trimmed = t.trim();
      if (trimmed && !topics.includes(trimmed)) topics.push(trimmed);
    });
  }

  return {
    id: project.id,
    name: project.title,
    slug: project.slug,
    full_name: fullName,
    html_url: project.repo_url || '#',
    description: project.summary,
    readme_excerpt: excerpt,
    language: project.tech_stack ? project.tech_stack.split(',')[0].trim() : 'Security Tool',
    category: project.category || 'Security Tooling',
    topics,
    stars: 0,
    forks: 0,
    open_issues: 0,
    license: null,
    updated_at: formattedUpdated,
    created_at: formattedCreated,
    default_branch: project.default_branch || 'main',
    is_archived: false,
    readme_status: project.readme_status || 'available',
    readme_synced_at: project.readme_synced_at,
  };
}
