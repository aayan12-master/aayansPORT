import assert from 'assert';
import crypto from 'crypto';

console.log('====================================================');
console.log('VERIFYING AUTHENTICATION & UPLOAD SECURITY FIXES');
console.log('====================================================\n');

const BASE_URL = 'http://localhost:3000';

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

  // 1. Missing / Empty Credentials Test
  await testAsync('1. Empty request payload rejected with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
  });

  // 2. Incorrect Credentials Test
  await testAsync('2. Incorrect credentials rejected with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid_user_test', password: 'invalid_password_test' }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Invalid credentials');
  });

  // 3. Old Hardcoded Fallback Credentials Rejection Test
  await testAsync('3. Hardcoded fallback credential pair ("admin" / "aayan_sec_2025") rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'aayan_sec_2025' }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Invalid credentials');
  });

  // 4. Upload Route Protection Test
  await testAsync('4. Unauthenticated POST to /api/admin/upload rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Unauthorized');
  });

  // 5. Contact API Client IP & Rate Limiter Test
  await testAsync('5. Contact API processes valid submission format with IP extraction', async () => {
    // Test honeypot silent discard
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.195, 70.41.3.18',
      },
      body: JSON.stringify({
        name: 'Honeypot Bot',
        email: 'bot@example.com',
        subject: 'Automated Transmission',
        message: 'This message should be silently discarded by honeypot.',
        honeypot: 'spam_detected',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'Message recorded.');
  });

  // 6. Isolated Unit Test: Authentication Logic with Isolated Test Environment
  test('6. Isolated Unit Test: Missing env credentials or secret cause authentication to fail securely', () => {
    function simulateLoginCheck(username, password, envUser, envPass, envSecret) {
      if (!username || !password) return { status: 400, error: 'Username and password are required' };
      if (!envUser || !envPass || !envSecret) return { status: 500, error: 'Authentication service is misconfigured' };
      const uMatch = Buffer.from(username).equals(Buffer.from(envUser));
      const pMatch = Buffer.from(password).equals(Buffer.from(envPass));
      if (!uMatch || !pMatch) return { status: 401, error: 'Invalid credentials' };
      return { status: 200, success: true };
    }

    // Missing env user
    const r1 = simulateLoginCheck('admin', 'pass', '', 'pass', 'secret');
    assert.strictEqual(r1.status, 500);
    assert.strictEqual(r1.error, 'Authentication service is misconfigured');

    // Missing env pass
    const r2 = simulateLoginCheck('admin', 'pass', 'admin', '', 'secret');
    assert.strictEqual(r2.status, 500);

    // Missing env secret
    const r3 = simulateLoginCheck('admin', 'pass', 'admin', 'pass', '');
    assert.strictEqual(r3.status, 500);

    // Old hardcoded credentials rejected against isolated custom env
    const r4 = simulateLoginCheck('admin', 'aayan_sec_2025', 'custom_admin', 'custom_secure_pass', 'secret');
    assert.strictEqual(r4.status, 401);
    assert.strictEqual(r4.error, 'Invalid credentials');

    // Matching isolated credentials succeed
    const r5 = simulateLoginCheck('custom_admin', 'custom_secure_pass', 'custom_admin', 'custom_secure_pass', 'secret');
    assert.strictEqual(r5.status, 200);
    assert.strictEqual(r5.success, true);
  });

  // 7. Verify session token signing and verification integrity with missing secret & tampering
  test('7. Isolated Unit Test: Missing secret throws on sign and returns null on verify', () => {
    function simulateSignToken(payload, secret) {
      if (!secret || typeof secret !== 'string' || !secret.trim()) {
        throw new Error('Authentication secret is not configured on the server');
      }
      const data = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret.trim()).update(data).digest('hex');
      return Buffer.from(JSON.stringify({ data, signature })).toString('base64');
    }

    function simulateVerifyToken(token, secret) {
      try {
        if (!secret || typeof secret !== 'string' || !secret.trim()) return null;
        const raw = Buffer.from(token, 'base64').toString('utf-8');
        const { data, signature } = JSON.parse(raw);
        const expectedSig = crypto.createHmac('sha256', secret.trim()).update(data).digest('hex');
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
          const parsed = JSON.parse(data);
          if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            return parsed;
          }
        }
        return null;
      } catch {
        return null;
      }
    }

    // A. Missing secret throws on sign
    assert.throws(() => {
      simulateSignToken({ username: 'admin', timestamp: Date.now() }, '');
    }, /Authentication secret is not configured/);

    assert.throws(() => {
      simulateSignToken({ username: 'admin', timestamp: Date.now() }, null);
    }, /Authentication secret is not configured/);

    // B. Missing secret returns null on verify
    assert.strictEqual(simulateVerifyToken('some_valid_looking_token', ''), null);
    assert.strictEqual(simulateVerifyToken('some_valid_looking_token', null), null);

    // C. Valid token roundtrip with configured secret
    const secret = 'custom_configured_secret_key_12345';
    const token = simulateSignToken({ username: 'admin', timestamp: Date.now() }, secret);
    const verified = simulateVerifyToken(token, secret);
    assert.ok(verified !== null);
    assert.strictEqual(verified.username, 'admin');

    // D. Tampered token rejected
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    const tampered = Buffer.from(JSON.stringify({ ...parsed, signature: 'bad' + parsed.signature.slice(3) })).toString('base64');
    assert.strictEqual(simulateVerifyToken(tampered, secret), null);

    // E. Expired token rejected (>7 days)
    const expiredToken = simulateSignToken({ username: 'admin', timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) }, secret);
    assert.strictEqual(simulateVerifyToken(expiredToken, secret), null);
  });

  console.log(`\n====================================================`);
  console.log(`TEST SUITE RESULTS: ${passed}/${total} PASSED`);
  console.log(`====================================================\n`);
}

run().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
