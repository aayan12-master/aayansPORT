import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const screenshotDir = path.resolve('public/assets/fullscreen_tip_verification');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runVerification() {
  console.log('=== STARTING COMPREHENSIVE SMART F11 TIP VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  const passes = [];
  const errors = [];

  const logPass = (desc) => {
    console.log(`[PASS] ${desc}`);
    passes.push(desc);
  };

  const logFail = (desc, detail) => {
    console.error(`[FAIL] ${desc}: ${detail}`);
    errors.push(`${desc}: ${detail}`);
  };

  // ---------------------------------------------------------------------------
  // TEST CASE 1: First eligible visit in a new session
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST CASE 1: First eligible visit in new session ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Ensure fresh session
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  // Right after load (1s), notification should NOT be visible
  await new Promise((r) => setTimeout(r, 1000));
  const immediateState = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    return !el || window.getComputedStyle(el).opacity === '0';
  });

  if (immediateState) {
    logPass('Initial load (1s): Notification is NOT visible yet (respects polite delay)');
  } else {
    logFail('Notification appeared too early without delay', 'Found visible at 1s');
  }

  // After 4s (past 3.8s delay), notification appears
  await page.waitForSelector('#fullscreen-experience-tip', { timeout: 8000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 450)); // Allow 300ms CSS fade-in to complete
  const tipAppeared = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const text = el.textContent || '';
    const sessionVal = sessionStorage.getItem('aayan_f11_tip_session_handled');
    return {
      opacity: style.opacity,
      display: style.display,
      height: rect.height,
      width: rect.width,
      bottom: window.innerHeight - rect.bottom,
      containsHeader: text.includes('// EXPERIENCE TIP'),
      containsTitle: text.includes('Get the full dossier experience.'),
      containsKbd: text.includes('F11'),
      sessionMarkedHandled: sessionVal === 'true',
    };
  });

  if (tipAppeared && tipAppeared.opacity === '1') {
    logPass(`Eligible first visit: Notification appears smoothly (w: ${Math.round(tipAppeared.width)}px, h: ${Math.round(tipAppeared.height)}px, bottom: ${Math.round(tipAppeared.bottom)}px)`);
  } else {
    logFail('Notification did not appear after delay', JSON.stringify(tipAppeared));
  }

  if (tipAppeared && tipAppeared.containsHeader && tipAppeared.containsTitle && tipAppeared.containsKbd) {
    logPass('Content verified: contains "// EXPERIENCE TIP", "Get the full dossier experience.", and "F11"');
  } else {
    logFail('Notification content mismatch', JSON.stringify(tipAppeared));
  }

  if (tipAppeared && tipAppeared.sessionMarkedHandled) {
    logPass('Session marked immediately as handled: prevents any repeat displays even if unclicked');
  } else {
    logFail('sessionStorage not marked upon display', JSON.stringify(tipAppeared));
  }

  const firstVisitScreenshot = path.join(screenshotDir, 'case1_first_visit_desktop.png');
  await page.screenshot({ path: firstVisitScreenshot });

  // ---------------------------------------------------------------------------
  // TEST CASE 2: Dismissal via close button
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST CASE 2: Dismissal via close button ---');
  await page.click('#fullscreen-tip-dismiss-btn');
  await new Promise((r) => setTimeout(r, 400));

  const dismissedState = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    return !el || window.getComputedStyle(el).opacity === '0';
  });

  if (dismissedState) {
    logPass('Clicking close button (×) successfully dismisses the notification');
  } else {
    logFail('Notification still visible after dismiss click', 'element still visible');
  }

  // ---------------------------------------------------------------------------
  // TEST CASE 3: Notification already shown / dismissed does NOT show again
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST CASE 3: Does not reappear during current session ---');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 4500));

  const afterReloadState = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    return !el || window.getComputedStyle(el).display === 'none';
  });

  if (afterReloadState) {
    logPass('Page reload in same session: Notification DOES NOT reappear');
  } else {
    logFail('Notification reappeared on reload in same session', 'element visible');
  }

  // ---------------------------------------------------------------------------
  // TEST CASE 4: Navigation between sections does NOT trigger notification
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST CASE 4: Section navigation does not trigger notification ---');
  const sections = ['background', 'research', 'tools', 'skills', 'collaborate', 'overview'];
  for (const s of sections) {
    await page.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
    }, s);
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 2000));

  const navSectionCheck = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    return !el || window.getComputedStyle(el).display === 'none';
  });

  if (navSectionCheck) {
    logPass('Navigating across all 6 sections: Notification stays completely hidden');
  } else {
    logFail('Notification reappeared during section navigation', 'element visible');
  }

  // ---------------------------------------------------------------------------
  // TEST CASE 5: Full-screen mode is already active (notification stays hidden)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST CASE 5: Full-screen mode already active ---');
  await page.evaluate(() => {
    sessionStorage.clear();
    // Simulate fullscreenElement by adding dummy element
    Object.defineProperty(document, 'fullscreenElement', {
      value: document.body,
      configurable: true,
    });
  });
  await page.reload({ waitUntil: 'networkidle0' });
  // Mock fullscreenElement again after reload
  await page.evaluate(() => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: document.body,
      configurable: true,
    });
  });
  await new Promise((r) => setTimeout(r, 4500));

  const fullscreenActiveCheck = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    return !el || window.getComputedStyle(el).display === 'none';
  });

  if (fullscreenActiveCheck) {
    logPass('Browser full-screen mode active: Notification stays hidden');
  } else {
    logFail('Notification appeared despite active full-screen', 'element visible');
  }

  // ---------------------------------------------------------------------------
  // TEST CASE 6: User enters full-screen while notification is visible
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST CASE 6: Enters full-screen while notification visible ---');
  // Reset session and reload without mock
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  // Wait for notification to appear
  await new Promise((r) => setTimeout(r, 4500));

  const tipVisibleBeforeFS = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    return el && window.getComputedStyle(el).opacity === '1';
  });

  if (tipVisibleBeforeFS) {
    logPass('Notification is visible before entering full-screen');
    // Dispatch fullscreenchange event simulating visitor pressing F11 or browser entering FS
    await page.evaluate(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.body,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    await new Promise((r) => setTimeout(r, 400));

    const tipAfterFS = await page.evaluate(() => {
      const el = document.getElementById('fullscreen-experience-tip');
      return !el || window.getComputedStyle(el).opacity === '0';
    });

    if (tipAfterFS) {
      logPass('Entering full-screen mode immediately dismisses the notification');
    } else {
      logFail('Notification did not dismiss upon entering full-screen', 'still visible');
    }
  } else {
    logFail('Notification was not visible before full-screen trigger', 'check timing');
  }

  // ---------------------------------------------------------------------------
  // TEST CASE 7: Mobile & Tablet viewports (notification stays hidden)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST CASE 7: Mobile & Tablet viewports ---');
  // Mobile 375x812
  await page.evaluate(() => sessionStorage.clear());
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 4500));

  const mobileHidden = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    return !el || window.getComputedStyle(el).display === 'none';
  });

  if (mobileHidden) {
    logPass('Mobile viewport (375px): Notification stays hidden');
  } else {
    logFail('Notification appeared on mobile device', 'element visible');
  }

  // Tablet 768x1024
  await page.setViewport({ width: 768, height: 1024 });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 4500));

  const tabletHidden = await page.evaluate(() => {
    const el = document.getElementById('fullscreen-experience-tip');
    return !el || window.getComputedStyle(el).display === 'none';
  });

  if (tabletHidden) {
    logPass('Tablet viewport (768px): Notification stays hidden');
  } else {
    logFail('Notification appeared on tablet', 'element visible');
  }

  // ---------------------------------------------------------------------------
  // TEST CASE 8: Existing navigation and layout unchanged
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST CASE 8: Existing navigation and layout integrity ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  const layoutCheck = await page.evaluate(() => {
    const terminalEl = document.querySelector('[aria-label*="terminal" i]');
    const navItems = Array.from(document.querySelectorAll('aside button')).map((b) => b.textContent?.trim());
    const collabHeading = document.querySelector('#collaborate h2, #collaborate h3')?.textContent;
    return {
      terminalAbsent: !terminalEl,
      navItemsCount: navItems.length,
      collabPresent: !!collabHeading,
    };
  });

  if (layoutCheck.terminalAbsent) {
    logPass('Terminal remains completely absent from interface');
  } else {
    logFail('Terminal found in DOM', 'terminal should be absent');
  }

  if (layoutCheck.navItemsCount >= 6) {
    logPass(`All 6 numbered navigation rail items intact (${layoutCheck.navItemsCount} buttons)`);
  } else {
    logFail('Navigation rail buttons missing', JSON.stringify(layoutCheck));
  }

  await browser.close();

  console.log('\n===========================================');
  console.log(`TOTAL PASSES: ${passes.length}`);
  console.log(`TOTAL FAILURES: ${errors.length}`);
  console.log('===========================================');

  if (errors.length > 0) {
    console.error('\nFailures summary:');
    errors.forEach((e) => console.error(` - ${e}`));
    process.exit(1);
  } else {
    console.log('\nALL 9 SMART F11 NOTIFICATION CASES VERIFIED SUCCESSFULLY!');
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
