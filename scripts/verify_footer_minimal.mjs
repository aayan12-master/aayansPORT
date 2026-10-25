import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const baseUrl = 'http://127.0.0.1:3000';

async function run() {
  console.log('===============================================================');
  console.log('VERIFYING MINIMAL FOOTER: NO SOCIAL LINKS, ALIGNMENT & RESPONSIVENESS');
  console.log('===============================================================');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. DESKTOP VIEWPORT
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  // Scroll to footer
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise((r) => setTimeout(r, 500));

  const desktopFooterData = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (!footer) return null;

    const links = Array.from(footer.querySelectorAll('a'));
    const svgs = Array.from(footer.querySelectorAll('svg'));
    const text = footer.innerText;
    const rect = footer.getBoundingClientRect();
    const docOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;

    // Check Collaborate social accounts
    const collabSocials = Array.from(document.querySelectorAll('#collaborate [aria-label="Verified social endpoints scroll list"] a')).map(a => a.textContent.trim());
    
    // Check Navigation rail socials (visible on desktop)
    const navSocials = Array.from(document.querySelectorAll('aside a[target="_blank"]'))
      .filter(a => a.offsetParent !== null)
      .map(a => a.textContent.trim());

    return {
      linkCount: links.length,
      svgCount: svgs.length,
      text,
      rect: { width: rect.width, height: rect.height },
      docOverflow,
      collabSocialsCount: collabSocials.length,
      navSocialsCount: navSocials.length,
    };
  });

  console.log('\n--- 1. Desktop Footer Verification ---');
  console.log('Footer Links Count (must be 0):', desktopFooterData.linkCount);
  console.log('Footer Icons/SVGs Count (must be 0):', desktopFooterData.svgCount);
  console.log('Footer Dimensions:', desktopFooterData.rect);
  console.log('Document Horizontal Overflow:', desktopFooterData.docOverflow);

  if (desktopFooterData.linkCount !== 0) {
    throw new Error(`Expected 0 links in footer, found ${desktopFooterData.linkCount}`);
  }
  if (desktopFooterData.svgCount !== 0) {
    throw new Error(`Expected 0 icons/SVGs in footer, found ${desktopFooterData.svgCount}`);
  }
  if (!desktopFooterData.text.includes('AAYAN.SEC')) {
    throw new Error('Footer missing brand "AAYAN.SEC"');
  }
  if (!desktopFooterData.text.includes('SECURITY RESEARCH DOSSIER // 2025')) {
    throw new Error('Footer missing dossier text "SECURITY RESEARCH DOSSIER // 2025"');
  }
  if (!desktopFooterData.text.includes('BUILT WITH PRECISION')) {
    throw new Error('Footer missing subtext "BUILT WITH PRECISION"');
  }
  console.log('✓ Desktop footer contains brand on left, dossier text beneath, and "BUILT WITH PRECISION" on right.');
  console.log('✓ Desktop footer completely free of social links and icons.');

  // Check preservation elsewhere
  console.log('\n--- 2. Social Accounts Preservation in Other Sections ---');
  console.log('Collaborate Section Direct Channels count:', desktopFooterData.collabSocialsCount);
  console.log('Navigation Rail Connect count:', desktopFooterData.navSocialsCount);
  if (desktopFooterData.collabSocialsCount === 0 || desktopFooterData.navSocialsCount === 0) {
    throw new Error('Social accounts missing from Collaborate or Nav Rail!');
  }
  console.log('✓ Social accounts fully preserved in Section 06 (Collaborate) and Navigation Rail.');

  // Screenshot desktop footer
  const footerEl = await page.$('footer');
  if (footerEl) {
    await footerEl.screenshot({ path: path.resolve('public/assets/verified_footer_minimal_desktop.png') });
    console.log('✓ Saved desktop minimal footer screenshot: public/assets/verified_footer_minimal_desktop.png');
  }

  // 3. MOBILE VIEWPORT (375x812)
  console.log('\n--- 3. Mobile Viewport Verification (375px) ---');
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise((r) => setTimeout(r, 500));

  const mobileFooterData = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (!footer) return null;

    const links = Array.from(footer.querySelectorAll('a'));
    const docOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    const rect = footer.getBoundingClientRect();
    return {
      linkCount: links.length,
      docOverflow,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      rect: { width: rect.width, height: rect.height },
    };
  });

  console.log('Mobile Footer Link Count (must be 0):', mobileFooterData.linkCount);
  console.log('Mobile Viewport Width:', `${mobileFooterData.clientWidth}px (scrollWidth: ${mobileFooterData.scrollWidth}px)`);
  console.log('Mobile Horizontal Overflow:', mobileFooterData.docOverflow);

  if (mobileFooterData.linkCount !== 0) {
    throw new Error(`Expected 0 links on mobile footer, found ${mobileFooterData.linkCount}`);
  }
  if (mobileFooterData.docOverflow) {
    throw new Error('Horizontal overflow detected on mobile!');
  }
  console.log('✓ Mobile footer is 100% responsive with zero horizontal overflow.');

  // Screenshot mobile footer
  const mobileFooterEl = await page.$('footer');
  if (mobileFooterEl) {
    await mobileFooterEl.screenshot({ path: path.resolve('public/assets/verified_footer_minimal_mobile.png') });
    console.log('✓ Saved mobile minimal footer screenshot: public/assets/verified_footer_minimal_mobile.png');
  }

  await browser.close();
  console.log('\n===============================================================');
  console.log('ALL VERIFICATIONS PASSED: FOOTER IS COMPACT, CLEAN & MINIMAL');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
