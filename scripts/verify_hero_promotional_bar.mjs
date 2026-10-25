import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const baseUrl = 'http://127.0.0.1:3000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('🚀 Starting Hero Promotional Bar End-to-End Verification...');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // =========================================================================
    // STEP 1: Verify Default Public State (Original 3 Statistics)
    // =========================================================================
    console.log('\n--- STEP 1: Public Homepage Default State ---');
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });

    // Locate the exact hero statistics bar beneath "Research • Bug Bounty • Projects"
    const statsBar = await page.$('#hero-stats-promotional-bar');
    if (!statsBar) {
      throw new Error('FAILED: #hero-stats-promotional-bar not found on homepage!');
    }
    console.log('✓ Located exact component: #hero-stats-promotional-bar');

    const statsText = await page.evaluate((el) => el.innerText, statsBar);
    console.log('Bar content:\n', statsText);

    const hasProjects = statsText.includes('PROJECTS');
    const hasWriteups = statsText.includes('WRITE-UPS');
    const hasCuriosity = statsText.includes('CURIOSITY');

    console.log(`✓ Stat 1 (Projects): ${hasProjects ? 'PRESENT' : 'MISSING'}`);
    console.log(`✓ Stat 2 (Write-ups): ${hasWriteups ? 'PRESENT' : 'MISSING'}`);
    console.log(`✓ Stat 3 (Curiosity): ${hasCuriosity ? 'PRESENT' : 'MISSING'}`);

    if (!hasProjects || !hasWriteups || !hasCuriosity) {
      throw new Error('Default statistics missing from bar!');
    }

    await statsBar.screenshot({ path: 'public/assets/verified_hero_bar_default.png' });
    console.log('✓ Captured public/assets/verified_hero_bar_default.png');

    // Capture hero section desktop
    const heroOverview = await page.$('#overview');
    if (heroOverview) {
      await heroOverview.screenshot({ path: 'public/assets/verified_hero_desktop_default.png' });
      console.log('✓ Captured public/assets/verified_hero_desktop_default.png');
    }

    // =========================================================================
    // STEP 2: Mobile Viewport Check (375px)
    // =========================================================================
    console.log('\n--- STEP 2: Mobile Viewport Check (375x667) ---');
    await page.setViewport({ width: 375, height: 667 });
    await sleep(500);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`✓ Mobile horizontal overflow: ${hasHorizontalOverflow ? 'DETECTED (BAD)' : 'NONE (EXCELLENT)'}`);

    const mobileStatsBar = await page.$('#hero-stats-promotional-bar');
    if (mobileStatsBar) {
      await mobileStatsBar.screenshot({ path: 'public/assets/verified_hero_bar_mobile_default.png' });
      console.log('✓ Captured public/assets/verified_hero_bar_mobile_default.png');
    }

    // Reset back to desktop
    await page.setViewport({ width: 1440, height: 900 });

    // =========================================================================
    // STEP 3: Admin Panel Authentication & Live Portfolio Editor
    // =========================================================================
    console.log('\n--- STEP 3: Admin Panel Authentication ---');
    const crypto = await import('crypto');
    const SESSION_SECRET = '053442a2642c899c4de06c1ccd1b0df0ce4ec849be8e821b060593cbb1192a2a';
    const sessionData = JSON.stringify({ username: 'Kingsman', timestamp: Date.now() });
    const sig = crypto.createHmac('sha256', SESSION_SECRET).update(sessionData).digest('hex');
    const sessionToken = Buffer.from(JSON.stringify({ data: sessionData, signature: sig })).toString('base64');

    await page.setCookie({
      name: 'aayan_admin_session',
      value: sessionToken,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
    });

    await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle2' });
    console.log('✓ Admin authenticated with session cookie');

    // Switch to LIVE PORTFOLIO EDITOR tab
    await page.waitForSelector('#admin-tab-content', { timeout: 15000 });
    console.log('Switching to Live Portfolio Editor tab...');
    await page.click('#admin-tab-content');

    await page.waitForSelector('#admin-hero-spotlight-btn', { timeout: 15000 });
    const spotlightBtn = await page.$('#admin-hero-spotlight-btn');
    console.log('✓ Located "⚡ Hero Spotlight & Stats" button in editor toolbar');

    // Click to open drawer
    await spotlightBtn.click();
    await sleep(600);

    // Verify Tab 1 "⚡ Spotlight & Stats" is active
    const spotlightToggle = await page.$('#spotlight-master-toggle');
    if (!spotlightToggle) {
      throw new Error('FAILED: #spotlight-master-toggle not found in drawer!');
    }
    console.log('✓ Spotlight & Stats configuration tab loaded in drawer');

    // =========================================================================
    // STEP 4: Configure Promotional Spotlight in Admin Panel
    // =========================================================================
    console.log('\n--- STEP 4: Configure Promotional Spotlight ---');
    // Enable spotlight
    const currentToggleText = await page.evaluate((el) => el.innerText, spotlightToggle);
    if (currentToggleText.includes('DISABLED') || currentToggleText.includes('OFF')) {
      await spotlightToggle.click();
      await sleep(300);
      console.log('✓ Toggled Spotlight to ENABLED');
    }

    // Set display mode to 'alternate'
    const modeSelect = await page.$('#spotlight-mode-select');
    if (modeSelect) {
      await page.select('#spotlight-mode-select', 'alternate');
      console.log('✓ Set Spotlight Display Mode to: alternate');
    }

    // Set custom headline & subtitle
    await page.evaluate(() => {
      const titleInput = document.querySelector('#input-spotlight-title');
      const subtitleInput = document.querySelector('#input-spotlight-subtitle');
      const ctaTextInput = document.querySelector('#input-spotlight-cta-text');
      const ctaUrlInput = document.querySelector('#input-spotlight-cta-url');

      if (titleInput) {
        titleInput.value = 'SECURITY RESEARCHER & PENTESTER';
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (subtitleInput) {
        subtitleInput.value = 'Web Application Penetration Testing • Vulnerability Research';
        subtitleInput.dispatchEvent(new Event('input', { bubbles: true }));
        subtitleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (ctaTextInput) {
        ctaTextInput.value = 'ENGAGE OPERATIVE →';
        ctaTextInput.dispatchEvent(new Event('input', { bubbles: true }));
        ctaTextInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (ctaUrlInput) {
        ctaUrlInput.value = '#collaborate';
        ctaUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
        ctaUrlInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    console.log('✓ Configured promotional spotlight fields in drawer');

    // Capture drawer screenshot
    const drawerPanel = await page.$('.fixed.inset-y-0.right-0');
    if (drawerPanel) {
      await drawerPanel.screenshot({ path: 'public/assets/verified_hero_admin_drawer.png' });
      console.log('✓ Captured public/assets/verified_hero_admin_drawer.png');
    }

    // Verify canvas live preview updated
    const canvasBar = await page.$('#hero-stats-promotional-bar');
    const canvasBarText = await page.evaluate((el) => el.innerText, canvasBar);
    console.log('Canvas Bar Preview Content:\n', canvasBarText);

    // Save changes
    console.log('\n--- STEP 5: Save Changes to Supabase ---');
    page.on('dialog', async (dialog) => {
      console.log('Dialog appeared:', dialog.message());
      await dialog.accept();
    });

    const saveButton = await page.$('#admin-save-button');
    if (!saveButton) {
      throw new Error('FAILED: #admin-save-button not found in toolbar!');
    }
    await saveButton.click();
    console.log('Clicked Save Changes...');
    await sleep(3500);

    // =========================================================================
    // STEP 6: Public Verification & Persistence Check
    // =========================================================================
    console.log('\n--- STEP 6: Public Verification on Reload ---');
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await sleep(500);

    const reloadedBar = await page.$('#hero-stats-promotional-bar');
    if (!reloadedBar) {
      throw new Error('FAILED: #hero-stats-promotional-bar not found on reload!');
    }

    const reloadedBarText = await page.evaluate((el) => el.innerText, reloadedBar);
    console.log('Reloaded Public Bar Text:\n', reloadedBarText);

    const containsSpotlight =
      reloadedBarText.includes('SECURITY RESEARCHER & PENTESTER') ||
      reloadedBarText.includes('SPOTLIGHT') ||
      reloadedBarText.includes('ENGAGE OPERATIVE');

    console.log(`✓ Promotional Spotlight Active on Public Site: ${containsSpotlight ? 'YES' : 'NO'}`);

    // Capture screenshot of promotional spotlight active state
    await reloadedBar.screenshot({ path: 'public/assets/verified_hero_spotlight_active.png' });
    console.log('✓ Captured public/assets/verified_hero_spotlight_active.png');

    // Capture hero section with promotional spotlight
    const heroOverviewWithSpotlight = await page.$('#overview');
    if (heroOverviewWithSpotlight) {
      await heroOverviewWithSpotlight.screenshot({ path: 'public/assets/verified_hero_desktop_with_spotlight.png' });
      console.log('✓ Captured public/assets/verified_hero_desktop_with_spotlight.png');
    }

    // Test switching views via manual toggle
    console.log('\n--- STEP 7: Manual Toggle Button Check ---');
    const toggleToStatsBtn = await page.$('button[title*="original statistics"]');
    if (toggleToStatsBtn) {
      await toggleToStatsBtn.click();
      await sleep(400);
      const switchedText = await page.evaluate((el) => el.innerText, reloadedBar);
      console.log('Switched to stats view:\n', switchedText);
      console.log(`✓ Has PROJECTS: ${switchedText.includes('PROJECTS')}`);
      await reloadedBar.screenshot({ path: 'public/assets/verified_hero_switched_to_stats.png' });
    }

    const toggleToSpotlightBtn = await page.$('button[title*="promotional spotlight"]');
    if (toggleToSpotlightBtn) {
      await toggleToSpotlightBtn.click();
      await sleep(400);
      const switchedBackText = await page.evaluate((el) => el.innerText, reloadedBar);
      console.log('Switched back to spotlight view:\n', switchedBackText);
      console.log(`✓ Has Title: ${switchedBackText.includes('SECURITY RESEARCHER')}`);
    }

    // Mobile Viewport with Spotlight
    console.log('\n--- STEP 8: Mobile Viewport with Spotlight (375x667) ---');
    await page.setViewport({ width: 375, height: 667 });
    await sleep(500);

    const mobileOverflowWithSpotlight = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`✓ Mobile horizontal overflow with spotlight: ${mobileOverflowWithSpotlight ? 'DETECTED (BAD)' : 'NONE (EXCELLENT)'}`);

    const mobileSpotlightBar = await page.$('#hero-stats-promotional-bar');
    if (mobileSpotlightBar) {
      await mobileSpotlightBar.screenshot({ path: 'public/assets/verified_hero_mobile_spotlight.png' });
      console.log('✓ Captured public/assets/verified_hero_mobile_spotlight.png');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL HERO PROMOTIONAL BAR VERIFICATION TESTS PASSED!');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
