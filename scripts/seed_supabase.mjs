import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log('[-] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.log('[-] Skipping remote Supabase seeding. Local development database remains active.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runSeed() {
  console.log('[*] Seeding Supabase database at:', supabaseUrl);

  // 1. Site Settings
  const { error: errSettings } = await supabase.from('site_settings').upsert({
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
  });
  if (errSettings) console.error('Error seeding site_settings:', errSettings.message);
  else console.log('[+] Seeded site_settings');

  // 2. Hero Content
  const { error: errHero } = await supabase.from('hero_content').upsert({
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
  });
  if (errHero) console.error('Error seeding hero_content:', errHero.message);
  else console.log('[+] Seeded hero_content');

  // 3. About Content
  const { error: errAbout } = await supabase.from('about_content').upsert({
    id: 'current',
    status_badge: 'ACTIVE RESEARCHER',
    spec_text: 'OFFENSIVE SECURITY & PENTESTING',
    bio_paragraph_1: 'Aayan is an offensive security researcher, penetration tester, and bug bounty hunter specializing in deep-dive architectural vulnerability analysis, authentication bypasses, cloud infrastructure exploitation, and custom tooling development.',
    bio_paragraph_2: 'Approaching security research with an inquisitive, adversarial mindset, the primary focus lies in dissecting complex protocols, uncovering non-intuitive logic flaws, and converting theoretical threat models into validated proof-of-concept exploits.',
    motto_quote: 'BREAKING TO REINFORCE • RESEARCHING TO SECURE',
  });
  if (errAbout) console.error('Error seeding about_content:', errAbout.message);
  else console.log('[+] Seeded about_content');

  console.log('[+] Supabase seeding finished successfully.');
}

runSeed().catch(console.error);
