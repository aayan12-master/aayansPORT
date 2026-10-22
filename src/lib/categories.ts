/**
 * AAYAN.Sec - Standard Cybersecurity Research Categories
 * Single source of truth for research post categories across Admin Panel and Public Research views.
 */
export const RESEARCH_CATEGORIES = [
  'Web Security',
  'Cloud & Recon',
  'Cloud Infrastructure',
  'Binary & Firmware',
  'API Security',
  'Network Security',
  'Penetration Testing',
  'Ethical Hacking',
  'Vulnerability Research',
  'Bug Bounty',
  'Red Teaming',
  'Blue Teaming',
  'Malware Analysis',
  'Digital Forensics & Incident Response',
  'Threat Intelligence',
  'Active Directory Security',
  'Linux Security & Hardening',
  'Windows Security',
  'Mobile Application Security',
  'Cryptography',
  'Reverse Engineering',
  'Exploit Development',
  'Privilege Escalation',
  'OSINT & Reconnaissance',
  'Wireless Security',
  'IoT Security',
  'Container & Kubernetes Security',
  'DevSecOps',
  'AI & LLM Security',
  'Secure Code Review',
  'Security Tools & Methodology',
  'CTF & Lab Practice',
  'Research & Standards',
  'Other',
] as const;

export type ResearchCategory = (typeof RESEARCH_CATEGORIES)[number];
