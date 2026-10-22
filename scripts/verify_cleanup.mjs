import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testSecurityEndpoints() {
  console.log('\n--- 1. Testing Server-side Security & Authorization ---');
  
  // A. Unauthenticated /api/auth/me
  const meRes = await fetch('http://localhost:3000/api/auth/me');
  console.log('GET /api/auth/me (unauthenticated): Status =', meRes.status);
  const meData = await meRes.json();
  console.log('GET /api/auth/me payload:', meData);

  // B. Unauthenticated /api/admin/submissions
  const subRes = await fetch('http://localhost:3000/api/admin/submissions');
  console.log('GET /api/admin/submissions (unauthenticated): Status =', subRes.status);
  const subData = await subRes.json();
  console.log('GET /api/admin/submissions payload:', subData);

  // C. Unauthenticated POST to /api/admin/research
  const postResearchRes = await fetch('http://localhost:3000/api/admin/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test Exploit' })
  });
  console.log('POST /api/admin/research (unauthenticated): Status =', postResearchRes.status);
  const postResearchData = await postResearchRes.json();
  console.log('POST /api/admin/research payload:', postResearchData);

  // D. Attempt bad login
  const badLogin = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
  });
  console.log('POST /api/auth/login (bad password): Status =', badLogin.status);

  // E. Valid Admin Login
  const goodLogin = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'aayan_sec_2025' })
  });
  console.log('POST /api/auth/login (correct credentials): Status =', goodLogin.status);
  const cookieHeader = goodLogin.headers.get('set-cookie');
  console.log('Auth cookie received:', !!cookieHeader);

  // F. Authenticated request using cookie
  if (cookieHeader) {
    const authSubRes = await fetch('http://localhost:3000/api/admin/submissions', {
      headers: { 'Cookie': cookieHeader }
    });
    console.log('GET /api/admin/submissions (authenticated with session cookie): Status =', authSubRes.status);
    const authSubData = await authSubRes.json();
    console.log('Authorized submissions count:', authSubData.submissions?.length ?? 0);
  }
}

async function captureAndVerifyBrowser() {
  console.log('\n--- 2. Browser Verification & DOM Inspection ---');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--window-size=1536,1024'],
  });

  const page = await browser.newPage();

  // Desktop
  await page.setViewport({ width: 1536, height: 1024 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Check DOM for hero metadata
  const heroHtml = await page.$eval('#overview', el => el.innerHTML);
  const hasV1 = heroHtml.includes('v1.0');
  const hasDossier = heroHtml.includes('RESEARCH DOSSIER');
  const has2025 = heroHtml.includes('// 2025');
  console.log('Hero contains "v1.0":', hasV1);
  console.log('Hero contains "RESEARCH DOSSIER":', hasDossier);
  console.log('Hero contains "// 2025":', has2025);

  // Check DOM for footer admin link
  const footerHtml = await page.$eval('footer', el => el.innerHTML);
  const hasAdminLink = footerHtml.includes('/admin') || footerHtml.includes('RESTRICTED ADMIN');
  const hasAayanSec = footerHtml.includes('AAYAN.SEC');
  const hasFooterDossier = footerHtml.includes('SECURITY RESEARCH DOSSIER // 2025');
  const hasPrecision = footerHtml.includes('BUILT WITH PRECISION');
  console.log('Footer contains Admin link/text:', hasAdminLink);
  console.log('Footer preserves "AAYAN.SEC":', hasAayanSec);
  console.log('Footer preserves "SECURITY RESEARCH DOSSIER // 2025":', hasFooterDossier);
  console.log('Footer preserves "BUILT WITH PRECISION":', hasPrecision);

  // Screenshots
  const heroScreenshot = path.resolve('public/assets/viewport_hero_cleaned.png');
  await page.screenshot({ path: heroScreenshot, fullPage: false });
  console.log('Saved updated desktop hero screenshot:', heroScreenshot);

  // Scroll to footer & screenshot
  const footerEl = await page.$('footer');
  if (footerEl) {
    await page.evaluate(el => el.scrollIntoView(), footerEl);
    await new Promise(r => setTimeout(r, 400));
    const footerScreenshot = path.resolve('public/assets/viewport_footer_cleaned.png');
    await footerEl.screenshot({ path: footerScreenshot });
    console.log('Saved updated footer screenshot:', footerScreenshot);
  }

  // Check /admin page directly as unauthenticated visitor
  const adminPage = await browser.newPage();
  await adminPage.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  const adminHtml = await adminPage.content();
  const hasLoginForm = adminHtml.includes('RESTRICTED OPERATIVE CONSOLE') && adminHtml.includes('AAYAN.SEC ADMIN') && adminHtml.includes('type="password"');
  const exposesPrivateData = adminHtml.includes('TRANSMISSION INBOX') || adminHtml.includes('SECURITY ADVISORIES');
  console.log('/admin unauthenticated renders secure login form:', hasLoginForm);
  console.log('/admin unauthenticated exposes private admin tables:', exposesPrivateData);
  const adminScreenshot = path.resolve('public/assets/admin_login_verified.png');
  await adminPage.screenshot({ path: adminScreenshot, fullPage: false });
  console.log('Saved admin login screenshot:', adminScreenshot);

  // Mobile check
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const mobileScreenshot = path.resolve('public/assets/viewport_mobile_cleaned.png');
  await page.screenshot({ path: mobileScreenshot, fullPage: false });
  console.log('Saved updated mobile screenshot:', mobileScreenshot);

  // Tablet check
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const tabletScreenshot = path.resolve('public/assets/viewport_tablet_cleaned.png');
  await page.screenshot({ path: tabletScreenshot, fullPage: false });
  console.log('Saved updated tablet screenshot:', tabletScreenshot);

  await browser.close();
}

async function main() {
  await testSecurityEndpoints();
  await captureAndVerifyBrowser();
}

main().catch(console.error);
