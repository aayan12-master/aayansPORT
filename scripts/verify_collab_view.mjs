import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const baseUrl = 'http://127.0.0.1:3000';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  // Desktop Collaborate section screenshot
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(() => {
    const el = document.getElementById('collaborate');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await new Promise((r) => setTimeout(r, 600));

  const desktopCollab = path.resolve('public/assets/verified_desktop_collaborate.png');
  await page.screenshot({ path: desktopCollab });
  console.log('✓ Desktop Collaborate screenshot saved');

  // Mobile Collaborate section screenshot
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    const el = document.getElementById('collaborate');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await new Promise((r) => setTimeout(r, 600));

  const mobileCollab = path.resolve('public/assets/verified_mobile_collaborate_full.png');
  await page.screenshot({ path: mobileCollab });
  console.log('✓ Mobile Collaborate screenshot saved');

  // Desktop Footer screenshot
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise((r) => setTimeout(r, 600));
  const footerScreenshot = path.resolve('public/assets/verified_footer.png');
  await page.screenshot({ path: footerScreenshot });
  console.log('✓ Desktop Footer screenshot saved');

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
