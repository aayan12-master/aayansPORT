// Comprehensive test suite for Medium Research Importer
let BASE_URL = 'http://localhost:3000';
try {
  const check = await fetch('http://localhost:3000/api/research');
  if (!check.ok) BASE_URL = 'http://localhost:3001';
} catch {
  BASE_URL = 'http://localhost:3001';
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING E2E TEST SUITE: MEDIUM RESEARCH IMPORTER');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Unauthorized Access Test
  console.log('--- TEST 1: Unauthorized Access Protection ---');
  const unauthRes = await fetch(`${BASE_URL}/api/admin/research/import-medium`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://medium.com/@test/sample-article' }),
  });
  assert(unauthRes.status === 401, 'Unauthenticated import request rejected with HTTP 401');

  // Login as Admin
  console.log('\n--- AUTHENTICATING ADMIN SESSION ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'aayan_sec_2025' }),
  });
  const rawCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')];
  const cookieHeader = rawCookies.map(c => (c || '').split(';')[0]).join('; ');
  assert(loginRes.ok && cookieHeader, 'Admin login succeeded and session cookie issued');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader || '',
  };

  // 2. SSRF Protection Tests
  console.log('\n--- TEST 2: SSRF & Host Validation ---');
  const ssrfCases = [
    { url: 'http://localhost:3000/api/admin', desc: 'Localhost URL' },
    { url: 'http://127.0.0.1:8080/secret', desc: 'Loopback IP' },
    { url: 'http://169.254.169.254/latest/meta-data', desc: 'Cloud metadata IP' },
    { url: 'http://10.0.0.1/admin', desc: 'Private 10.x.x.x network' },
    { url: 'http://192.168.1.1/router', desc: 'Private 192.168.x.x network' },
    { url: 'ftp://medium.com/file', desc: 'Non-HTTP(S) protocol' },
    { url: 'https://google.com/search', desc: 'Non-Medium external domain' },
  ];

  for (const tc of ssrfCases) {
    const res = await fetch(`${BASE_URL}/api/admin/research/import-medium`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ url: tc.url }),
    });
    const data = await res.json();
    assert(!res.ok || !data.success, `Blocked unsafe/disallowed target (${tc.desc}): ${data.error || res.status}`);
  }

  // 3. Inaccessible / 404 Article Test
  console.log('\n--- TEST 3: Inaccessible / 404 Article Handling ---');
  const missingRes = await fetch(`${BASE_URL}/api/admin/research/import-medium`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ url: 'https://medium.com/@nonexistentuser99999999/invalid-article-id-999999999' }),
  });
  const missingData = await missingRes.json();
  assert(!missingData.success, `Gracefully handled non-existent Medium article: "${missingData.error}"`);

  // 4. Valid Medium Article with Featured Image & Real Content
  console.log('\n--- TEST 4: Live Medium Article Ingestion ---');
  const testUrl = 'https://medium.com/@techprescient/your-ai-agent-blueprint-for-a-trusted-agentic-enterprise-49d8b91b7b92';
  const validRes = await fetch(`${BASE_URL}/api/admin/research/import-medium`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ url: testUrl }),
  });
  const validData = await validRes.json();
  assert(validRes.ok && validData.success, 'Successfully fetched live Medium article');
  assert(validData.data?.title?.length > 10, `Extracted Title: "${validData.data?.title}"`);
  assert(validData.data?.image_url?.includes('http'), `Extracted Featured Image: "${validData.data?.image_url}"`);
  assert(validData.data?.content?.length > 500, `Extracted Content Markdown (${validData.data?.content?.length} characters)`);
  assert(validData.data?.author?.length > 0, `Extracted Author: "${validData.data?.author}"`);
  assert(validData.data?.external_url?.includes('medium.com'), `Normalized External URL: "${validData.data?.external_url}"`);
  assert(validData.data?.is_duplicate === false, 'Correctly detected as non-duplicate initially');

  // 5. Save as Draft Verification
  console.log('\n--- TEST 5: Save as Draft (Hidden from Public) ---');
  const draftPayload = {
    ...validData.data,
    title: '[DRAFT TEST] ' + validData.data.title,
    slug: 'draft-test-' + Date.now(),
    status: 'draft',
  };

  const draftRes = await fetch(`${BASE_URL}/api/admin/research`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(draftPayload),
  });
  const draftResult = await draftRes.json();
  assert(draftRes.ok && draftResult.success, 'Successfully saved imported research as DRAFT');

  // Verify Draft does NOT appear in public API
  const publicRes1 = await fetch(`${BASE_URL}/api/research`);
  const publicData1 = await publicRes1.json();
  const foundInPublicDraft = publicData1.research.some(r => r.slug === draftPayload.slug);
  assert(!foundInPublicDraft, 'Draft advisory is strictly HIDDEN from public research API');

  // Verify Draft DOES appear in admin API
  const adminRes1 = await fetch(`${BASE_URL}/api/admin/research`, { headers: authHeaders });
  const adminData1 = await adminRes1.json();
  const foundInAdminDraft = adminData1.research.find(r => r.slug === draftPayload.slug);
  assert(foundInAdminDraft && foundInAdminDraft.status === 'draft', 'Draft advisory is listed in admin Research section');

  // 6. Duplicate Detection Test
  console.log('\n--- TEST 6: Duplicate Article URL Detection ---');
  const dupRes = await fetch(`${BASE_URL}/api/admin/research/import-medium`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ url: testUrl }),
  });
  const dupData = await dupRes.json();
  assert(dupData.success && dupData.data?.is_duplicate === true, 'Importer detected duplicate Medium external_url');
  assert(dupData.data?.duplicate_title?.includes('DRAFT TEST'), `Identified duplicate title: "${dupData.data?.duplicate_title}"`);

  // 7. Publish Advisory & Public Rendering Check
  console.log('\n--- TEST 7: Publish Advisory & Public Rendering Verification ---');
  const pubPayload = {
    ...validData.data,
    id: foundInAdminDraft.id,
    title: '[PUBLISHED TEST] ' + validData.data.title,
    slug: 'pub-test-' + Date.now(),
    status: 'published',
  };

  const pubRes = await fetch(`${BASE_URL}/api/admin/research`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(pubPayload),
  });
  const pubResult = await pubRes.json();
  console.log('PUT /api/admin/research response:', pubRes.status, pubResult);
  assert(pubRes.ok && pubResult.success, 'Successfully updated advisory status to PUBLISHED');

  // Verify it NOW appears in public API with all fields
  const publicRes2 = await fetch(`${BASE_URL}/api/research`);
  const publicData2 = await publicRes2.json();
  const publishedInPublic = publicData2.research.find(r => r.slug === pubPayload.slug);
  assert(publishedInPublic !== undefined, 'Published advisory NOW appears in public research API');
  assert(publishedInPublic?.image_url === validData.data.image_url, 'Published public card contains imported image_url');
  assert(publishedInPublic?.external_url === validData.data.external_url, 'Published public advisory contains Medium external_url link');
  assert(publishedInPublic?.summary?.length > 10, 'Published public advisory contains summary excerpt');

  // 8. Article with Missing Metadata Fallback Test
  console.log('\n--- TEST 8: Missing Metadata Graceful Fallback ---');
  const minimalPayload = {
    title: 'Advisory With Minimal Metadata',
    slug: 'minimal-meta-' + Date.now(),
    summary: 'Testing fallback handling when optional metadata fields are missing.',
    content: '## Technical Breakdown\n\nContent provided with no CVE or tags.',
    status: 'published',
  };
  const minRes = await fetch(`${BASE_URL}/api/admin/research`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(minimalPayload),
  });
  const minData = await minRes.json();
  assert(minRes.ok && minData.success, 'Advisory with missing optional metadata accepted and defaulted safely');

  // Clean up test entries
  console.log('\n--- CLEANING UP TEST ARTIFACTS ---');
  if (foundInAdminDraft?.id) {
    await fetch(`${BASE_URL}/api/admin/research?id=${foundInAdminDraft.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`Cleaned up test advisory ID ${foundInAdminDraft.id}`);
  }
  if (minData.post?.id) {
    await fetch(`${BASE_URL}/api/admin/research?id=${minData.post.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`Cleaned up minimal test advisory ID ${minData.post.id}`);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite crashed with unhandled error:', err);
  process.exit(1);
});
