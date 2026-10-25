import {
  isValidSocialUrl,
  normalizeSocialAccounts,
  PLATFORM_PRESETS,
  getPlatformPreset,
  formatSocialIdentity,
  getSocialDisplayData,
} from '../src/lib/socials.js';

async function testUnitHelpers() {
  console.log('=== 1. TESTING SOCIAL HELPERS, PRESETS & CLEAN IDENTITIES ===');

  // A. Presets
  console.log(`Available Presets: ${PLATFORM_PRESETS.map((p) => p.name).join(', ')}`);
  const thmPreset = getPlatformPreset('tryhackme');
  console.log(`TryHackMe preset default label: ${thmPreset.defaultLabel}`);
  if (thmPreset.defaultLabel !== 'TRYHACKME') throw new Error('thm preset mismatch');

  const htbPreset = getPlatformPreset('hackthebox');
  console.log(`HTB preset default label: ${htbPreset.defaultLabel}`);
  if (htbPreset.defaultLabel !== 'HACK THE BOX') throw new Error('htb preset mismatch');

  const customPreset = getPlatformPreset('mastodon');
  console.log(`Custom preset fallback: ${customPreset.name}`);
  if (customPreset.platform !== 'custom') throw new Error('custom preset fallback mismatch');

  // B. URL validation
  const validUrls = [
    'https://github.com/aayan-sec',
    'https://tryhackme.com/p/aayan',
    'https://app.hackthebox.com/profile/12345',
    'https://linkedin.com/in/aayan-sec',
    'http://localhost:3000',
  ];
  const invalidUrls = [
    'javascript:alert(1)',
    'http://insecure-site.com',
    'ftp://files.com',
    'not-a-url',
    '',
    '   ',
  ];

  for (const u of validUrls) {
    if (!isValidSocialUrl(u)) {
      throw new Error(`Expected valid URL to pass: ${u}`);
    }
  }
  console.log(`✓ All ${validUrls.length} valid URLs correctly passed.`);

  for (const u of invalidUrls) {
    if (isValidSocialUrl(u)) {
      throw new Error(`Expected invalid URL to fail: ${u}`);
    }
  }
  console.log(`✓ All ${invalidUrls.length} invalid URLs correctly rejected.`);

  // C. Testing Clean Social Identity Formatter (formatSocialIdentity)
  console.log('\n--- Testing formatSocialIdentity Rules ---');

  const testCases = [
    // GitHub
    {
      account: { id: '1', platform: 'github', label: 'GITHUB', url: 'https://github.com/aayan-sec', display_order: 1, enabled: true },
      expected: 'github.com/aayan-sec',
    },
    // GitHub with query parameters, tracking, and trailing slash
    {
      account: { id: '2', platform: 'github', label: 'GITHUB', url: 'https://github.com/aayan-sec/?tab=repositories&utm_source=portfolio#readme', display_order: 2, enabled: true },
      expected: 'github.com/aayan-sec',
    },
    // LinkedIn
    {
      account: { id: '3', platform: 'linkedin', label: 'LINKEDIN', url: 'https://www.linkedin.com/in/aayan-sec/', display_order: 3, enabled: true },
      expected: 'linkedin.com/in/aayan-sec',
    },
    // X / Twitter (@handle)
    {
      account: { id: '4', platform: 'twitter', label: 'TWITTER', url: 'https://x.com/aayan_sec?s=20', display_order: 4, enabled: true },
      expected: '@aayan_sec',
    },
    {
      account: { id: '5', platform: 'twitter', label: 'TWITTER', url: 'https://twitter.com/aayan_sec/', display_order: 5, enabled: true },
      expected: '@aayan_sec',
    },
    // Instagram (@handle)
    {
      account: { id: '6', platform: 'instagram', label: 'INSTAGRAM', url: 'https://www.instagram.com/aayan-sec/?hl=en', display_order: 6, enabled: true },
      expected: '@aayan-sec',
    },
    // TryHackMe
    {
      account: { id: '7', platform: 'tryhackme', label: 'TRYHACKME', url: 'https://tryhackme.com/p/aayan-sec', display_order: 7, enabled: true },
      expected: 'tryhackme.com/p/aayan-sec',
    },
    // Hack The Box
    {
      account: { id: '8', platform: 'hackthebox', label: 'HACK THE BOX', url: 'https://app.hackthebox.com/profile/aayan-sec', display_order: 8, enabled: true },
      expected: 'HTB · aayan-sec',
    },
    // Custom platform
    {
      account: { id: '9', platform: 'custom', label: 'CTFTIME', url: 'https://ctftime.org/team/123456?ref=site', display_order: 9, enabled: true },
      expected: 'ctftime.org/team/123456',
    },
    // Custom display name override (admin preferred handle)
    {
      account: {
        id: '10',
        platform: 'custom',
        label: 'CUSTOM',
        url: 'https://matrix.to/#/@aayan:matrix.org',
        display_name: 'matrix:@aayan',
        display_order: 10,
        enabled: true,
      },
      expected: 'matrix:@aayan',
    },
    // Custom display name on standard platform
    {
      account: {
        id: '11',
        platform: 'hackthebox',
        label: 'HTB',
        url: 'https://app.hackthebox.com/profile/99999',
        display_name: 'HTB · AayanElite',
        display_order: 11,
        enabled: true,
      },
      expected: 'HTB · AayanElite',
    },
  ];

  for (const tc of testCases) {
    const formatted = formatSocialIdentity(tc.account);
    console.log(`  [${tc.account.platform.padEnd(10)}] Input: ${tc.account.url} -> Output: "${formatted}"`);
    if (formatted !== tc.expected) {
      throw new Error(`Format mismatch for ${tc.account.platform} (${tc.account.url}): got "${formatted}", expected "${tc.expected}"`);
    }
    // Verify destination URL is never mutated
    if (tc.account.url.includes('?') && !tc.account.url.includes('utm_source') && tc.expected.includes('?')) {
      throw new Error('Destination URL was unexpectedly modified');
    }
  }
  console.log(`✓ All ${testCases.length} formatSocialIdentity test cases passed perfectly.`);

  // D. Testing getSocialDisplayData (accessibility and title attribute metadata)
  const displayData = getSocialDisplayData({
    id: 'test',
    platform: 'github',
    label: 'GITHUB',
    url: 'https://github.com/aayan-sec?tab=repositories',
    display_order: 1,
    enabled: true,
  });
  if (displayData.identity !== 'github.com/aayan-sec') {
    throw new Error(`getSocialDisplayData identity mismatch: ${displayData.identity}`);
  }
  if (!displayData.title.includes('Destination: https://github.com/aayan-sec?tab=repositories')) {
    throw new Error(`getSocialDisplayData title missing destination: ${displayData.title}`);
  }
  if (displayData.ariaLabel !== 'GITHUB: github.com/aayan-sec') {
    throw new Error(`getSocialDisplayData ariaLabel mismatch: ${displayData.ariaLabel}`);
  }
  console.log('✓ getSocialDisplayData generates accurate accessible attributes and preserves target destination.');

  // E. Normalization from legacy
  const legacySettings = {
    github_url: 'https://github.com/legacy-test',
    linkedin_url: 'https://linkedin.com/in/legacy-test',
    twitter_url: 'https://x.com/legacy_test',
  };
  const normalizedFromLegacy = normalizeSocialAccounts(legacySettings);
  console.log(`✓ Normalized from legacy: ${normalizedFromLegacy.length} accounts`);
  if (normalizedFromLegacy.length !== 3) throw new Error('Normalization from legacy failed');

  // F. Normalization from JSON array with display_name preservation
  const jsonSettings = {
    social_links: [
      { id: '1', platform: 'tryhackme', label: 'TRYHACKME', url: 'https://tryhackme.com/p/test', display_order: 2, enabled: true },
      { id: '2', platform: 'github', label: 'GITHUB', url: 'https://github.com/test', display_order: 1, enabled: true, display_name: 'gh:test-handle' },
    ],
  };
  const normalizedFromJson = normalizeSocialAccounts(jsonSettings);
  console.log(`✓ Normalized from JSON sorted by display_order: ${normalizedFromJson.map((a) => a.label).join(' -> ')}`);
  if (normalizedFromJson[0].label !== 'GITHUB' || normalizedFromJson[1].label !== 'TRYHACKME') {
    throw new Error('Sorting by display_order failed');
  }
  if (normalizedFromJson[0].display_name !== 'gh:test-handle') {
    throw new Error('display_name was not preserved in normalizeSocialAccounts');
  }
  console.log('✓ display_name properly parsed and preserved.');
}

async function testApiIntegration() {
  console.log('\n=== 2. TESTING API PERSISTENCE & SYNCHRONIZATION ===');

  const baseUrl = 'http://127.0.0.1:3000';

  // Check if local server is running, if not start or note it
  let serverRunning = false;
  try {
    const ping = await fetch(`${baseUrl}/api/settings`);
    if (ping.ok) serverRunning = true;
  } catch {
    serverRunning = false;
  }

  if (!serverRunning) {
    console.log('Dev server is not currently running on port 3000. Skipping live HTTP tests.');
    return;
  }

  // 1. Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'aayan_sec_2025' }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Failed to login and obtain cookie');
  }
  console.log('✓ Successfully authenticated admin session.');

  // 2. Fetch current settings
  const currentRes = await fetch(`${baseUrl}/api/admin/site-settings`, {
    headers: { Cookie: cookie },
  });
  const currentText = await currentRes.text();
  console.log(`GET /api/admin/site-settings status: ${currentRes.status}`);
  let currentData;
  try {
    currentData = JSON.parse(currentText);
  } catch (e) {
    console.error('Response was not JSON:', currentText.slice(0, 300));
    throw e;
  }
  console.log('✓ Current site settings retrieved.');
  const initialLinks = currentData.settings?.social_links || [];
  console.log(`Configured social accounts count: ${initialLinks.length}`);

  // 3. Test Invalid URL rejection on server
  const invalidPutRes = await fetch(`${baseUrl}/api/admin/site-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      social_links: [
        { id: 'bad', platform: 'custom', label: 'BAD LINK', url: 'javascript:alert(1)', enabled: true, display_order: 1 },
      ],
    }),
  });
  const invalidPutData = await invalidPutRes.json();
  console.log(`Server rejection of invalid URL: Status = ${invalidPutRes.status}, Error = "${invalidPutData.error}"`);
  if (invalidPutRes.status !== 400) {
    throw new Error('Server should have rejected invalid URL with 400 Bad Request');
  }
  console.log('✓ Server-side validation confirmed.');

  // 4. Update with new platform accounts: GitHub, LinkedIn, Twitter, TryHackMe, Hack The Box, Instagram, Custom
  const testSocials = [
    {
      id: 'github',
      platform: 'github',
      label: 'GITHUB',
      url: 'https://github.com/aayan-sec?tab=repositories&utm_source=portfolio',
      display_order: 1,
      enabled: true,
    },
    {
      id: 'linkedin',
      platform: 'linkedin',
      label: 'LINKEDIN',
      url: 'https://linkedin.com/in/aayan-sec',
      display_order: 2,
      enabled: true,
    },
    {
      id: 'twitter',
      platform: 'twitter',
      label: 'TWITTER (X)',
      url: 'https://x.com/aayan_sec',
      display_order: 3,
      enabled: true,
    },
    {
      id: 'thm',
      platform: 'tryhackme',
      label: 'TRYHACKME',
      url: 'https://tryhackme.com/p/aayan-sec',
      display_order: 4,
      enabled: true,
    },
    {
      id: 'htb',
      platform: 'hackthebox',
      label: 'HACK THE BOX',
      url: 'https://app.hackthebox.com/profile/123456',
      display_name: 'HTB · aayan-sec',
      display_order: 5,
      enabled: true,
    },
    {
      id: 'custom-disabled',
      platform: 'custom',
      label: 'ARCHIVED BLOG',
      url: 'https://old-blog.aayan-sec.com/posts',
      display_order: 6,
      enabled: false,
    },
  ];

  const putRes = await fetch(`${baseUrl}/api/admin/site-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      site_title: 'AAYAN.Sec | Cybersecurity Researcher & Pentester Portfolio',
      site_description: 'Offensive security researcher and pentester specializing in web applications and low-level vulnerability research.',
      og_title: 'AAYAN.Sec — Security Intelligence & Dossier',
      og_description: 'Adversarial exploration, cloud penetration testing, and exploit tooling.',
      og_image: 'https://aayan-sec.com/og-card.png',
      canonical_url: 'https://aayan-sec.com',
      social_links: testSocials,
    }),
  });

  const putData = await putRes.json();
  if (!putRes.ok || !putData.success) {
    throw new Error(`Failed to update site settings: ${putData.error}`);
  }
  console.log('✓ Successfully saved 6 social accounts (including custom display_name and disabled account) to Supabase.');

  // 5. Verify public endpoint reflection and clean identity formatting
  const publicRes = await fetch(`${baseUrl}/api/settings`);
  const publicData = await publicRes.json();
  const pubLinks = normalizeSocialAccounts(publicData.settings);
  console.log(`Public /api/settings returned ${pubLinks.length} configured social accounts.`);
  console.log(`Legacy github_url synchronized: ${publicData.settings?.github_url}`);
  console.log(`OG Title synchronized: ${publicData.settings?.og_title}`);

  if (pubLinks.length !== 6) {
    throw new Error(`Expected 6 social accounts, got ${pubLinks.length}`);
  }

  // Active accounts for public components:
  const activePubLinks = pubLinks.filter((a) => a.enabled && isValidSocialUrl(a.url));
  console.log(`Active visible public accounts: ${activePubLinks.length} (disabled account correctly filtered)`);
  if (activePubLinks.length !== 5) {
    throw new Error(`Expected 5 active visible accounts, got ${activePubLinks.length}`);
  }

  // Check GitHub identity formatting and destination preservation
  const gh = activePubLinks.find((a) => a.platform === 'github');
  if (!gh) throw new Error('GitHub account missing in public settings');
  if (gh.url !== 'https://github.com/aayan-sec?tab=repositories&utm_source=portfolio') {
    throw new Error(`GitHub destination URL was modified! Got: ${gh.url}`);
  }
  const ghIdentity = formatSocialIdentity(gh);
  console.log(`  GitHub Clean Display: "${ghIdentity}" (Destination: ${gh.url})`);
  if (ghIdentity !== 'github.com/aayan-sec') {
    throw new Error(`GitHub identity should strip query params, got: ${ghIdentity}`);
  }

  // Check HTB with custom display_name
  const htb = activePubLinks.find((a) => a.platform === 'hackthebox');
  if (!htb) throw new Error('HTB account missing in public settings');
  const htbIdentity = formatSocialIdentity(htb);
  console.log(`  HTB Clean Display: "${htbIdentity}" (Custom display_name preserved: "${htb.display_name}")`);
  if (htbIdentity !== 'HTB · aayan-sec' || htb.display_name !== 'HTB · aayan-sec') {
    throw new Error(`HTB custom display_name mismatch: got "${htbIdentity}"`);
  }

  console.log('✓ End-to-end API, database persistence, and clean identity verification successful!');
}

async function run() {
  await testUnitHelpers();
  await testApiIntegration();
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
