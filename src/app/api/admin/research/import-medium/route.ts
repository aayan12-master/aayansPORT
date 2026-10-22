import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { findResearchByExternalUrl } from '@/lib/cms';
import dns from 'dns';
import net from 'net';

/**
 * Checks whether an IP address belongs to private/internal ranges (SSRF defense)
 */
function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0' || ip === '::') {
    return true;
  }
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;
    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0 - 169.254.255.255 (link-local, cloud metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 127.0.0.0 - 127.255.255.255 (loopback)
    if (parts[0] === 127) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (
      lower === '::1' ||
      lower === '::' ||
      lower.startsWith('fe80:') ||
      lower.startsWith('fc00:') ||
      lower.startsWith('fd00:')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Validates the URL and ensures it resolves only to public routable IP addresses
 */
async function validateUrlSafety(urlStr: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error('Invalid URL format. Provide a complete URL starting with https://');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid protocol. Only HTTP and HTTPS URLs are allowed.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Allow only legitimate Medium article URLs or supported publication domains
  const isMediumHost =
    hostname === 'medium.com' ||
    hostname.endsWith('.medium.com') ||
    [
      'infosecwriteups.com',
      'towardsdatascience.com',
      'plainenglish.io',
      'betterprogramming.pub',
      'levelup.gitconnected.com',
      'itnext.io',
      'uxdesign.cc',
    ].some((d) => hostname === d || hostname.endsWith(`.${d}`));

  if (!isMediumHost) {
    throw new Error('Unsupported URL host. Please provide a valid Medium article URL (e.g. medium.com/@user/article or supported publication).');
  }

  // Check for disallowed hostnames
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    throw new Error('Access to private or local hostnames is strictly blocked.');
  }

  // Resolve DNS to verify IP address
  try {
    const lookup = await dns.promises.lookup(hostname, { all: true });
    for (const entry of lookup) {
      if (isPrivateIp(entry.address)) {
        throw new Error('Target hostname resolves to a private IP range (SSRF blocked).');
      }
    }
  } catch (err: any) {
    if (err.message.includes('SSRF blocked')) throw err;
    throw new Error(`DNS resolution failed for hostname "${hostname}": ${err.message}`);
  }

  return parsed;
}

/**
 * Normalizes Medium URLs by stripping tracking parameters
 */
function normalizeMediumUrl(url: URL): string {
  const clean = new URL(url.toString());
  const trackingParams = ['source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'sk', 'gi', 'responsesOpen'];
  trackingParams.forEach((p) => clean.searchParams.delete(p));
  return clean.toString().replace(/\/$/, '');
}

/**
 * Converts article HTML to structured technical text / markdown
 */
function htmlToStructuredContent(html: string): string {
  if (!html) return '';

  let text = html;

  // Remove scripts, styles, SVGs, buttons, and Medium UI noise
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  text = text.replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '');

  // Pre / code blocks
  text = text.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (m, code) => {
    return `\n\n\`\`\`\n${code.replace(/<[^>]+>/g, '').trim()}\n\`\`\`\n\n`;
  });
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (m, code) => {
    return `\n\n\`\`\`\n${code.replace(/<[^>]+>/g, '').trim()}\n\`\`\`\n\n`;
  });
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (m, code) => {
    return ` \`${code.replace(/<[^>]+>/g, '').trim()}\` `;
  });

  // Headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (m, h) => `\n\n# ${h.replace(/<[^>]+>/g, '').trim()}\n\n`);
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (m, h) => `\n\n## ${h.replace(/<[^>]+>/g, '').trim()}\n\n`);
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (m, h) => `\n\n### ${h.replace(/<[^>]+>/g, '').trim()}\n\n`);
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (m, h) => `\n\n#### ${h.replace(/<[^>]+>/g, '').trim()}\n\n`);

  // Blockquotes
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, q) => `\n\n> ${q.replace(/<[^>]+>/g, '').trim()}\n\n`);

  // List items
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, item) => `\n• ${item.replace(/<[^>]+>/g, '').trim()}`);

  // Images in figure / img
  text = text.replace(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '\n\n![$2]($1)\n\n');
  text = text.replace(/<img[^>]+alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, '\n\n![$1]($2)\n\n');
  text = text.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, '\n\n![]($1)\n\n');

  // Links
  text = text.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (m, href, linkText) => {
    const cleanText = linkText.replace(/<[^>]+>/g, '').trim();
    return cleanText ? `[${cleanText}](${href})` : href;
  });

  // Paragraphs
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (m, p) => `\n\n${p.replace(/<[^>]+>/g, '').trim()}\n\n`);
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Clean lines and remove Medium UI residue
  const noisePhrases = [
    /^Listen$/i,
    /^Share$/i,
    /^Follow$/i,
    /^Press enter or click to view image in full size$/i,
    /^Member-only story$/i,
    /^Published in /i,
  ];

  const lines = text
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((line) => {
      const trimmed = line.trim();
      return !noisePhrases.some((pattern) => pattern.test(trimmed));
    });

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Intelligent categorization based on security keywords
 */
function inferSecurityCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/ctf|capture the flag|tryhackme|hackthebox|lab practice/.test(lower)) {
    return 'CTF & Lab Practice';
  }
  if (/active directory|kerberos|domain controller|ldap|golden ticket|bloodhound/.test(lower)) {
    return 'Active Directory Security';
  }
  if (/malware|ransomware|trojan|rootkit|payload|shellcode/.test(lower)) {
    return 'Malware Analysis';
  }
  if (/reverse engineering|ghidra|ida pro|disassembl|decompiler/.test(lower)) {
    return 'Reverse Engineering';
  }
  if (/exploit development|heap spray|rop chain|format string/.test(lower)) {
    return 'Exploit Development';
  }
  if (/privilege escalation|privesc|sudo vulnerability|suid|uac bypass/.test(lower)) {
    return 'Privilege Escalation';
  }
  if (/bug bounty|hackerone|bugcrowd|synack|hall of fame/.test(lower)) {
    return 'Bug Bounty';
  }
  if (/forensic|incident response|dfir|memory dump|volatility/.test(lower)) {
    return 'Digital Forensics & Incident Response';
  }
  if (/threat intel|threat actor|indicators of compromise|ioc/.test(lower)) {
    return 'Threat Intelligence';
  }
  if (/wireless|wifi|wpa2|wpa3|aircrack|bluetooth|rfid/.test(lower)) {
    return 'Wireless Security';
  }
  if (/iot|embedded|hardware security/.test(lower)) {
    return 'IoT Security';
  }
  if (/kubernetes|k8s|container|docker|podman|helm/.test(lower)) {
    return 'Container & Kubernetes Security';
  }
  if (/devsecops|ci\/cd|pipeline security|sast|dast/.test(lower)) {
    return 'DevSecOps';
  }
  if (/llm|prompt injection|adversarial ai|ai security/.test(lower)) {
    return 'AI & LLM Security';
  }
  if (/cryptograph|cipher|rsa|aes|encryption|hash algorithm|tls|ssl/.test(lower)) {
    return 'Cryptography';
  }
  if (/mobile|android|ios|apk|frida|objection|ipa/.test(lower)) {
    return 'Mobile Application Security';
  }
  if (/oauth|jwt|xss|csrf|sqli|sql injection|idor|ssrf|session|auth|authentication|deserialization/.test(lower)) {
    return 'Web Security';
  }
  if (/subdomain|recon|dns|cname|osint|enumeration|fingerprint|perimeter|shodan|amass/.test(lower)) {
    return 'Cloud & Recon';
  }
  if (/cloud|aws|iam|s3|azure|gcp|serverless|lambda|metadata|imds/.test(lower)) {
    return 'Cloud Infrastructure';
  }
  if (/binary|ghidra|ida|assembly|firmware|mips|arm|decompil|buffer overflow|heap/.test(lower)) {
    return 'Binary & Firmware';
  }
  if (/api|graphql|rest|endpoint|swagger|postman|soap|grpc/.test(lower)) {
    return 'API Security';
  }
  if (/penetration test|pentest|red team|offensive security/.test(lower)) {
    return 'Penetration Testing';
  }
  if (/ethical hack|hydra|brute force|nmap|metasploit/.test(lower)) {
    return 'Ethical Hacking';
  }
  return 'Web Security';
}

/**
 * Cleans and extracts a readable short plain-text preview excerpt (2-4 sentences, max 300 chars)
 * Strips raw markdown images, code blocks, headings, lists, HTML tags, and trailing ellipses.
 */
function cleanArticleExcerpt(content?: string, summary?: string, maxChars: number = 300): string {
  let raw = '';
  if (content && content.trim().length > 0) {
    raw = content;
  } else if (summary && summary.trim().length > 0) {
    raw = summary;
  }

  if (!raw) return '';

  // 1. Strip Markdown images: ![alt](url)
  raw = raw.replace(/!\[.*?\]\([^)]*\)/g, '');
  // 2. Strip raw image URLs
  raw = raw.replace(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S*)?/gi, '');
  // 3. Strip code blocks: ```code```
  raw = raw.replace(/```[\s\S]*?```/g, '');
  // 4. Strip inline code: `code`
  raw = raw.replace(/`([^`]+)`/g, '$1');
  // 5. Strip HTML tags
  raw = raw.replace(/<[^>]+>/g, '');
  // 6. Strip Markdown headings
  raw = raw.replace(/^#{1,6}\s+.*$/gm, '');
  // 7. Strip Markdown blockquotes (> text)
  raw = raw.replace(/^>\s*/gm, '');
  // 8. Strip Markdown links: [text](url) -> text
  raw = raw.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // 9. Strip bold / italics formatting
  raw = raw.replace(/(\*\*|__)(.*?)\1/g, '$2');
  raw = raw.replace(/(\*|_)(.*?)\1/g, '$2');
  // 10. Strip bullet / numbering lists
  raw = raw.replace(/^[\s*•\-–]+\s*/gm, '');
  raw = raw.replace(/^\d+\.\s+/gm, '');
  // 11. Decode HTML entities
  raw = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // 12. Split into meaningful paragraphs, take opening paragraph(s)
  const paragraphs = raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 25);

  let cleaned = '';
  if (paragraphs.length > 0) {
    cleaned = paragraphs.slice(0, 2).join(' ');
  } else {
    cleaned = summary || raw;
  }

  // Collapse multiple whitespaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Strip trailing incomplete ellipsis or dots from Medium
  cleaned = cleaned.replace(/[\s.…]+$/, '');

  // If still empty or too short, fallback to cleaned summary
  if (!cleaned && summary) {
    cleaned = summary
      .replace(/!\[.*?\]\([^)]*\)/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[\s.…]+$/, '');
  }

  if (!cleaned) return '';

  if (cleaned.length <= maxChars) {
    return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
  }

  // Find a clean sentence break before maxChars
  const truncated = cleaned.slice(0, maxChars);
  const sentenceEnd = truncated.lastIndexOf('. ');
  if (sentenceEnd > 140) {
    return truncated.slice(0, sentenceEnd + 1);
  }

  // Otherwise break at word boundary and append ellipsis
  const wordEnd = truncated.lastIndexOf(' ');
  if (wordEnd > 100) {
    return `${truncated.slice(0, wordEnd).replace(/[,;:\s]+$/, '')}...`;
  }

  return `${truncated.replace(/[,;:\s]+$/, '')}...`;
}

export async function POST(req: NextRequest) {
  // 1. Authenticate admin user
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawUrl = (body.url || '').trim();

    if (!rawUrl) {
      return NextResponse.json({ success: false, error: 'Medium article URL is required.' }, { status: 400 });
    }

    // 2. Validate URL safety (SSRF defense)
    const parsedUrl = await validateUrlSafety(rawUrl);
    const normalizedUrl = normalizeMediumUrl(parsedUrl);

    // 3. Duplicate check against existing research
    const existingAdvisory = await findResearchByExternalUrl(normalizedUrl);

    // 4. Server-side fetch with browser headers
    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    let html = '';
    try {
      const response = await fetch(normalizedUrl, {
        headers: fetchHeaders,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { success: false, error: 'Medium returned 404 Not Found. Check the article URL.' },
            { status: 404 }
          );
        }
        if (response.status === 429 || response.status === 403) {
          return NextResponse.json(
            {
              success: false,
              error: `Medium restricted access (HTTP ${response.status}). You can fill in the advisory fields manually.`,
            },
            { status: 502 }
          );
        }
        return NextResponse.json(
          { success: false, error: `Failed to fetch from Medium (HTTP ${response.status}).` },
          { status: 502 }
        );
      }

      html = await response.text();
      // Cap at 5MB
      if (html.length > 5 * 1024 * 1024) {
        html = html.slice(0, 5 * 1024 * 1024);
      }
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: `Network error reaching Medium: ${err.message}` },
        { status: 502 }
      );
    }

    // 5. Extract metadata from HTML tags
    const getMeta = (prop: string): string | null => {
      const reg = new RegExp(`<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["'](.*?)["']`, 'i');
      const regRev = new RegExp(`<meta\\s+content=["'](.*?)["']\\s+(?:property|name)=["']${prop}["']`, 'i');
      const m = html.match(reg) || html.match(regRev);
      return m ? m[1].trim() : null;
    };

    let title = getMeta('og:title') || '';
    let summary = getMeta('og:description') || '';
    let imageUrl = getMeta('og:image') || '';
    let author = getMeta('author') || '';
    let publishedDate = getMeta('article:published_time') || '';
    let tagsList: string[] = [];

    // Additional tag extraction
    const tagMatches = [...html.matchAll(/<meta\s+property=["']article:tag["']\s+content=["'](.*?)["']/gi)];
    tagMatches.forEach((m) => {
      if (m[1] && !tagsList.includes(m[1].trim())) {
        tagsList.push(m[1].trim());
      }
    });

    // Check JSON-LD for rich structured data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        if (!title && ld.headline) title = ld.headline;
        if (!summary && ld.description) summary = ld.description;
        if (!publishedDate && ld.datePublished) publishedDate = ld.datePublished;
        if (!author && ld.author?.name) author = ld.author.name;
        if (!imageUrl && ld.image) {
          imageUrl = Array.isArray(ld.image) ? ld.image[0] : typeof ld.image === 'string' ? ld.image : ld.image.url;
        }
        if (ld.keywords) {
          const kws = Array.isArray(ld.keywords) ? ld.keywords : String(ld.keywords).split(',');
          kws.forEach((k: string) => {
            const trimmed = k.trim();
            if (trimmed && !tagsList.includes(trimmed)) tagsList.push(trimmed);
          });
        }
      } catch {
        // Ignore JSON-LD parse errors
      }
    }

    // Canonical URL
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : normalizedUrl;

    // 6. Try to fetch author/publication RSS feed for full body & exact tags
    let rawContentHtml = '';
    try {
      // Determine candidate feed URL from URL pattern
      let feedUrl: string | null = null;
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

      if (pathParts[0]?.startsWith('@')) {
        feedUrl = `https://medium.com/feed/${pathParts[0]}`;
      } else if (parsedUrl.hostname.includes('.medium.com')) {
        const sub = parsedUrl.hostname.split('.')[0];
        if (sub && sub !== 'www' && sub !== 'api') {
          feedUrl = `https://medium.com/feed/@${sub}`;
        }
      } else if (parsedUrl.hostname !== 'medium.com' && parsedUrl.hostname !== 'www.medium.com') {
        // Custom domain (e.g., infosecwriteups.com)
        feedUrl = `${parsedUrl.origin}/feed`;
      } else if (pathParts.length > 1) {
        // Publication on medium.com (e.g., medium.com/towards-data-science/...)
        feedUrl = `https://medium.com/feed/${pathParts[0]}`;
      }

      if (feedUrl) {
        const rssRes = await fetch(feedUrl, {
          headers: { 'User-Agent': fetchHeaders['User-Agent'] },
          signal: AbortSignal.timeout(4000), // 4s quick fallback check
        });

        if (rssRes.ok) {
          const rssText = await rssRes.text();
          // Extract hash from URL (Medium ends slugs with a hash e.g. -49d8b91b7b92)
          const lastSlugPart = pathParts[pathParts.length - 1] || '';
          const hashMatch = lastSlugPart.match(/([a-f0-9]{8,12})$/i);
          const identifier = hashMatch ? hashMatch[1] : lastSlugPart;

          if (identifier && rssText.includes(identifier)) {
            const items = rssText.split('<item>');
            for (const it of items) {
              if (it.includes(identifier)) {
                // Extract categories/tags
                const rssCategories = [...it.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/g)].map((m) => m[1]);
                rssCategories.forEach((cat) => {
                  if (cat && !tagsList.includes(cat.trim())) {
                    tagsList.push(cat.trim());
                  }
                });

                // Extract high-fidelity article body
                const encodedMatch = it.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i);
                if (encodedMatch && encodedMatch[1]) {
                  rawContentHtml = encodedMatch[1];
                }
                break;
              }
            }
          }
        }
      }
    } catch {
      // Continue to HTML extraction fallback
    }

    // 7. Fallback content extraction from <article> tag
    if (!rawContentHtml) {
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        rawContentHtml = articleMatch[1];
      }
    }

    // 8. Convert content to structured text / markdown
    let structuredContent = htmlToStructuredContent(rawContentHtml);

    // If still empty, provide summary as initial content fallback
    if (!structuredContent && summary) {
      structuredContent = `${summary}\n\n[Read complete article on Medium](${canonicalUrl})`;
    }

    // 9. Format published date to YYYY-MM-DD
    let formattedDate = new Date().toISOString().split('T')[0];
    if (publishedDate) {
      try {
        const d = new Date(publishedDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split('T')[0];
        }
      } catch {
        // Use current date
      }
    }

    // 10. Generate URL slug
    const generatedSlug = (title || 'medium-research')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);

    // 11. Determine security category
    const category = inferSecurityCategory(`${title} ${tagsList.join(' ')} ${summary}`);

    // Verify that at least some content or title could be extracted
    if (!title && !structuredContent && (!summary || summary.startsWith('No summary'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not retrieve article from Medium. The article may be private, inaccessible, deleted, or restricted by Medium.',
        },
        { status: 422 }
      );
    }

    // Extract a sanitized short opening preview excerpt (approx 2-4 sentences, max 300 characters)
    const cleanedExcerpt = cleanArticleExcerpt(structuredContent, summary, 300);

    const articlePayload = {
      title: title || 'Untitled Medium Article',
      slug: generatedSlug,
      summary: cleanedExcerpt || summary || 'No summary provided in Medium metadata.',
      content: structuredContent,
      category,
      severity: 'Medium' as const,
      cve_id: '',
      published_date: formattedDate,
      tags: tagsList.slice(0, 8).join(', '),
      external_url: canonicalUrl,
      image_url: imageUrl || '',
      author: author || 'Medium Operative',
      is_duplicate: !!existingAdvisory,
      duplicate_id: existingAdvisory?.id || null,
      duplicate_title: existingAdvisory?.title || null,
    };

    return NextResponse.json({
      success: true,
      data: articlePayload,
      article: articlePayload,
    });
  } catch (error: any) {
    console.error('Medium ingestion error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred during Medium article ingestion.' },
      { status: 500 }
    );
  }
}
