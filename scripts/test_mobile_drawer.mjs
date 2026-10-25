import puppeteer from 'puppeteer-core';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--window-size=375,812'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.textContent && b.textContent.includes('[ NAV ]')
    );
    // Click the visible one
    const visibleBtn = btns.find((b) => b.offsetParent !== null);
    if (visibleBtn) visibleBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const drawerState = await page.evaluate(() => {
    const drawer = document.querySelector('.fixed.inset-0.z-40');
    const terminalInDrawer = drawer
      ? drawer.querySelector('[aria-label*="terminal" i]') ||
        drawer.querySelector('button[title*="terminal" i]')
      : null;
    const links = Array.from(drawer ? drawer.querySelectorAll('a') : []).map((a) =>
      a.textContent ? a.textContent.trim() : ''
    );
    return {
      drawerOpen: !!drawer,
      hasTerminal: !!terminalInDrawer,
      linksCount: links.length,
      sampleLinks: links.slice(0, 4),
    };
  });
  console.log('DRAWER STATE:', JSON.stringify(drawerState, null, 2));

  await page.screenshot({ path: 'public/assets/precision_fixes_verification/mobile_drawer_open.png' });
  await browser.close();
}

main().catch(console.error);
