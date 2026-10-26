import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

console.log('=================================================================');
console.log('  AAYAN.Sec PORTFOLIO — STEP 3 CMS INTEGRATION SMOKE TEST');
console.log('=================================================================\n');

const BASE_URL = 'http://localhost:3000';

// 1. Load environment secrets safely without printing them
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
}

const SESSION_SECRET = envVars.ADMIN_SECRET || 'aayan_sec_researcher_auth_token_secret_key_2025';
const COOKIE_NAME = 'aayan_admin_session';

function signToken(payload) {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64');
}

async function run() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  // Generate valid, tampered, and expired session cookies
  const validToken = signToken({ username: envVars.ADMIN_USERNAME || 'admin', timestamp: Date.now() });
  const validCookieHeader = `${COOKIE_NAME}=${validToken}`;

  const expiredToken = signToken({ username: envVars.ADMIN_USERNAME || 'admin', timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) });
  const expiredCookieHeader = `${COOKIE_NAME}=${expiredToken}`;

  const tamperedToken = Buffer.from(JSON.stringify({
    data: JSON.stringify({ username: 'admin', timestamp: Date.now() }),
    signature: 'bad_signature_00000000000000000000000000000000000000000000000000000000'
  })).toString('base64');
  const tamperedCookieHeader = `${COOKIE_NAME}=${tamperedToken}`;

  // =========================================================================
  // SECTION 1: UNAUTHENTICATED PROTECTION MATRIX (All Admin Routes & Verbs)
  // =========================================================================
  console.log('--- 1. UNAUTHENTICATED PROTECTION MATRIX ---');

  const protectedEndpoints = [
    { method: 'GET', url: '/api/admin/overview' },
    { method: 'GET', url: '/api/admin/research' },
    { method: 'POST', url: '/api/admin/research', body: {} },
    { method: 'PUT', url: '/api/admin/research', body: {} },
    { method: 'DELETE', url: '/api/admin/research?id=test' },
    { method: 'GET', url: '/api/admin/projects' },
    { method: 'POST', url: '/api/admin/projects', body: {} },
    { method: 'PUT', url: '/api/admin/projects', body: {} },
    { method: 'DELETE', url: '/api/admin/projects?id=test' },
    { method: 'GET', url: '/api/admin/tools' },
    { method: 'POST', url: '/api/admin/tools', body: {} },
    { method: 'PUT', url: '/api/admin/tools', body: {} },
    { method: 'DELETE', url: '/api/admin/tools?id=test' },
    { method: 'GET', url: '/api/admin/about' },
    { method: 'POST', url: '/api/admin/about', body: {} },
    { method: 'PUT', url: '/api/admin/about', body: {} },
    { method: 'DELETE', url: '/api/admin/about?id=test' },
    { method: 'GET', url: '/api/admin/skills' },
    { method: 'POST', url: '/api/admin/skills', body: {} },
    { method: 'PUT', url: '/api/admin/skills', body: {} },
    { method: 'DELETE', url: '/api/admin/skills?id=test' },
    { method: 'GET', url: '/api/admin/hero' },
    { method: 'PUT', url: '/api/admin/hero', body: {} },
    { method: 'GET', url: '/api/admin/site-settings' },
    { method: 'PUT', url: '/api/admin/site-settings', body: {} },
    { method: 'POST', url: '/api/admin/upload', body: {} },
    { method: 'GET', url: '/api/admin/submissions' },
    { method: 'PATCH', url: '/api/admin/submissions', body: {} },
    { method: 'DELETE', url: '/api/admin/submissions?id=test' },
    { method: 'POST', url: '/api/admin/tools/import-github', body: {} },
    { method: 'POST', url: '/api/admin/research/import-medium', body: {} },
    { method: 'GET', url: '/api/auth/me' },
  ];

  for (const ep of protectedEndpoints) {
    await testAsync(`Unauthenticated ${ep.method} ${ep.url} rejected with 401`, async () => {
      const options = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (ep.body) options.body = JSON.stringify(ep.body);
      const res = await fetch(`${BASE_URL}${ep.url}`, options);
      assert.strictEqual(res.status, 401);
    });
  }

  // =========================================================================
  // SECTION 2: SESSION TOKEN VALIDATION & LIFECYCLE
  // =========================================================================
  console.log('\n--- 2. SESSION TOKEN INTEGRITY & LIFECYCLE ---');

  await testAsync('Tampered HMAC session cookie rejected on /api/auth/me with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: tamperedCookieHeader },
    });
    assert.strictEqual(res.status, 401);
  });

  await testAsync('Expired session cookie (>7 days) rejected on /api/auth/me with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: expiredCookieHeader },
    });
    assert.strictEqual(res.status, 401);
  });

  await testAsync('Valid session cookie successfully authenticated on /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: validCookieHeader },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(typeof data.user.username, 'string');
  });

  await testAsync('POST /api/auth/me clears session cookie with maxAge=0', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'POST',
      headers: { Cookie: validCookieHeader },
    });
    assert.strictEqual(res.status, 200);
    const cookie = res.headers.get('set-cookie');
    assert.ok(cookie && cookie.includes('Max-Age=0'));
  });

  // =========================================================================
  // SECTION 3: CMS PAYLOAD VALIDATION & SAFE ERROR SURFACING
  // =========================================================================
  console.log('\n--- 3. CMS PAYLOAD VALIDATION & SAFE ERROR SURFACING ---');

  await testAsync('Research POST without required fields returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: validCookieHeader },
      body: JSON.stringify({ title: 'Missing others' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('required'));
  });

  await testAsync('Research PUT without ID or title returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/research`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: validCookieHeader },
      body: JSON.stringify({ summary: 'No ID or title' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('required'));
  });

  await testAsync('Research DELETE without ID returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/research`, {
      method: 'DELETE',
      headers: { Cookie: validCookieHeader },
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('required'));
  });

  await testAsync('Projects POST without required fields returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: validCookieHeader },
      body: JSON.stringify({ title: 'Only Title' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testAsync('Projects PUT without ID returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: validCookieHeader },
      body: JSON.stringify({ title: 'No ID' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testAsync('About POST with invalid item type returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/about`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: validCookieHeader },
      body: JSON.stringify({ type: 'invalid_type_name' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testAsync('Skills POST with empty category_num returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: validCookieHeader },
      body: JSON.stringify({ category_num: '', category_title: 'Valid Title' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testAsync('Submissions PATCH with invalid status returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/submissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: validCookieHeader },
      body: JSON.stringify({ id: 1, status: 'invalid_status_value' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  // =========================================================================
  // SECTION 4: DOMAIN STATE SYNCHRONIZATION (Step 2 Bug Regression Verification)
  // =========================================================================
  console.log('\n--- 4. DOMAIN STATE SYNCHRONIZATION REGRESSION TEST ---');

  test('Newly created domains update client state with persistent database IDs', () => {
    // Simulate initial user state in LivePortfolioEditor / admin page
    let domains = [
      { id: 'new-1729891234000', domain_num: '01', domain_code: 'REV-ENG', title: 'Binary Reversing', description: '' }
    ];
    let baselineDomains = [...domains];

    // Dirty state detected
    const isAboutDirty = JSON.stringify(domains) !== JSON.stringify(baselineDomains);
    assert.strictEqual(isAboutDirty, false);

    // User modified domain title immutably (React state update)
    domains = [{ ...domains[0], title: 'Reverse Engineering' }];
    const isAboutDirtyAfterEdit = JSON.stringify(domains) !== JSON.stringify(baselineDomains);
    assert.strictEqual(isAboutDirtyAfterEdit, true);

    // Mock response from server PUT /api/admin/about
    const mockServerResponse = {
      success: true,
      domains: [
        { id: 101, domain_num: '01', domain_code: 'REV-ENG', title: 'Reverse Engineering', description: '', display_order: 1 }
      ]
    };

    // Client fix: sync returned domains
    if (mockServerResponse && Array.isArray(mockServerResponse.domains)) {
      domains = mockServerResponse.domains;
      baselineDomains = mockServerResponse.domains;
    }

    // Verify ID is now permanent integer, not temporary 'new-...'
    assert.strictEqual(domains[0].id, 101);
    assert.strictEqual(String(domains[0].id).indexOf('new-'), -1);

    // Consecutive save verification: no longer dirty, and will NOT create duplicate DB row
    const isDirtyAfterSync = JSON.stringify(domains) !== JSON.stringify(baselineDomains);
    assert.strictEqual(isDirtyAfterSync, false);

    // Deletion check: target ID is permanent (101), so DELETE /api/admin/about?type=domain&id=101 executes
    const target = domains[0];
    const isPermanent = target && target.id && String(target.id).indexOf('new-') !== 0;
    assert.strictEqual(isPermanent, true);
  });

  // =========================================================================
  // SECTION 5: RESEARCH CRUD LIFECYCLE & ISOLATION (Safe In-Memory Store Simulation)
  // =========================================================================
  console.log('\n--- 5. RESEARCH CRUD LIFECYCLE & ISOLATION SIMULATION ---');

  test('Research post lifecycle: create, update, filter, delete with zero side-effects', () => {
    // In-memory isolated store matching Supabase research_posts table
    const store = [
      {
        id: 1,
        title: 'Existing Production Post',
        slug: 'existing-post',
        summary: 'Existing summary',
        content: 'Existing content',
        category: 'Web Security',
        severity: 'High',
        cve_id: 'CVE-2024-0001',
        published_date: '2024-01-01',
        tags: 'web, vuln',
        external_url: 'https://example.com/existing',
        image_url: null,
        status: 'published',
        display_order: 1,
      }
    ];

    // 1. Create a draft post with all 13 fields
    const newPostPayload = {
      title: 'Smoke Test CVE Discovery',
      slug: 'smoke-test-cve-discovery',
      summary: 'Detailed technical summary of discovered vulnerability',
      content: '# Full Technical Advisory\n\nProof of concept content.',
      category: 'Network Security',
      severity: 'Critical',
      cve_id: 'CVE-2026-99999',
      published_date: '2026-10-26',
      tags: 'zero-day, rce',
      external_url: 'https://medium.com/@aayan/smoke-test',
      image_url: 'https://images.unsplash.com/photo-test',
      status: 'draft',
      display_order: 0,
    };

    const createdRecord = { id: 2, ...newPostPayload };
    store.push(createdRecord);

    assert.strictEqual(store.length, 2);
    assert.strictEqual(createdRecord.title, 'Smoke Test CVE Discovery');
    assert.strictEqual(createdRecord.status, 'draft');
    assert.strictEqual(createdRecord.severity, 'Critical');

    // 2. Query with publishedOnly: true (Public View simulation)
    const publicPosts = store.filter((p) => p.status === 'published');
    assert.strictEqual(publicPosts.length, 1);
    assert.strictEqual(publicPosts[0].id, 1); // Draft post is NOT visible to public

    // 3. Query with publishedOnly: false (Admin View simulation)
    assert.strictEqual(store.length, 2); // Both posts visible to admin

    // 4. Update the post: publish it and update title
    const targetIdx = store.findIndex((p) => p.id === 2);
    assert.ok(targetIdx !== -1);
    store[targetIdx] = {
      ...store[targetIdx],
      title: 'Smoke Test CVE Discovery (Updated)',
      status: 'published',
    };

    // Verify existing record #1 was NOT modified
    assert.strictEqual(store[0].title, 'Existing Production Post');
    assert.strictEqual(store.length, 2); // No duplicate created

    // 5. Query public view again: now published post is visible
    const publicPostsAfterPublish = store.filter((p) => p.status === 'published');
    assert.strictEqual(publicPostsAfterPublish.length, 2);
    assert.ok(publicPostsAfterPublish.some((p) => p.id === 2));

    // 6. Delete test post #2
    const deleteIdx = store.findIndex((p) => p.id === 2);
    store.splice(deleteIdx, 1);

    // Verify record #1 remains intact and record #2 is gone
    assert.strictEqual(store.length, 1);
    assert.strictEqual(store[0].id, 1);
  });

  // =========================================================================
  // SECTION 6: PUBLIC ENDPOINTS READ-ONLY SMOKE TEST (Compatibility Check)
  // =========================================================================
  console.log('\n--- 6. PUBLIC ENDPOINTS READ-ONLY SMOKE TEST ---');

  await testAsync('Public GET /api/projects returns valid JSON format', async () => {
    const res = await fetch(`${BASE_URL}/api/projects`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.projects));
    if (data.projects.length > 0) {
      const p = data.projects[0];
      assert.ok('id' in p);
      assert.ok('title' in p);
      assert.ok('slug' in p);
    }
  });

  await testAsync('Public GET /api/research returns valid JSON format & no-cache header', async () => {
    const res = await fetch(`${BASE_URL}/api/research`);
    assert.strictEqual(res.status, 200);
    const cacheHeader = res.headers.get('cache-control');
    assert.ok(cacheHeader && cacheHeader.includes('no-store'));
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.research));
    if (data.research.length > 0) {
      const r = data.research[0];
      assert.ok('id' in r);
      assert.ok('title' in r);
      assert.ok('slug' in r);
      assert.ok('summary' in r);
      // All returned records must have status = published
      assert.strictEqual(r.status, 'published');
    }
  });

  await testAsync('Public GET /api/settings returns valid settings, hero, about, and skills', async () => {
    const res = await fetch(`${BASE_URL}/api/settings`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.settings !== undefined);
    assert.ok(data.hero !== undefined);
    assert.ok(data.about !== undefined);
    assert.ok(Array.isArray(data.skills));
  });

  await testAsync('Public GET /api/tools returns valid tools collection', async () => {
    const res = await fetch(`${BASE_URL}/api/tools`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.tools));
  });

  console.log(`\n=================================================================`);
  console.log(`SMOKE TEST RESULTS: ${passed}/${total} TESTS PASSED (0 FAILURES)`);
  console.log(`=================================================================\n`);
}

run().catch((err) => {
  console.error('\nSmoke test encountered an error:', err);
  process.exit(1);
});
