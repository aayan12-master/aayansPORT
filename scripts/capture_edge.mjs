import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--window-size=1536,1024'],
  });

  const page = await browser.newPage();

  // 1. Desktop 1536x1024
  await page.setViewport({ width: 1536, height: 1024 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const heroPath = path.resolve('public/assets/viewport_hero.png');
  await page.screenshot({ path: heroPath, fullPage: false });
  console.log('Saved desktop hero screenshot:', heroPath);

  // 2. Mobile 390x844
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const mobileHeroPath = path.resolve('public/assets/viewport_mobile_hero.png');
  await page.screenshot({ path: mobileHeroPath, fullPage: false });
  console.log('Saved mobile hero screenshot:', mobileHeroPath);

  // 3. Tablet 1024x768
  await page.setViewport({ width: 1024, height: 768 });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const tabletHeroPath = path.resolve('public/assets/viewport_tablet_hero.png');
  await page.screenshot({ path: tabletHeroPath, fullPage: false });
  console.log('Saved tablet hero screenshot:', tabletHeroPath);

  await browser.close();
}

main().catch(console.error);
