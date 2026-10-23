// Regression and Integration Test Suite: Skills CMS
// Verifies authorization, full CRUD, item management, reordering, and safety.

const baseUrl = 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('   AAYAN.SEC — SKILLS ADMIN CMS REGRESSION & SECURITY TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      if (details) console.error(`       Details: ${details}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. UNHEALTHY / UNAUTHORIZED MUTATION PROTECTION
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing Unauthenticated Protection ---');

  const getUnauth = await fetch(`${baseUrl}/api/admin/skills`);
  assert(getUnauth.status === 401, 'GET /api/admin/skills requires authentication (HTTP 401)');

  const postUnauth = await fetch(`${baseUrl}/api/admin/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_num: '99', category_title: 'TEST' }),
  });
  assert(postUnauth.status === 401, 'POST /api/admin/skills requires authentication (HTTP 401)');

  const putUnauth = await fetch(`${baseUrl}/api/admin/skills`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'dummy-id', category_title: 'TEST' }),
  });
  assert(putUnauth.status === 401, 'PUT /api/admin/skills requires authentication (HTTP 401)');

  const deleteUnauth = await fetch(`${baseUrl}/api/admin/skills?id=dummy-id`, {
    method: 'DELETE',
  });
  assert(deleteUnauth.status === 401, 'DELETE /api/admin/skills requires authentication (HTTP 401)');

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATION (ADMIN LOGIN)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Admin Authentication ---');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.ADMIN_USERNAME || 'Kingsman', password: process.env.ADMIN_PASSWORD || 'Kingsman' }),
  });
  assert(loginRes.status === 200, 'Admin login succeeded (HTTP 200)');
  const cookie = loginRes.headers.get('set-cookie');
  assert(!!cookie, 'Session cookie obtained from server');

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: cookie,
  };

  // ---------------------------------------------------------------------------
  // 3. GET EXISTING SKILLS LIST
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Fetching Initial Skills State ---');
  const initialGetRes = await fetch(`${baseUrl}/api/admin/skills`, {
    headers: { Cookie: cookie },
  });
  const initialGetData = await initialGetRes.json();
  assert(initialGetData.success === true, 'Authenticated GET /api/admin/skills succeeded');
  const initialCount = initialGetData.skills.length;
  console.log(`       Existing domains: ${initialCount}`);

  // Clean up any lingering test domain from previous runs
  const lingeringTest = initialGetData.skills.find(
    (s) => s.category_num === '99' || s.category_title === 'EMBEDDED & HARDWARE SECURITY'
  );
  if (lingeringTest) {
    console.log(`       Cleaning up previous test domain ID: ${lingeringTest.id}...`);
    await fetch(`${baseUrl}/api/admin/skills?id=${lingeringTest.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
  }

  // ---------------------------------------------------------------------------
  // 4. CREATE A NEW DOMAIN (POST)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Creating New Domain (POST) ---');
  const createPayload = {
    category_num: '99',
    category_title: 'EMBEDDED & HARDWARE SECURITY',
    description: 'Hardware tampering, JTAG debugging, and firmware reverse engineering.',
    skills: ['UART Extraction', 'SPI Flash Dumping', 'JTAG Boundary Scan'],
    tools: ['Bus Pirate', 'Logic Analyzer', 'JTAGulator'],
    display_order: 99,
    status: 'draft',
  };

  const createRes = await fetch(`${baseUrl}/api/admin/skills`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(createPayload),
  });
  const createData = await createRes.json();
  assert(createRes.status === 200 && createData.success === true, 'POST /api/admin/skills created domain');
  assert(!!createData.category && !!createData.category.id, 'Returned created domain with database UUID');
  const createdId = createData.category?.id;

  // ---------------------------------------------------------------------------
  // 5. EDIT DOMAIN, COMPETENCIES & CUSTOM TOOLS (PUT)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Updating Domain, Competencies & Custom Tools (PUT) ---');
  // Add tools including Burp Suite Professional, Nuclei, Ghidra as requested
  const updatePayload = {
    id: createdId,
    category_num: '99',
    category_title: 'HARDWARE & RF EXPLOITATION',
    description: 'Updated scope: Firmware extraction, SDR, and protocol reversing.',
    skills: ['UART Extraction', 'SPI Flash Dumping', 'Side-Channel Power Analysis'],
    tools: ['Burp Suite Professional', 'Nuclei', 'Ghidra', 'HackRF One', 'Bus Pirate'],
    status: 'published',
  };

  const updateRes = await fetch(`${baseUrl}/api/admin/skills`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(updatePayload),
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200 && updateData.success === true, 'PUT /api/admin/skills updated domain & items');

  const updatedRecord = updateData.skills.find((s) => s.id === createdId);
  assert(
    updatedRecord?.category_title === 'HARDWARE & RF EXPLOITATION',
    'Domain title updated correctly'
  );
  assert(
    updatedRecord?.tools.includes('Burp Suite Professional') &&
      updatedRecord?.tools.includes('Nuclei') &&
      updatedRecord?.tools.includes('Ghidra'),
    'Custom tools (Burp Suite Professional, Nuclei, Ghidra) persisted in tool array'
  );
  assert(
    updatedRecord?.skills.length === 3 && updatedRecord?.tools.length === 5,
    `Exact item counts verified: ${updatedRecord?.skills.length} skills, ${updatedRecord?.tools.length} tools`
  );

  // ---------------------------------------------------------------------------
  // 6. DOMAIN BATCH REORDER (PUT)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Reordering Domains (PUT batch reorder) ---');
  const reorderPayload = {
    reorder: [{ id: createdId, display_order: 10 }],
  };
  const reorderRes = await fetch(`${baseUrl}/api/admin/skills`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(reorderPayload),
  });
  const reorderData = await reorderRes.json();
  assert(reorderRes.status === 200 && reorderData.success === true, 'Batch reorder updated display_order');

  // ---------------------------------------------------------------------------
  // 7. INPUT VALIDATION & ERROR HANDLING
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Server-Side Input Validation ---');
  const badCreate = await fetch(`${baseUrl}/api/admin/skills`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ category_num: '', category_title: '' }),
  });
  assert(badCreate.status === 400, 'POST rejects empty required fields with HTTP 400');

  const badPut = await fetch(`${baseUrl}/api/admin/skills`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ id: createdId, status: 'invalid_status_xyz' }),
  });
  assert(badPut.status === 400, 'PUT rejects invalid status with HTTP 400');

  const badDelete = await fetch(`${baseUrl}/api/admin/skills`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert(badDelete.status === 400, 'DELETE rejects request without ID parameter with HTTP 400');

  // ---------------------------------------------------------------------------
  // 8. DELETE THE TEST DOMAIN (DELETE)
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Deleting Test Domain (DELETE) ---');
  const deleteRes = await fetch(`${baseUrl}/api/admin/skills?id=${createdId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  const deleteData = await deleteRes.json();
  assert(deleteRes.status === 200 && deleteData.success === true, 'DELETE /api/admin/skills deleted domain');

  const verifyCheck = deleteData.skills.find((s) => s.id === createdId);
  assert(!verifyCheck, 'Verified test domain is completely removed from database list');

  // ---------------------------------------------------------------------------
  // 9. PUBLIC /api/settings AND CONSTELLATION COMPATIBILITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Public API Compatibility Verification ---');
  const publicRes = await fetch(`${baseUrl}/api/settings`);
  const publicData = await publicRes.json();
  assert(publicRes.status === 200 && publicData.success === true, 'Public /api/settings returns HTTP 200');
  assert(Array.isArray(publicData.skills), 'Public skills is an array compatible with constellation');
  for (const domain of publicData.skills) {
    assert(
      domain.category_num && domain.category_title && Array.isArray(domain.skills) && Array.isArray(domain.tools),
      `Domain ${domain.category_num} has all required fields (num, title, skills[], tools[])`
    );
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
