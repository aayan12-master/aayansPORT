-- ==============================================================================
-- AAYAN.SEC PORTFOLIO — INITIAL SEED DATA
-- ==============================================================================

-- 1. SITE SETTINGS
INSERT INTO site_settings (id, site_title, site_description, footer_brand, footer_text, footer_subtext, status_text, open_for_collaboration, contact_email, github_url, linkedin_url, twitter_url, pgp_key)
VALUES (
  'current',
  'AAYAN.Sec — Security Researcher & Penetration Tester',
  'Offensive security researcher and penetration tester dossier.',
  'AAYAN.SEC',
  'SECURITY RESEARCH DOSSIER // 2025',
  'BUILT WITH PRECISION',
  'OPEN FOR COLLABORATION',
  true,
  'contact@aayan-sec.com',
  'https://github.com/aayan-sec',
  'https://linkedin.com/in/aayan-sec',
  'https://twitter.com/aayan_sec',
  '-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.10
Comment: AAYAN.Sec Public Key

mQENBF+1e7EBCADK1rW9j8V1L2Vp... [TRUNCATED]
Key ID: 0x9B42F1EA
Fingerprint: 4C2F 9E81 3B07 D4A2 88C1  77F3 9B42 F1EA 2025 AAYN
-----END PGP PUBLIC KEY BLOCK-----'
) ON CONFLICT (id) DO UPDATE SET
  site_title = EXCLUDED.site_title,
  site_description = EXCLUDED.site_description;

-- 2. HERO CONTENT
INSERT INTO hero_content (id, brand_name, headline, manifesto_line_1, manifesto_line_2, manifesto_line_3, status_label, status_subtext, stat_projects, stat_writeups, stat_curiosity, quote, cta_text, cta_target)
VALUES (
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
) ON CONFLICT (id) DO UPDATE SET
  headline = EXCLUDED.headline,
  brand_name = EXCLUDED.brand_name;

-- 3. ABOUT CONTENT
INSERT INTO about_content (id, status_badge, spec_text, bio_paragraph_1, bio_paragraph_2, motto_quote)
VALUES (
  'current',
  'ACTIVE RESEARCHER',
  'OFFENSIVE SECURITY & PENTESTING',
  'Aayan is an offensive security researcher, penetration tester, and bug bounty hunter specializing in deep-dive architectural vulnerability analysis, authentication bypasses, cloud infrastructure exploitation, and custom tooling development.',
  'Approaching security research with an inquisitive, adversarial mindset, the primary focus lies in dissecting complex protocols, uncovering non-intuitive logic flaws, and converting theoretical threat models into validated proof-of-concept exploits.',
  'BREAKING TO REINFORCE • RESEARCHING TO SECURE'
) ON CONFLICT (id) DO UPDATE SET
  bio_paragraph_1 = EXCLUDED.bio_paragraph_1,
  bio_paragraph_2 = EXCLUDED.bio_paragraph_2;

-- 4. RESEARCH DOMAINS
DELETE FROM research_domains;
INSERT INTO research_domains (domain_num, domain_code, title, description, display_order)
VALUES
  ('01', 'WEB ARCHITECTURE', 'AUTH & LOGIC FLAWS', 'OAuth 2.0 / OIDC protocol state mismatches, session fixation, JWT signature exclusions, and IDOR chains across enterprise web applications.', 1),
  ('02', 'CLOUD ATTACK VECTORS', 'SERVERLESS & IAM', 'Dangling DNS alias takeovers, IMDSv1/v2 metadata exfiltration, over-privileged IAM roles, and AWS/Cloudflare edge compute misconfigurations.', 2),
  ('03', 'ACTIVE RECONNAISSANCE', 'PERIMETER ENUMERATION', 'Automated continuous surface mapping, TLS certificate stream monitoring, ASN expansion, and rapid vulnerability triage.', 3),
  ('04', 'REVERSE ENGINEERING', 'BINARY & FIRMWARE', 'Disassembly and decompilation of proprietary network binaries using Ghidra, memory corruption triage, and protocol analysis.', 4);

-- 5. METHODOLOGY STEPS
DELETE FROM methodology_steps;
INSERT INTO methodology_steps (step_num, title, description, display_order)
VALUES
  ('01', 'Target Scope Definition & Threat Modeling', 'Establishing testing boundaries, rules of engagement, and high-impact attack paths.', 1),
  ('02', 'Surface Enumeration & Passive OSINT', 'Non-intrusive metadata harvesting, DNS intelligence, and technology fingerprinting.', 2),
  ('03', 'Active Vulnerability Probing & Exploit PoC', 'Crafting targeted payloads, verifying business logic boundaries, and proving real security impact.', 3),
  ('04', 'Comprehensive Remediation Guidance', 'Delivering clear, actionable technical reports to empower engineering teams to patch securely.', 4);

-- 6. RESEARCH POSTS
DELETE FROM research_posts;
INSERT INTO research_posts (title, slug, summary, content, category, severity, cve_id, published_date, tags, external_url, status, display_order)
VALUES
  (
    'OAuth 2.0 Account Takeover via Dynamic Client Registration & State Fixation',
    'oauth-account-takeover-state-fixation',
    'A deep-dive investigation into authorization code flow vulnerabilities allowing session fixation and silent token leakage across federated identity providers.',
    'During white-box security auditing of enterprise SSO gateways, an authorization state verification bypass was discovered. This advisory analyzes the architectural mismatch between RFC 6749 and implementation edge cases.',
    'Web Security',
    'High',
    'CVE-2024-8841',
    '2025-01-14',
    'OAuth, SSO, Identity, Auth Bypass',
    'https://github.com/aayan-sec/research-advisories',
    'published',
    1
  ),
  (
    'Subdomain Takeover via Dangling DNS CNAME & Orphaned Cloudflare Workers',
    'subdomain-takeover-dangling-cname',
    'Systematic reconnaissance methodology detecting stale apex DNS aliases pointing to deleted serverless edge compute targets.',
    'Edge compute routing creates novel persistence mechanisms for dangling DNS records. By monitoring TLS handshake discrepancies and zone delegations, 42 vulnerable enterprise domains were ethically identified and remediated.',
    'Cloud & Recon',
    'Critical',
    'RESEARCH-2024-03',
    '2024-11-28',
    'DNS, Recon, Cloudflare, Serverless',
    'https://github.com/aayan-sec/recon-cname-auditor',
    'published',
    2
  ),
  (
    'Blind SSRF to AWS Instance Metadata Service (IMDSv1 & v2 Token Flaws)',
    'blind-ssrf-aws-metadata-bypass',
    'Analyzing modern cloud metadata defenses and exploitation pathways through headless document rendering pipelines.',
    'Exploitation breakdown of server-side PDF generating workers that parse SVG XML and HTML canvas inputs to exfiltrate IAM role credentials via IPv6 fallback and header injection.',
    'Cloud Infrastructure',
    'Critical',
    'ADVISORY-2024-11',
    '2024-09-19',
    'SSRF, AWS, Cloud, Exploit',
    'https://github.com/aayan-sec/ssrf-payload-matrix',
    'published',
    3
  ),
  (
    'Memory Corruption in Custom IoT Gateway Network Daemon',
    'iot-gateway-memory-corruption',
    'Reverse engineering a proprietary MIPS firmware binary to isolate an unauthenticated heap buffer overflow in the discovery protocol.',
    'Detailed reverse engineering methodology using Ghidra and GDB to reconstruct packet processing routines, pinpointing an integer underflow leading to arbitrary write primitives.',
    'Binary & Firmware',
    'High',
    'CVE-2024-4190',
    '2024-06-05',
    'Reverse Engineering, MIPS, Exploit, C/C++',
    'https://github.com/aayan-sec/mips-heap-analysis',
    'published',
    4
  ),
  (
    'GraphQL Schema Introspection & Mass Assignment in Financial API',
    'graphql-mass-assignment-financial',
    'Uncovering hidden administrative mutations and batch query denial-of-service vulnerabilities in authenticated fintech services.',
    'Analysis of circular relationship queries and type system discrepancies allowing non-privileged accounts to elevate role parameters via unvalidated input object types.',
    'API Security',
    'Medium',
    'RESEARCH-2024-01',
    '2024-03-12',
    'GraphQL, API, Authorization, Pentesting',
    'https://github.com/aayan-sec/graphql-security-matrix',
    'published',
    5
  );

-- 7. PROJECTS & ARSENAL
DELETE FROM projects;
INSERT INTO projects (title, slug, summary, description, tech_stack, category, repo_url, demo_url, status, featured, display_order)
VALUES
  (
    'ReconPulse — Distributed Attack Surface Enumerator',
    'reconpulse-attack-surface',
    'High-speed asynchronous subdomain enumeration, TLS fingerprinting, and technology detection pipeline built for offensive security engagements.',
    'ReconPulse orchestrates multi-source passive OSINT aggregation with active DNS resolution and port probing. Features real-time alerting for newly discovered assets and diff tracking across enterprise perimeters.',
    'Go, Python, Docker, Redis',
    'Recon Tooling',
    'https://github.com/aayan-sec/reconpulse',
    'https://reconpulse.dev',
    'published',
    true,
    1
  ),
  (
    'JWT-Tamperer — Burp Suite Pro Extension',
    'jwt-tamperer-burp-extension',
    'Automated signature exclusion, algorithm confusion, and brute-force secret verification for JSON Web Tokens in real-time HTTP traffic.',
    'Integrated into the Burp Suite proxy pipeline, this extension automatically highlights weak HMAC secrets, none-algorithm bypass attempts, and jku/x5u header injection vulnerabilities.',
    'Java, Python, Burp Extender API',
    'Burp Extension',
    'https://github.com/aayan-sec/jwt-tamperer',
    'https://github.com/aayan-sec/jwt-tamperer#demo',
    'published',
    true,
    2
  ),
  (
    'PayloadForge — Context-Aware XSS & SSRF Generator',
    'payloadforge-generator',
    'CLI tool generating obfuscated payloads tailored to specific WAF bypass signatures, character filter constraints, and HTML contexts.',
    'Leverages abstract syntax tree parsing to dynamically assemble polyglots and unicode normalizations that bypass modern cloud WAF rules while ensuring deterministic execution.',
    'TypeScript, Node.js, Rust',
    'Exploit Tooling',
    'https://github.com/aayan-sec/payloadforge',
    'https://payloadforge.run',
    'published',
    true,
    3
  ),
  (
    'CloudAudit-CLI — Multi-Cloud Security Posture Checker',
    'cloudaudit-cli',
    'Lightweight scanner evaluating AWS, GCP, and Azure environments for permissive IAM policies, public storage buckets, and exposed security groups.',
    'Engineered for rapid assessment during red team and penetration testing engagements to pinpoint privilege escalation paths and misconfigured cloud assets in minutes.',
    'Python, Boto3, Click',
    'Cloud Security',
    'https://github.com/aayan-sec/cloudaudit-cli',
    'https://github.com/aayan-sec/cloudaudit-cli',
    'published',
    false,
    4
  );

-- 8. SKILLS MATRIX
DELETE FROM skills;
INSERT INTO skills (category_num, category_title, description, skills, tools, display_order, status)
VALUES
  (
    '01',
    'WEB APPLICATION SECURITY',
    'Deep inspection and exploitation of modern web architectures and APIs.',
    ARRAY[
      'OAuth 2.0 & OpenID Connect Bypass',
      'Authentication State Fixation',
      'Insecure Direct Object References (IDOR)',
      'Server-Side Request Forgery (SSRF)',
      'GraphQL Query Depth & Mass Assignment',
      'Cross-Site Scripting (Contextual XSS)',
      'SQL Injection & Blind Extraction',
      'Race Conditions & Concurrency Flaws'
    ],
    ARRAY['Burp Suite Professional', 'OWASP ZAP', 'Caido', 'Postman', 'ffuf'],
    1,
    'published'
  ),
  (
    '02',
    'ACTIVE RECONNAISSANCE & OSINT',
    'Automated perimeter discovery, ASN enumeration, and asset footprinting.',
    ARRAY[
      'Subdomain Permutation & Resolution',
      'Dangling DNS & Takeover Identification',
      'TLS Certificate Transparency Monitoring',
      'Autonomous Surface Differential Scanning',
      'GitHub Secret & Leak Scrapes',
      'Cloud S3 & Storage Bucket Enumeration'
    ],
    ARRAY['Amass', 'Subfinder', 'httpx', 'Nuclei', 'Masscan', 'naabu'],
    2,
    'published'
  ),
  (
    '03',
    'CLOUD & INFRASTRUCTURE SECURITY',
    'Assessing resilience of AWS, GCP, and Kubernetes cloud perimeters.',
    ARRAY[
      'AWS IMDSv1 / v2 SSRF Extraction',
      'IAM Least-Privilege & Escalation Paths',
      'Serverless Lambda / Cloudflare Edge Audits',
      'Container Escape & Misconfiguration Analysis',
      'VPC Peering & Network Exposure Probing'
    ],
    ARRAY['AWS CLI', 'ScoutSuite', 'Pacu', 'Prowler', 'Docker', 'Kubectl'],
    3,
    'published'
  ),
  (
    '04',
    'BINARY & REVERSE ENGINEERING',
    'Dissecting binaries, proprietary daemons, and firmware protocols.',
    ARRAY[
      'Static & Dynamic Binary Disassembly',
      'Memory Corruption & Heap Underflow Triage',
      'MIPS & ARM Architecture Analysis',
      'Custom Protocol Reverse Engineering',
      'Binary Hardening Checks (ASLR, DEP, Canary)'
    ],
    ARRAY['Ghidra', 'GDB / Peda / Pwndbg', 'Radare2', 'Wireshark', 'Binwalk'],
    4,
    'published'
  );
