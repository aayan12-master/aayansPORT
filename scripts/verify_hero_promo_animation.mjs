import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const baseUrl = 'http://localhost:3000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('=================================================================');
  console.log('🚀 AAYAN.Sec Hero Promotional/Metrics Bar Animation Verification');
  console.log('=================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const results = [];
  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      results.push({ message, pass: true });
    } else {
      console.error(`  [FAIL] ${message}`);
      results.push({ message, pass: false });
    }
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Step 1: Navigate to homepage...');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#hero-stats-promotional-bar', { timeout: 20000 });
    await sleep(1500); // Allow initial hydration

    const statsBar = await page.$('#hero-stats-promotional-bar');
    assert(!!statsBar, 'Target component #hero-stats-promotional-bar located beneath Hero');

    // Check surrounding elements (quote block)
    const quoteBlock = await page.$('.border-l-4.border-\\[\\#DF491E\\]');
    assert(!!quoteBlock, 'Quote block located beneath promotional bar');

    // Step 2: Check initial geometry and content
    console.log('\nStep 2: Checking initial bar geometry & content in STATS mode...');
    const initialBarRect = await page.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, width: r.width };
    }, statsBar);

    const initialQuoteRect = await page.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    }, quoteBlock);

    console.log(`  Bar dimensions: ${Math.round(initialBarRect.width)}px x ${Math.round(initialBarRect.height)}px`);
    console.log(`  Quote block top: ${Math.round(initialQuoteRect.top)}px`);

    const hasStatsToggle = await page.$('#hero-toggle-stats');
    const hasSpotlightToggle = await page.$('#hero-toggle-spotlight');
    assert(!!hasStatsToggle, 'STATS toggle button present (#hero-toggle-stats)');
    assert(!!hasSpotlightToggle, 'SPOTLIGHT toggle button present (#hero-toggle-spotlight)');

    // Capture initial stats screenshot
    await statsBar.screenshot({ path: 'public/assets/test_promobar_stats_initial.png' });
    console.log('  Captured public/assets/test_promobar_stats_initial.png');

    // Step 3: Trigger transition from STATS -> SPOTLIGHT and inspect mid-transition
    console.log('\nStep 3: Trigger transition from STATS -> SPOTLIGHT...');
    
    // Click SPOTLIGHT
    await hasSpotlightToggle.click();

    // Inspect at 150ms (mid-flight of 380ms transition)
    await sleep(150);

    const midFlightState = await page.evaluate(() => {
      const bar = document.querySelector('#hero-stats-promotional-bar');
      const outgoing = bar?.querySelector('.animate-promo-exit');
      const incoming = bar?.querySelector('.animate-promo-enter');
      const quote = document.querySelector('.border-l-4.border-\\[\\#DF491E\\]');
      
      const barRect = bar ? bar.getBoundingClientRect() : null;
      const quoteRect = quote ? quote.getBoundingClientRect() : null;

      return {
        hasOutgoing: !!outgoing,
        outgoingText: outgoing ? outgoing.textContent : null,
        outgoingPointerEvents: outgoing ? window.getComputedStyle(outgoing).pointerEvents : null,
        outgoingAriaHidden: outgoing ? outgoing.getAttribute('aria-hidden') : null,
        hasIncoming: !!incoming,
        incomingText: incoming ? incoming.textContent : null,
        barHeight: barRect ? barRect.height : 0,
        quoteTop: quoteRect ? quoteRect.top : 0,
      };
    });

    assert(midFlightState.hasOutgoing, 'Mid-flight: Outgoing content layer exists with .animate-promo-exit');
    assert(midFlightState.hasIncoming, 'Mid-flight: Incoming content layer exists with .animate-promo-enter');
    assert(midFlightState.outgoingPointerEvents === 'none', 'Outgoing content layer has pointer-events: none (prevents click interception)');
    assert(midFlightState.outgoingAriaHidden === 'true', 'Outgoing content layer has aria-hidden="true"');
    
    const heightShiftMid = Math.abs(midFlightState.barHeight - initialBarRect.height);
    const quoteShiftMid = Math.abs(midFlightState.quoteTop - initialQuoteRect.top);
    console.log(`  Bar height shift mid-transition: ${heightShiftMid.toFixed(2)}px`);
    console.log(`  Quote top shift mid-transition: ${quoteShiftMid.toFixed(2)}px`);
    assert(heightShiftMid <= 2, `Bar height remained stable during transition (variance: ${heightShiftMid.toFixed(2)}px <= 2px)`);
    assert(quoteShiftMid <= 2, `Surrounding quote block did not jump (variance: ${quoteShiftMid.toFixed(2)}px <= 2px)`);

    // Capture mid-transition screenshot
    await statsBar.screenshot({ path: 'public/assets/test_promobar_transition_mid.png' });
    console.log('  Captured public/assets/test_promobar_transition_mid.png');

    // Step 4: Verify post-transition completion (> 380ms, test at 480ms)
    console.log('\nStep 4: Inspect post-transition state (at 480ms)...');
    await sleep(350); // total ~500ms since click

    const completedState = await page.evaluate(() => {
      const bar = document.querySelector('#hero-stats-promotional-bar');
      const outgoing = bar?.querySelector('.animate-promo-exit');
      const incoming = bar?.querySelector('.animate-promo-enter');
      const activeStatsBtn = document.querySelector('#hero-toggle-stats');
      const activeSpotlightBtn = document.querySelector('#hero-toggle-spotlight');
      const quote = document.querySelector('.border-l-4.border-\\[\\#DF491E\\]');
      const barRect = bar ? bar.getBoundingClientRect() : null;
      const quoteRect = quote ? quote.getBoundingClientRect() : null;

      return {
        hasOutgoing: !!outgoing,
        hasIncoming: !!incoming,
        statsBtnClass: activeStatsBtn ? activeStatsBtn.className : '',
        spotlightBtnClass: activeSpotlightBtn ? activeSpotlightBtn.className : '',
        barText: bar ? bar.textContent : '',
        barHeight: barRect ? barRect.height : 0,
        quoteTop: quoteRect ? quoteRect.top : 0,
      };
    });

    assert(!completedState.hasOutgoing, 'Outgoing content was cleanly unmounted after exit animation');
    assert(completedState.spotlightBtnClass.includes('bg-[#DF491E]'), 'SPOTLIGHT button indicates active state (#DF491E)');
    
    const heightShiftFinal = Math.abs(completedState.barHeight - initialBarRect.height);
    const quoteShiftFinal = Math.abs(completedState.quoteTop - initialQuoteRect.top);
    console.log(`  Bar height shift final: ${heightShiftFinal.toFixed(2)}px`);
    console.log(`  Quote top shift final: ${quoteShiftFinal.toFixed(2)}px`);
    assert(heightShiftFinal <= 2, `Bar height remained stable post-transition (variance: ${heightShiftFinal.toFixed(2)}px <= 2px)`);
    assert(quoteShiftFinal <= 2, `Surrounding quote block remained stable post-transition (variance: ${quoteShiftFinal.toFixed(2)}px <= 2px)`);

    await statsBar.screenshot({ path: 'public/assets/test_promobar_spotlight_completed.png' });
    console.log('  Captured public/assets/test_promobar_spotlight_completed.png');

    // Step 5: Transition back from SPOTLIGHT -> STATS
    console.log('\nStep 5: Trigger transition from SPOTLIGHT -> STATS...');
    await hasStatsToggle.click();
    await sleep(150);

    const backMidState = await page.evaluate(() => {
      const bar = document.querySelector('#hero-stats-promotional-bar');
      return {
        hasOutgoing: !!bar?.querySelector('.animate-promo-exit'),
        hasIncoming: !!bar?.querySelector('.animate-promo-enter'),
      };
    });
    assert(backMidState.hasOutgoing, 'Returning: Outgoing spotlight layer exists with .animate-promo-exit');
    assert(backMidState.hasIncoming, 'Returning: Incoming stats layer exists with .animate-promo-enter');

    await sleep(350); // Complete
    const backCompleteState = await page.evaluate(() => {
      const bar = document.querySelector('#hero-stats-promotional-bar');
      return {
        hasOutgoing: !!bar?.querySelector('.animate-promo-exit'),
        text: bar ? bar.textContent : '',
      };
    });
    assert(!backCompleteState.hasOutgoing, 'Outgoing spotlight cleanly unmounted after return transition');
    assert(backCompleteState.text.includes('PROJECTS'), 'Original statistics content is active and visible');

    // Step 6: Rapid toggle stress test (ensure no crashes, leaks, or overlapping locks)
    console.log('\nStep 6: Rapid toggle stress test (5 fast clicks)...');
    for (let i = 0; i < 5; i++) {
      if (i % 2 === 0) {
        await hasSpotlightToggle.click();
      } else {
        await hasStatsToggle.click();
      }
      await sleep(75);
    }
    await sleep(500); // Allow settling
    const settledState = await page.evaluate(() => {
      const bar = document.querySelector('#hero-stats-promotional-bar');
      const outgoing = bar?.querySelectorAll('.animate-promo-exit');
      const incoming = bar?.querySelectorAll('.animate-promo-enter');
      return {
        outgoingCount: outgoing ? outgoing.length : 0,
        hasError: !bar,
      };
    });
    assert(settledState.outgoingCount === 0, 'Rapid toggling settled cleanly with 0 leftover outgoing elements');

    // Step 7: Prefers-reduced-motion test
    console.log('\nStep 7: Prefers-reduced-motion accessibility test...');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await hasSpotlightToggle.click();
    await sleep(50);

    const reducedMotionState = await page.evaluate(() => {
      const bar = document.querySelector('#hero-stats-promotional-bar');
      const exitEl = bar?.querySelector('.animate-promo-exit');
      const enterEl = bar?.querySelector('.animate-promo-enter');
      return {
        hasOutgoingInDom: !!exitEl,
        enterAnimation: enterEl ? window.getComputedStyle(enterEl).animationName : null,
      };
    });
    assert(!reducedMotionState.hasOutgoingInDom, 'Reduced-motion: Outgoing content immediately bypassed (no jarring motion)');

    // Step 8: Mobile layout stability check (375x667)
    console.log('\nStep 8: Mobile layout check (375x667)...');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await page.setViewport({ width: 375, height: 667 });
    await sleep(300);

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert(!mobileOverflow, 'Mobile viewport (375px): Zero horizontal overflow');

    // Toggle on mobile
    const mobileStatsToggle = await page.$('#hero-toggle-stats');
    const mobileSpotlightToggle = await page.$('#hero-toggle-spotlight');
    if (mobileStatsToggle && mobileSpotlightToggle) {
      await mobileStatsToggle.click();
      await sleep(150);
      const mobileMid = await page.evaluate(() => {
        const bar = document.querySelector('#hero-stats-promotional-bar');
        return !!bar?.querySelector('.animate-promo-exit');
      });
      assert(mobileMid, 'Mobile viewport: Smooth transition triggers correctly');
      await sleep(350);
      await statsBar.screenshot({ path: 'public/assets/test_promobar_mobile_stats.png' });
      console.log('  Captured public/assets/test_promobar_mobile_stats.png');
    }

    console.log('\n=================================================================');
    const total = results.length;
    const passed = results.filter((r) => r.pass).length;
    const failed = total - passed;
    console.log(`Results: ${passed}/${total} passed (${failed} failed)`);
    console.log('=================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
