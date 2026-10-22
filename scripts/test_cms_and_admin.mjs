import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testApiEndpoints() {
  console.log('\n=== 1. API SECURITY & PERMISSION TESTS ===');

  // A. Unauthenticated admin protection
  const endpoints = [
    '/api/admin/overview',
    '/api/admin/projects',
    '/api/admin/research',
    '/api/admin/submissions',
    '/api/admin/hero',
    '/api/admin/about',
    '/api/admin/site-settings',
    '/api/admin/skills',
  ];

  for (const ep of endpoints) {
    const res = await fetch(`http://localhost:3000${ep}`);
    console.log(`GET ${ep} (unauthenticated): Status = ${res.status} [${res.status === 401 ? 'PASS: PROTECTED' : 'FAIL'}]`);
  }

  // B. Bad Login
  const badLogin = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'wrong_password_xyz' }),
  });
  console.log(`POST /api/auth/login (bad password): Status = ${badLogin.status} [${badLogin.status === 401 ? 'PASS' : 'FAIL'}]`);

  // C. Valid Login
  const goodLogin = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'aayan_sec_2025' }),
  });
  console.log(`POST /api/auth/login (valid credentials): Status = ${goodLogin.status} [${goodLogin.status === 200 ? 'PASS' : 'FAIL'}]`);
  const cookieHeader = goodLogin.headers.get('set-cookie');
  console.log(`Session cookie acquired: ${!!cookieHeader}`);

  // D. Authenticated API calls
  if (cookieHeader) {
    const statsRes = await fetch('http://localhost:3000/api/admin/overview', {
      headers: { Cookie: cookieHeader },
    });
    const statsData = await statsRes.json();
    console.log(`GET /api/admin/overview (authenticated): Status = ${statsRes.status}`);
    console.log('Real Database Metrics:', statsData.stats);
  }

  // E. Public Content Endpoints
  const pubProjects = await fetch('http://localhost:3000/api/projects').then((r) => r.json());
  console.log(`Public /api/projects count: ${pubProjects.projects?.length} published projects`);

  const pubResearch = await fetch('http://localhost:3000/api/research').then((r) => r.json());
  console.log(`Public /api/research count: ${pubResearch.research?.length} published advisories`);

  const pubSettings = await fetch('http://localhost:3000/api/settings').then((r) => r.json());
  console.log(`Public /api/settings: Success = ${pubSettings.success}, Brand = ${pubSettings.settings?.footer_brand}`);
}

async function captureBrowserScreenshots() {
  console.log('\n=== 2. BROWSER VISUAL VERIFICATION & SCREENSHOT CAPTURE ===');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // A. Public Homepage
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  const publicScreenshot = path.resolve('public/assets/viewport_public_cms.png');
  await page.screenshot({ path: publicScreenshot, fullPage: false });
  console.log('Saved public homepage screenshot:', publicScreenshot);

  // B. Unauthenticated /admin (Login Screen)
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  const loginScreenshot = path.resolve('public/assets/viewport_admin_login_cms.png');
  await page.screenshot({ path: loginScreenshot, fullPage: false });
  console.log('Saved admin login screenshot:', loginScreenshot);

  // C. Perform Login inside Browser
  await page.type('input[type="password"]', 'aayan_sec_2025');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));

  // D. Admin Dashboard Overview
  const dashboardScreenshot = path.resolve('public/assets/viewport_admin_dashboard_cms.png');
  await page.screenshot({ path: dashboardScreenshot, fullPage: false });
  console.log('Saved admin dashboard overview screenshot:', dashboardScreenshot);

  // E. Switch to Research Tab
  const buttons = await page.$$('nav button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text.includes('RESEARCH ADVISORIES')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  const researchScreenshot = path.resolve('public/assets/viewport_admin_research_cms.png');
  await page.screenshot({ path: researchScreenshot, fullPage: false });
  console.log('Saved admin research tab screenshot:', researchScreenshot);

  await browser.close();
  console.log('Visual verification complete.');
}

async function run() {
  await testApiEndpoints();
  await captureBrowserScreenshots();
}

run().catch(console.error);
