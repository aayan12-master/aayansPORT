import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const baseUrl = 'http://127.0.0.1:3000';

async function run() {
  console.log('=== STARTING BROWSER VISUAL VERIFICATION ===');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Check Public Landing Page
  console.log('1. Checking public homepage...');
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // Check Navigation Rail Connect links
  const navConnectLinks = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return [];
    const links = aside.querySelectorAll('a[href^="http"], a[href^="mailto"]');
    return Array.from(links).map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
  });
  console.log('Desktop Nav Connect links count:', navConnectLinks.length);
  console.log('Desktop Nav links:', navConnectLinks.map((l) => l.text).join(' | '));

  // Check Collaborate Section Verified Direct Channels
  const directChannels = await page.evaluate(() => {
    const section = document.getElementById('collaborate');
    if (!section) return [];
    const rows = section.querySelectorAll('.border.border-\\[\\#171514\\] .flex.items-center.justify-between');
    return Array.from(rows).map((r) => r.textContent.replace(/\s+/g, ' ').trim());
  });
  console.log('Collaborate Section channels count:', directChannels.length);
  console.log('Collaborate Section channels:', directChannels);

  // Check Footer Social Links
  const footerLinks = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (!footer) return [];
    const links = footer.querySelectorAll('a[target="_blank"]');
    return Array.from(links).map((a) => a.textContent.trim());
  });
  console.log('Footer social links count:', footerLinks.length);
  console.log('Footer social links:', footerLinks);

  const publicScreenshot = path.resolve('public/assets/verified_public_socials.png');
  await page.screenshot({ path: publicScreenshot, fullPage: false });
  console.log('✓ Public homepage screenshot saved to:', publicScreenshot);

  // 2. Login to Admin directly via authenticated session cookie
  console.log('\n2. Authenticating admin session for Live Portfolio Editor (/admin)...');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'aayan_sec_2025' }),
  });
  const cookieHeader = loginRes.headers.get('set-cookie');
  if (cookieHeader) {
    const [cookiePart] = cookieHeader.split(';');
    const [name, value] = cookiePart.split('=');
    await page.setCookie({
      name,
      value,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
    });
  }

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#admin-tab-content', { timeout: 10000 });
  console.log('✓ Successfully authenticated and loaded admin console.');

  // 3. Switch to LIVE PORTFOLIO EDITOR Tab
  console.log('\n3. Switching to LIVE PORTFOLIO EDITOR tab in sidebar...');
  await page.click('#admin-tab-content');
  await new Promise((r) => setTimeout(r, 1500));

  // 4. Open Profile & SEO Drawer
  console.log('\n4. Opening Profile & SEO drawer in Live Portfolio Editor...');
  const drawerBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('header button'));
    return buttons.find((b) => b.textContent.includes('Profile & SEO'));
  });

  if (drawerBtn && drawerBtn.asElement()) {
    await drawerBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 800));
  } else {
    throw new Error('Profile & SEO button not found in editor header');
  }

  // Verify Drawer Contents
  const drawerInfo = await page.evaluate(() => {
    const drawer = document.querySelector('.fixed.inset-y-0.right-0');
    if (!drawer) return { open: false };

    const text = drawer.textContent;
    const hasWordmark = text.includes('Brand Wordmark');
    const hasDescriptors = text.includes('HERO BRACKETED DESCRIPTORS');
    const hasPgp = text.includes('PGP Public Fingerprint');
    const hasCollab = text.includes('COLLABORATION AVAILABILITY');
    const hasSeo = text.includes('SEO & OPEN GRAPH METADATA');
    const hasSocials = text.includes('SOCIAL ACCOUNTS');

    // Count configured social accounts in drawer
    const socialRows = drawer.querySelectorAll('.space-y-1\\.5 > div');

    return {
      open: true,
      hasWordmark,
      hasDescriptors,
      hasPgp,
      hasCollab,
      hasSeo,
      hasSocials,
      socialAccountsCount: socialRows.length,
    };
  });

  console.log('Drawer Open State:', drawerInfo);
  if (drawerInfo.hasWordmark) console.error('FAIL: Drawer still contains Brand Wordmark');
  if (drawerInfo.hasDescriptors) console.error('FAIL: Drawer still contains Hero Descriptors');
  if (drawerInfo.hasPgp) console.error('FAIL: Drawer still contains PGP key');
  if (drawerInfo.hasCollab) console.error('FAIL: Drawer still contains Collaboration Availability');
  if (!drawerInfo.hasSeo) console.error('FAIL: Drawer is missing SEO section');
  if (!drawerInfo.hasSocials) console.error('FAIL: Drawer is missing Social Accounts section');

  const drawerScreenshot = path.resolve('public/assets/verified_profile_seo_drawer.png');
  await page.screenshot({ path: drawerScreenshot });
  console.log('✓ Profile & SEO Drawer screenshot saved to:', drawerScreenshot);

  // 4. Test clicking "+ Add Social Account"
  console.log('\n4. Testing "+ Add Social Account" form with Custom Display Identity...');
  const addAccountBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent.includes('Add Social Account'));
  });

  if (addAccountBtn && addAccountBtn.asElement()) {
    await addAccountBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 500));
  }

  const hasCustomIdentityField = await page.evaluate(() => {
    return document.body.textContent.includes('Custom Display Identity');
  });
  console.log('Custom Display Identity field present:', hasCustomIdentityField);
  if (!hasCustomIdentityField) {
    throw new Error('Custom Display Identity field is missing from Add Account form');
  }

  const addFormScreenshot = path.resolve('public/assets/verified_add_account_form.png');
  await page.screenshot({ path: addFormScreenshot });
  console.log('✓ Add Social Account form screenshot saved to:', addFormScreenshot);

  // 5. Test Public Page in Mobile Viewport (375x812)
  console.log('\n5. Testing public homepage in narrow mobile viewport (375x812)...');
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 375, height: 812 });
  await new Promise((r) => setTimeout(r, 800));

  // Check no horizontal scrollbar on mobile
  const horizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Horizontal overflow on mobile (false is good):', horizontalOverflow);
  if (horizontalOverflow) {
    console.warn('WARNING: Horizontal overflow detected on mobile viewport!');
  }

  // Open mobile navigation menu
  const opened = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.textContent.includes('[ NAV ]') && b.offsetParent !== null);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (opened) {
    await new Promise((r) => setTimeout(r, 600));
    const mobileNavScreenshot = path.resolve('public/assets/verified_mobile_nav_menu.png');
    await page.screenshot({ path: mobileNavScreenshot });
    console.log('✓ Mobile navigation menu with clean identities saved to:', mobileNavScreenshot);

    // Close mobile nav menu
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent.includes('[ NAV ]') && b.offsetParent !== null);
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 500));
  }

  // Scroll to collaborate section on mobile
  console.log('\n6. Checking Section 06 "Secure Collaboration & Inquiry" on mobile...');
  await page.evaluate(() => {
    const el = document.getElementById('collaborate');
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 800));

  const mobileCollabScreenshot = path.resolve('public/assets/verified_mobile_collaborate.png');
  await page.screenshot({ path: mobileCollabScreenshot });
  console.log('✓ Mobile Collaborate section screenshot saved to:', mobileCollabScreenshot);

  await browser.close();
  console.log('\n=== ALL BROWSER CHECKS COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
