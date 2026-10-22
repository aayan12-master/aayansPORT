import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'portfolio.db');

// Singleton database connection
let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initSchema(dbInstance);
  }
  return dbInstance;
}

export function hashPassword(password: string): string {
  const salt = 'aayan_sec_salt_2025';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function initSchema(db: DatabaseSync) {
  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      tech_stack TEXT NOT NULL,
      category TEXT DEFAULT 'Security Tool',
      repo_url TEXT,
      demo_url TEXT,
      status TEXT DEFAULT 'active',
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Research posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT DEFAULT 'Medium',
      cve_id TEXT,
      published_date TEXT NOT NULL,
      tags TEXT NOT NULL,
      external_url TEXT,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Contact submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread',
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Admin users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin if not exists (default credentials: admin / aayan_sec_2025)
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  if (userCheck.count === 0) {
    const defaultPassHash = hashPassword('aayan_sec_2025');
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', defaultPassHash);
  }

  // Seed initial research entries if empty
  const researchCheck = db.prepare('SELECT COUNT(*) as count FROM research_posts').get() as { count: number };
  if (researchCheck.count === 0) {
    const insertResearch = db.prepare(`
      INSERT INTO research_posts (title, slug, summary, content, category, severity, cve_id, published_date, tags, external_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertResearch.run(
      'OAuth 2.0 Account Takeover via Dynamic Client Registration & State Fixation',
      'oauth-account-takeover-state-fixation',
      'A deep-dive investigation into authorization code flow vulnerabilities allowing session fixation and silent token leakage across federated identity providers.',
      'During white-box security auditing of enterprise SSO gateways, an authorization state verification bypass was discovered. This advisory analyzes the architectural mismatch between RFC 6749 and implementation edge cases.',
      'Web Security',
      'High',
      'CVE-2024-8841',
      '2025-01-14',
      'OAuth, SSO, Identity, Auth Bypass',
      'https://github.com/aayan-sec/research-advisories'
    );

    insertResearch.run(
      'Subdomain Takeover via Dangling DNS CNAME & Orphaned Cloudflare Workers',
      'subdomain-takeover-dangling-cname',
      'Systematic reconnaissance methodology detecting stale apex DNS aliases pointing to deleted serverless edge compute targets.',
      'Edge compute routing creates novel persistence mechanisms for dangling DNS records. By monitoring TLS handshake discrepancies and zone delegations, 42 vulnerable enterprise domains were ethically identified and remediated.',
      'Cloud & Recon',
      'Critical',
      'RESEARCH-2024-03',
      '2024-11-28',
      'DNS, Recon, Cloudflare, Serverless',
      'https://github.com/aayan-sec/recon-cname-auditor'
    );

    insertResearch.run(
      'Blind SSRF to AWS Instance Metadata Service (IMDSv1 & v2 Token Flaws)',
      'blind-ssrf-aws-metadata-bypass',
      'Analyzing modern cloud metadata defenses and exploitation pathways through headless document rendering pipelines.',
      'Exploitation breakdown of server-side PDF generating workers that parse SVG XML and HTML canvas inputs to exfiltrate IAM role credentials via IPv6 fallback and header injection.',
      'Cloud Infrastructure',
      'Critical',
      'ADVISORY-2024-11',
      '2024-09-19',
      'SSRF, AWS, Cloud, Exploit',
      'https://github.com/aayan-sec/ssrf-payload-matrix'
    );

    insertResearch.run(
      'Memory Corruption in Custom IoT Gateway Network Daemon',
      'iot-gateway-memory-corruption',
      'Reverse engineering a proprietary MIPS firmware binary to isolate an unauthenticated heap buffer overflow in the discovery protocol.',
      'Detailed reverse engineering methodology using Ghidra and GDB to reconstruct packet processing routines, pinpointing an integer underflow leading to arbitrary write primitives.',
      'Binary & Firmware',
      'High',
      'CVE-2024-4190',
      '2024-06-05',
      'Reverse Engineering, MIPS, Exploit, C/C++',
      'https://github.com/aayan-sec/mips-heap-analysis'
    );

    insertResearch.run(
      'GraphQL Schema Introspection & Mass Assignment in Financial API',
      'graphql-mass-assignment-financial',
      'Uncovering hidden administrative mutations and batch query denial-of-service vulnerabilities in authenticated fintech services.',
      'Analysis of circular relationship queries and type system discrepancies allowing non-privileged accounts to elevate role parameters via unvalidated input object types.',
      'API Security',
      'Medium',
      'RESEARCH-2024-01',
      '2024-03-12',
      'GraphQL, API, Authorization, Pentesting',
      'https://github.com/aayan-sec/graphql-security-matrix'
    );
  }

  // Seed initial projects if empty
  const projectCheck = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCheck.count === 0) {
    const insertProj = db.prepare(`
      INSERT INTO projects (title, slug, summary, description, tech_stack, category, repo_url, demo_url, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProj.run(
      'ReconPulse — Distributed Attack Surface Enumerator',
      'reconpulse-attack-surface',
      'High-speed asynchronous subdomain enumeration, TLS fingerprinting, and technology detection pipeline built for offensive security engagements.',
      'ReconPulse orchestrates multi-source passive OSINT aggregation with active DNS resolution and port probing. Features real-time alerting for newly discovered assets and diff tracking across enterprise perimeters.',
      'Go, Python, Docker, Redis',
      'Recon Tooling',
      'https://github.com/aayan-sec/reconpulse',
      'https://reconpulse.dev',
      1
    );

    insertProj.run(
      'JWT-Tamperer — Burp Suite Pro Extension',
      'jwt-tamperer-burp-extension',
      'Automated signature exclusion, algorithm confusion, and brute-force secret verification for JSON Web Tokens in real-time HTTP traffic.',
      'Integrated into the Burp Suite proxy pipeline, this extension automatically highlights weak HMAC secrets, none-algorithm bypass attempts, and jku/x5u header injection vulnerabilities.',
      'Java, Python, Burp Extender API',
      'Burp Extension',
      'https://github.com/aayan-sec/jwt-tamperer',
      'https://github.com/aayan-sec/jwt-tamperer#demo',
      1
    );

    insertProj.run(
      'PayloadForge — Context-Aware XSS & SSRF Generator',
      'payloadforge-generator',
      'CLI tool generating obfuscated payloads tailored to specific WAF bypass signatures, character filter constraints, and HTML contexts.',
      'Leverages abstract syntax tree parsing to dynamically assemble polyglots and unicode normalizations that bypass modern cloud WAF rules while ensuring deterministic execution.',
      'TypeScript, Node.js, Rust',
      'Exploit Tooling',
      'https://github.com/aayan-sec/payloadforge',
      'https://payloadforge.run',
      1
    );

    insertProj.run(
      'CloudAudit-CLI — Multi-Cloud Security Posture Checker',
      'cloudaudit-cli',
      'Lightweight scanner evaluating AWS, GCP, and Azure environments for permissive IAM policies, public storage buckets, and exposed security groups.',
      'Engineered for rapid assessment during red team and penetration testing engagements to pinpoint privilege escalation paths and misconfigured cloud assets in minutes.',
      'Python, Boto3, Click',
      'Cloud Security',
      'https://github.com/aayan-sec/cloudaudit-cli',
      'https://github.com/aayan-sec/cloudaudit-cli',
      0
    );
  }

  // Site settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY DEFAULT 'current',
      site_title TEXT NOT NULL,
      site_description TEXT NOT NULL,
      footer_brand TEXT NOT NULL,
      footer_text TEXT NOT NULL,
      footer_subtext TEXT NOT NULL,
      status_text TEXT NOT NULL,
      open_for_collaboration INTEGER DEFAULT 1,
      contact_email TEXT NOT NULL,
      github_url TEXT NOT NULL,
      linkedin_url TEXT NOT NULL,
      twitter_url TEXT NOT NULL,
      pgp_key TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const settingsCheck = db.prepare('SELECT COUNT(*) as count FROM site_settings').get() as { count: number };
  if (settingsCheck.count === 0) {
    db.prepare(`
      INSERT INTO site_settings (id, site_title, site_description, footer_brand, footer_text, footer_subtext, status_text, open_for_collaboration, contact_email, github_url, linkedin_url, twitter_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'current',
      'AAYAN.Sec — Security Researcher & Penetration Tester',
      'Offensive security researcher and penetration tester dossier.',
      'AAYAN.SEC',
      'SECURITY RESEARCH DOSSIER // 2025',
      'BUILT WITH PRECISION',
      'OPEN FOR COLLABORATION',
      1,
      'contact@aayan-sec.com',
      'https://github.com/aayan-sec',
      'https://linkedin.com/in/aayan-sec',
      'https://twitter.com/aayan_sec'
    );
  }

  // Hero content table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hero_content (
      id TEXT PRIMARY KEY DEFAULT 'current',
      brand_name TEXT NOT NULL,
      headline TEXT NOT NULL,
      manifesto_line_1 TEXT NOT NULL,
      manifesto_line_2 TEXT NOT NULL,
      manifesto_line_3 TEXT NOT NULL,
      status_label TEXT NOT NULL,
      status_subtext TEXT NOT NULL,
      stat_projects TEXT NOT NULL,
      stat_writeups TEXT NOT NULL,
      stat_curiosity TEXT NOT NULL,
      quote TEXT NOT NULL,
      cta_text TEXT NOT NULL,
      cta_target TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const heroCheck = db.prepare('SELECT COUNT(*) as count FROM hero_content').get() as { count: number };
  if (heroCheck.count === 0) {
    db.prepare(`
      INSERT INTO hero_content (id, brand_name, headline, manifesto_line_1, manifesto_line_2, manifesto_line_3, status_label, status_subtext, stat_projects, stat_writeups, stat_curiosity, quote, cta_text, cta_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'current',
      'AAYAN.',
      'SECURITY RESEARCHER & PENTESTER',
      'EXPLORING SYSTEMS.',
      'FINDING FLAWS.',
      'CREATING IMPACT.',
      'OPEN FOR COLLABORATION',
      'Research • Bug Bounty • Projects',
      '10+',
      '5+',
      '∞',
      'CURIOSITY ALWAYS FINDS A WAY IN.',
      'VIEW MY RESEARCH',
      'research'
    );
  }

  // About content table
  db.exec(`
    CREATE TABLE IF NOT EXISTS about_content (
      id TEXT PRIMARY KEY DEFAULT 'current',
      status_badge TEXT NOT NULL,
      spec_text TEXT NOT NULL,
      bio_paragraph_1 TEXT NOT NULL,
      bio_paragraph_2 TEXT NOT NULL,
      motto_quote TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const aboutCheck = db.prepare('SELECT COUNT(*) as count FROM about_content').get() as { count: number };
  if (aboutCheck.count === 0) {
    db.prepare(`
      INSERT INTO about_content (id, status_badge, spec_text, bio_paragraph_1, bio_paragraph_2, motto_quote)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'current',
      'ACTIVE RESEARCHER',
      'OFFENSIVE SECURITY & PENTESTING',
      'Aayan is an offensive security researcher, penetration tester, and bug bounty hunter specializing in deep-dive architectural vulnerability analysis, authentication bypasses, cloud infrastructure exploitation, and custom tooling development.',
      'Approaching security research with an inquisitive, adversarial mindset, the primary focus lies in dissecting complex protocols, uncovering non-intuitive logic flaws, and converting theoretical threat models into validated proof-of-concept exploits.',
      'BREAKING TO REINFORCE • RESEARCHING TO SECURE'
    );
  }

  // Research domains table
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_num TEXT NOT NULL,
      domain_code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      display_order INTEGER DEFAULT 0
    );
  `);

  const domainsCheck = db.prepare('SELECT COUNT(*) as count FROM research_domains').get() as { count: number };
  if (domainsCheck.count === 0) {
    const insertDomain = db.prepare(`
      INSERT INTO research_domains (domain_num, domain_code, title, description, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertDomain.run('01', 'WEB ARCHITECTURE', 'AUTH & LOGIC FLAWS', 'OAuth 2.0 / OIDC protocol state mismatches, session fixation, JWT signature exclusions, and IDOR chains across enterprise web applications.', 1);
    insertDomain.run('02', 'CLOUD ATTACK VECTORS', 'SERVERLESS & IAM', 'Dangling DNS alias takeovers, IMDSv1/v2 metadata exfiltration, over-privileged IAM roles, and AWS/Cloudflare edge compute misconfigurations.', 2);
    insertDomain.run('03', 'ACTIVE RECONNAISSANCE', 'PERIMETER ENUMERATION', 'Automated continuous surface mapping, TLS certificate stream monitoring, ASN expansion, and rapid vulnerability triage.', 3);
    insertDomain.run('04', 'REVERSE ENGINEERING', 'BINARY & FIRMWARE', 'Disassembly and decompilation of proprietary network binaries using Ghidra, memory corruption triage, and protocol analysis.', 4);
  }

  // Methodology steps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS methodology_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      step_num TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      display_order INTEGER DEFAULT 0
    );
  `);

  const stepsCheck = db.prepare('SELECT COUNT(*) as count FROM methodology_steps').get() as { count: number };
  if (stepsCheck.count === 0) {
    const insertStep = db.prepare(`
      INSERT INTO methodology_steps (step_num, title, description, display_order)
      VALUES (?, ?, ?, ?)
    `);
    insertStep.run('01', 'Target Scope Definition & Threat Modeling', 'Establishing testing boundaries, rules of engagement, and high-impact attack paths.', 1);
    insertStep.run('02', 'Surface Enumeration & Passive OSINT', 'Non-intrusive metadata harvesting, DNS intelligence, and technology fingerprinting.', 2);
    insertStep.run('03', 'Active Vulnerability Probing & Exploit PoC', 'Crafting targeted payloads, verifying business logic boundaries, and proving real security impact.', 3);
    insertStep.run('04', 'Comprehensive Remediation Guidance', 'Delivering clear, actionable technical reports to empower engineering teams to patch securely.', 4);
  }

  // Skills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_num TEXT NOT NULL,
      category_title TEXT NOT NULL,
      description TEXT NOT NULL,
      skills_json TEXT NOT NULL,
      tools_json TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published'
    );
  `);

  const skillsCheck = db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number };
  if (skillsCheck.count === 0) {
    const insertSkill = db.prepare(`
      INSERT INTO skills (category_num, category_title, description, skills_json, tools_json, display_order, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertSkill.run(
      '01',
      'WEB APPLICATION SECURITY',
      'Deep inspection and exploitation of modern web architectures and APIs.',
      JSON.stringify([
        'OAuth 2.0 & OpenID Connect Bypass',
        'Authentication State Fixation',
        'Insecure Direct Object References (IDOR)',
        'Server-Side Request Forgery (SSRF)',
        'GraphQL Query Depth & Mass Assignment',
        'Cross-Site Scripting (Contextual XSS)',
        'SQL Injection & Blind Extraction',
        'Race Conditions & Concurrency Flaws',
      ]),
      JSON.stringify(['Burp Suite Professional', 'OWASP ZAP', 'Caido', 'Postman', 'ffuf']),
      1,
      'published'
    );

    insertSkill.run(
      '02',
      'ACTIVE RECONNAISSANCE & OSINT',
      'Automated perimeter discovery, ASN enumeration, and asset footprinting.',
      JSON.stringify([
        'Subdomain Permutation & Resolution',
        'Dangling DNS & Takeover Identification',
        'TLS Certificate Transparency Monitoring',
        'Autonomous Surface Differential Scanning',
        'GitHub Secret & Leak Scrapes',
        'Cloud S3 & Storage Bucket Enumeration',
      ]),
      JSON.stringify(['Amass', 'Subfinder', 'httpx', 'Nuclei', 'Masscan', 'naabu']),
      2,
      'published'
    );

    insertSkill.run(
      '03',
      'CLOUD & INFRASTRUCTURE SECURITY',
      'Assessing resilience of AWS, GCP, and Kubernetes cloud perimeters.',
      JSON.stringify([
        'AWS IMDSv1 / v2 SSRF Extraction',
        'IAM Least-Privilege & Escalation Paths',
        'Serverless Lambda / Cloudflare Edge Audits',
        'Container Escape & Misconfiguration Analysis',
        'VPC Peering & Network Exposure Probing',
      ]),
      JSON.stringify(['AWS CLI', 'ScoutSuite', 'Pacu', 'Prowler', 'Docker', 'Kubectl']),
      3,
      'published'
    );

    insertSkill.run(
      '04',
      'BINARY & REVERSE ENGINEERING',
      'Dissecting binaries, proprietary daemons, and firmware protocols.',
      JSON.stringify([
        'Static & Dynamic Binary Disassembly',
        'Memory Corruption & Heap Underflow Triage',
        'MIPS & ARM Architecture Analysis',
        'Custom Protocol Reverse Engineering',
        'Binary Hardening Checks (ASLR, DEP, Canary)',
      ]),
      JSON.stringify(['Ghidra', 'GDB / Peda / Pwndbg', 'Radare2', 'Wireshark', 'Binwalk']),
      4,
      'published'
    );
  }
}

