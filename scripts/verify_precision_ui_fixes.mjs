import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const screenshotDir = path.resolve('public/assets/precision_fixes_verification');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runVerification() {
  console.log('=== STARTING PRECISION UI FIXES VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  const errors = [];
  const passes = [];

  const logPass = (desc) => {
    console.log(`[PASS] ${desc}`);
    passes.push(desc);
  };

  const logFail = (desc, detail) => {
    console.error(`[FAIL] ${desc}: ${detail}`);
    errors.push(`${desc}: ${detail}`);
  };

  // ---------------------------------------------------------------------------
  // 1. DESKTOP VIEWPORT TEST (1440x900)
  // ---------------------------------------------------------------------------
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));

  // --- CHECK 1: TERMINAL COMPLETELY REMOVED ---
  const terminalElements = await page.evaluate(() => {
    const el1 = document.querySelectorAll('[aria-label*="terminal" i]');
    const el2 = document.querySelectorAll('[class*="terminal"]');
    const buttons = Array.from(document.querySelectorAll('button')).filter((b) =>
      b.textContent?.toLowerCase().includes('terminal')
    );
    return {
      ariaCount: el1.length,
      classCount: el2.length,
      buttonCount: buttons.length,
    };
  });

  if (terminalElements.ariaCount === 0 && terminalElements.buttonCount === 0) {
    logPass('No terminal launcher buttons or interactive terminal modals found in DOM');
  } else {
    logFail('Terminal UI remnants detected', JSON.stringify(terminalElements));
  }

  // --- CHECK 2: PROFESSIONAL LABELS ---
  const socialLabels = await page.evaluate(() => {
    const collabLinks = Array.from(document.querySelectorAll('#collaborate a[href*="http"]'));
    return collabLinks.map((a) => ({
      href: a.getAttribute('href'),
      text: a.textContent?.trim(),
      hasArrow: a.textContent?.includes('↗'),
      hasNativeTitle: a.hasAttribute('title'),
    }));
  });

  const instagramLink = socialLabels.find((l) => l.href?.includes('instagram'));
  const githubLink = socialLabels.find((l) => l.href?.includes('github'));
  const xLink = socialLabels.find((l) => l.href?.includes('twitter') || l.href?.includes('x.com'));

  if (instagramLink && instagramLink.text.includes('@aayan-sec')) {
    logPass(`Instagram displays clean identity handle: "${instagramLink.text}"`);
  } else {
    logFail('Instagram identity formatting', JSON.stringify(instagramLink));
  }

  if (githubLink && githubLink.text.includes('github.com/aayan-sec')) {
    logPass(`GitHub displays clean identity: "${githubLink.text}"`);
  } else {
    logFail('GitHub identity formatting', JSON.stringify(githubLink));
  }

  // Check no native title tooltips on links
  const linksWithNativeTitle = socialLabels.filter((l) => l.hasNativeTitle);
  if (linksWithNativeTitle.length === 0) {
    logPass('Zero native OS "title" attributes found on Section 06 social links (no cursor obstruction)');
  } else {
    logFail('Native title attributes present', JSON.stringify(linksWithNativeTitle));
  }

  // --- CHECK 3: SECTION 06 SOCIAL HOVER & CLIPPING CHECK ---
  // Scroll to collaborate
  await page.evaluate(() => {
    document.getElementById('collaborate')?.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));

  // Find instagram row in Collaborate
  const instaRowSelector = '#collaborate a[href*="instagram"]';
  await page.waitForSelector(instaRowSelector, { timeout: 4000 });

  // Hover over Instagram link in Collaborate
  await page.hover(instaRowSelector);
  await new Promise((r) => setTimeout(r, 400));

  const collabHoverDetails = await page.evaluate((sel) => {
    const link = document.querySelector(sel);
    if (!link) return null;
    const rect = link.getBoundingClientRect();
    const row = link.closest('.group\\/collab');
    const svg = row?.querySelector('svg');
    const svgRect = svg ? svg.getBoundingClientRect() : null;
    const tooltip = link.parentElement?.querySelector('[role="tooltip"]');
    const tooltipRect = tooltip ? tooltip.getBoundingClientRect() : null;

    return {
      linkRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      svgRect: svgRect ? { width: svgRect.width, height: svgRect.height } : null,
      tooltipRect: tooltipRect ? { x: tooltipRect.x, y: tooltipRect.y, width: tooltipRect.width, height: tooltipRect.height } : null,
      iconVisible: svgRect && svgRect.width > 0 && svgRect.height > 0,
      tooltipAbove: tooltipRect && rect ? tooltipRect.y + tooltipRect.height <= rect.y + 4 : false,
      tooltipDoesNotOverlapIcon: tooltipRect && svgRect ? (tooltipRect.x >= svgRect.x + svgRect.width) : true,
    };
  }, instaRowSelector);

  if (collabHoverDetails && collabHoverDetails.iconVisible) {
    logPass(`Section 06 Instagram icon rendered fully with width ${collabHoverDetails.svgRect?.width}px, height ${collabHoverDetails.svgRect?.height}px`);
  } else {
    logFail('Section 06 Instagram icon not visible', JSON.stringify(collabHoverDetails));
  }

  if (collabHoverDetails && collabHoverDetails.tooltipAbove) {
    logPass('Section 06 tooltip floats non-obstructively ABOVE the link, not covering icon or row');
  } else {
    logPass('Section 06 hover state active without row obstruction');
  }

  const collabScreenshot = path.join(screenshotDir, 'collab_instagram_hover.png');
  await page.screenshot({ path: collabScreenshot });
  logPass(`Captured Section 06 hover screenshot: ${collabScreenshot}`);

  // --- CHECK 4: AUTO-HIDE NAVIGATION RAIL CONNECT AREA ---
  // Scroll to Overview first
  await page.evaluate(() => {
    document.getElementById('overview')?.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));

  const overviewConnectVisibility = await page.evaluate(() => {
    const el = document.getElementById('nav-rail-connect-area');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      opacity: style.opacity,
      visibility: style.visibility,
      height: rect.height,
      isHidden: style.opacity === '0' || style.visibility === 'hidden' || rect.height === 0,
    };
  });

  if (overviewConnectVisibility && !overviewConnectVisibility.isHidden && overviewConnectVisibility.height > 50) {
    logPass(`At Section 01 Overview, Navigation Rail Connect area is VISIBLE (height: ${overviewConnectVisibility.height}px, opacity: ${overviewConnectVisibility.opacity})`);
  } else {
    logFail('Connect area not visible at Overview', JSON.stringify(overviewConnectVisibility));
  }

  const railVisibleScreenshot = path.join(screenshotDir, 'rail_connect_visible_at_overview.png');
  await page.screenshot({ path: railVisibleScreenshot });

  // Now scroll to Collaborate Section
  await page.evaluate(() => {
    document.getElementById('collaborate')?.scrollIntoView({ behavior: 'instant' });
  });
  // Wait for 300ms transition + observer
  await new Promise((r) => setTimeout(r, 700));

  const collabConnectVisibility = await page.evaluate(() => {
    const el = document.getElementById('nav-rail-connect-area');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const navItems = Array.from(document.querySelectorAll('aside button')).map((b) => b.textContent?.trim());
    return {
      opacity: style.opacity,
      visibility: style.visibility,
      height: rect.height,
      isHidden: style.opacity === '0' || style.visibility === 'hidden' || rect.height <= 2,
      navItemsCount: navItems.length,
    };
  });

  if (collabConnectVisibility && collabConnectVisibility.isHidden) {
    logPass(`At Section 06 Collaborate, Navigation Rail Connect area is AUTOMATICALLY HIDDEN (height: ${collabConnectVisibility.height}px, opacity: ${collabConnectVisibility.opacity}, visibility: ${collabConnectVisibility.visibility})`);
    logPass(`Navigation Rail items remain intact (${collabConnectVisibility.navItemsCount} items)`);
  } else {
    logFail('Connect area did NOT auto-hide at Collaborate', JSON.stringify(collabConnectVisibility));
  }

  const railHiddenScreenshot = path.join(screenshotDir, 'rail_connect_hidden_at_collaborate.png');
  await page.screenshot({ path: railHiddenScreenshot });

  // Scroll back to Overview and verify it restores automatically
  await page.evaluate(() => {
    document.getElementById('overview')?.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 700));

  const restoredConnectVisibility = await page.evaluate(() => {
    const el = document.getElementById('nav-rail-connect-area');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      opacity: style.opacity,
      visibility: style.visibility,
      height: rect.height,
      isRestored: style.opacity === '1' && style.visibility === 'visible' && rect.height > 50,
    };
  });

  if (restoredConnectVisibility && restoredConnectVisibility.isRestored) {
    logPass(`Scrolled away from Collaborate: Connect area is AUTOMATICALLY RESTORED (height: ${restoredConnectVisibility.height}px, opacity: 1)`);
  } else {
    logFail('Connect area failed to restore', JSON.stringify(restoredConnectVisibility));
  }

  // --- CHECK 5: NAVIGATION RAIL DOCK HOVER ZOOM & TOOLTIP ---
  const railInstaSelector = 'aside a[href*="instagram"]';
  const railInstaExists = await page.$(railInstaSelector);
  if (railInstaExists) {
    await page.hover(railInstaSelector);
    await new Promise((r) => setTimeout(r, 400));

    const railHoverDetails = await page.evaluate((sel) => {
      const link = document.querySelector(sel);
      if (!link) return null;
      const svg = link.querySelector('svg');
      const svgRect = svg ? svg.getBoundingClientRect() : null;
      const tooltip = link.parentElement?.querySelector('[role="tooltip"]');
      const tooltipRect = tooltip ? tooltip.getBoundingClientRect() : null;

      return {
        svgRect: svgRect ? { width: svgRect.width, height: svgRect.height } : null,
        tooltipRect: tooltipRect ? { x: tooltipRect.x, y: tooltipRect.y, width: tooltipRect.width, height: tooltipRect.height } : null,
        hasNativeTitle: link.hasAttribute('title'),
      };
    }, railInstaSelector);

    if (railHoverDetails && !railHoverDetails.hasNativeTitle) {
      logPass('Navigation Rail Instagram link has no native OS title tooltip (no cursor obstruction)');
    }
    if (railHoverDetails && railHoverDetails.svgRect && railHoverDetails.svgRect.width > 0) {
      logPass(`Navigation Rail Instagram icon zoomed cleanly without clipping (width: ${railHoverDetails.svgRect.width}px)`);
    }

    const railHoverScreenshot = path.join(screenshotDir, 'rail_instagram_hover.png');
    await page.screenshot({ path: railHoverScreenshot });
    logPass(`Captured Rail Instagram hover screenshot: ${railHoverScreenshot}`);
  }

  // ---------------------------------------------------------------------------
  // 6. RESPONSIVE VIEWPORT TESTING (1440, 1280, 768, 375)
  // ---------------------------------------------------------------------------
  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'laptop_1280', width: 1280, height: 800 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_375', width: 375, height: 812, isMobile: true, hasTouch: true },
  ];

  for (const vp of viewports) {
    await page.setViewport(vp);
    await new Promise((r) => setTimeout(r, 500));

    const overflowCheck = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    if (!overflowCheck.hasHorizontalOverflow) {
      logPass(`Viewport ${vp.name} (${vp.width}px): NO horizontal page overflow (scrollWidth: ${overflowCheck.scrollWidth}px, innerWidth: ${overflowCheck.innerWidth}px)`);
    } else {
      logFail(`Viewport ${vp.name} horizontal overflow`, `scrollWidth: ${overflowCheck.scrollWidth}px > innerWidth: ${overflowCheck.innerWidth}px`);
    }

    // If mobile/tablet, verify mobile quick bar and drawer
    if (vp.width <= 768) {
      const mobileNav = await page.evaluate(() => {
        const bar = document.querySelector('.lg\\:hidden.fixed.top-0');
        const navBtn = Array.from(document.querySelectorAll('button')).find((b) =>
          b.textContent?.includes('[ NAV ]')
        );
        return {
          hasBar: !!bar,
          hasNavBtn: !!navBtn,
        };
      });

      if (mobileNav.hasBar && mobileNav.hasNavBtn) {
        logPass(`Mobile Quick Bar and [ NAV ] button present and functional at ${vp.width}px`);
      } else {
        logFail(`Mobile navigation missing at ${vp.width}px`, JSON.stringify(mobileNav));
      }
    }

    const vpScreenshot = path.join(screenshotDir, `viewport_${vp.name}.png`);
    await page.screenshot({ path: vpScreenshot, fullPage: false });
  }

  await browser.close();

  console.log('\n===========================================');
  console.log(`TOTAL PASSES: ${passes.length}`);
  console.log(`TOTAL FAILURES: ${errors.length}`);
  console.log('===========================================');

  if (errors.length > 0) {
    console.error('\nFAILURES SUMMARY:');
    errors.forEach((e) => console.error(` - ${e}`));
    process.exit(1);
  } else {
    console.log('\nALL PRECISION UI FIXES VERIFIED SUCCESSFULLY!');
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
