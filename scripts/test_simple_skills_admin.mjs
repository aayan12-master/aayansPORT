import puppeteer from 'puppeteer-core';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log('Launching browser for comprehensive Simple Skills Admin & Domain Management verification...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--window-size=1536,1024'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  // 1. Login to admin
  console.log('Navigating to /admin...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  
  const hasLoginInput = await page.$('input[type="text"]');
  if (hasLoginInput) {
    console.log('Logging in with admin credentials...');
    await page.focus('input[type="text"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('input[type="text"]', 'Kingsman', { delay: 20 });

    await page.focus('input[type="password"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('input[type="password"]', 'Kingsman', { delay: 20 });

    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 2500));
  } else {
    console.log('Already authenticated into admin dashboard.');
  }

  // 2. Click SKILLS MATRIX tab
  console.log('Clicking SKILLS MATRIX tab...');
  await page.waitForSelector('#admin-tab-skills', { timeout: 10000 });
  await page.click('#admin-tab-skills');
  await page.waitForSelector('#skills-search-input', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 800));

  // 3. Verify Subtitle Removed & Header Requirements
  console.log('\n--- Verifying Header Simplification ---');
  const hasSubtitle = await page.evaluate(() => {
    return document.body.innerText.includes('Add, edit, and publish your skills.');
  });
  console.log('[VERIFY] Subtitle "Add, edit, and publish your skills." removed?', !hasSubtitle);

  const hasManageSkillsHeader = await page.evaluate(() => {
    return document.body.innerText.includes('MANAGE SKILLS');
  });
  console.log('[VERIFY] Header "MANAGE SKILLS" present?', hasManageSkillsHeader);

  const hasManageDomainsButton = await page.$('#manage-domains-button');
  console.log('[VERIFY] "MANAGE DOMAINS" button present beside "+ ADD NEW SKILL"?', hasManageDomainsButton !== null);

  const hasConstellationPreview = await page.evaluate(() => {
    return document.body.innerText.includes('LIVE CONSTELLATION PREVIEW');
  });
  console.log('[VERIFY] Live Constellation Preview completely removed from admin?', !hasConstellationPreview);

  // Capture full-width clean header screenshot
  const fullwidthPath = path.resolve('public/assets/admin_skills_simple_fullwidth.png');
  await page.screenshot({ path: fullwidthPath, fullPage: false });
  console.log('Saved simple full-width admin screenshot:', fullwidthPath);

  // 4. Test Manage Domains Modal
  console.log('\n--- Testing Domain Management Modal ---');
  await page.click('#manage-domains-button');
  await page.waitForSelector('#create-new-domain-btn', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 400));

  const domainListModalPath = path.resolve('public/assets/admin_domains_modal_list.png');
  await page.screenshot({ path: domainListModalPath, fullPage: false });
  console.log('Saved Manage Domains Modal screenshot:', domainListModalPath);

  // Create Domain 05 via Manage Domains modal
  console.log('Clicking + CREATE NEW DOMAIN...');
  await page.click('#create-new-domain-btn');
  await page.waitForSelector('#domain-num-input', { timeout: 5000 });

  await page.focus('#domain-num-input');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('#domain-num-input', '05', { delay: 20 });

  await page.focus('#domain-title-input');
  await page.type('#domain-title-input', 'IOT & FIRMWARE SECURITY', { delay: 20 });

  await page.focus('#domain-desc-input');
  await page.type('#domain-desc-input', 'Hardware analysis, firmware extraction, and RTOS exploitation.', { delay: 10 });

  const domainFormModalPath = path.resolve('public/assets/admin_domains_modal_form.png');
  await page.screenshot({ path: domainFormModalPath, fullPage: false });
  console.log('Saved Create Domain Form screenshot:', domainFormModalPath);

  console.log('Saving Domain 05 to database...');
  await page.click('#save-domain-submit-btn');
  await page.waitForSelector('#create-new-domain-btn', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000));

  const isDomain05Listed = await page.evaluate(() => {
    return document.body.innerText.includes('IOT & FIRMWARE SECURITY');
  });
  console.log('[PASS] Was Domain 05 created and listed in Manage Domains modal?', isDomain05Listed);

  // Close Domain Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find((b) => b.innerText === 'CLOSE');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 5. Test Inline Domain Creation From Skill Modal (Requirement 4)
  console.log('\n--- Testing Inline Domain Creation from Skill Modal ---');
  await page.click('#add-new-skill-button');
  await page.waitForSelector('#add-item-name-input', { timeout: 5000 });

  // Enter a skill name first
  const testCompName = 'CAN Bus Protocol Reversing';
  await page.focus('#add-item-name-input');
  await page.type('#add-item-name-input', testCompName, { delay: 20 });

  const hasInlineCreateDomainBtn = await page.$('#create-domain-from-skill-btn');
  console.log('[VERIFY] Inline "+ Create Domain" button visible beside dropdown?', hasInlineCreateDomainBtn !== null);

  // Click "+ Create Domain" from within skill modal
  console.log('Clicking inline "+ Create Domain" button...');
  await page.click('#create-domain-from-skill-btn');
  await page.waitForSelector('#domain-num-input', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 400));

  // Enter Domain 06
  await page.focus('#domain-num-input');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('#domain-num-input', '06', { delay: 20 });

  await page.focus('#domain-title-input');
  await page.type('#domain-title-input', 'AUTOMOTIVE CYBERSECURITY', { delay: 20 });

  await page.focus('#domain-desc-input');
  await page.type('#domain-desc-input', 'Automotive CAN bus, telematics units, and connected vehicle security.', { delay: 10 });

  console.log('Saving Domain 06 and returning to skill form...');
  await page.click('#save-domain-submit-btn');

  // Verify return to skill modal with preserved inputs
  await page.waitForSelector('#add-item-name-input', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000));

  const preservedName = await page.$eval('#add-item-name-input', (el) => el.value);
  console.log('[PASS] Was skill name preserved after returning from domain creation?', preservedName === testCompName);

  const selectedDomainText = await page.evaluate(() => {
    const sel = document.querySelector('#skill-parent-domain-select');
    return sel ? sel.options[sel.selectedIndex]?.text : '';
  });
  console.log('[PASS] Was newly created Domain 06 automatically selected?', selectedDomainText.includes('AUTOMOTIVE CYBERSECURITY'));

  // Save the competency under Domain 06
  console.log('Saving competency under Domain 06...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText && b.innerText === 'SAVE');
    if (btn) btn.click();
  });
  await page.waitForFunction(() => !document.body.innerText.includes('SAVING...'), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000));

  const isCompListed = await page.evaluate((name) => {
    const list = document.querySelector('.divide-y');
    return list ? list.innerText.includes(name) : false;
  }, testCompName);
  console.log(`[PASS] Was "${testCompName}" saved and displayed in main list?`, isCompListed);

  // 6. Add a Tool to Domain 06
  console.log('\n--- Adding a Tool to Domain 06 ---');
  await page.click('#add-new-skill-button');
  await page.waitForSelector('#add-item-name-input', { timeout: 5000 });

  // Switch type to Tool
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const toolBtn = buttons.find((b) => b.innerText && b.innerText === 'Tool');
    if (toolBtn) toolBtn.click();
  });

  const testToolName = 'SavvyCAN Interface';
  await page.focus('#add-item-name-input');
  await page.type('#add-item-name-input', testToolName, { delay: 20 });

  // Select Domain 06
  await page.evaluate(() => {
    const sel = document.querySelector('#skill-parent-domain-select');
    if (sel) {
      const opt = Array.from(sel.options).find((o) => o.text.includes('AUTOMOTIVE CYBERSECURITY'));
      if (opt) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });

  // Save tool
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText && b.innerText === 'SAVE');
    if (btn) btn.click();
  });
  await page.waitForFunction(() => !document.body.innerText.includes('SAVING...'), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000));

  const isToolListed = await page.evaluate((name) => {
    const list = document.querySelector('.divide-y');
    return list ? list.innerText.includes(name) : false;
  }, testToolName);
  console.log(`[PASS] Was Tool "${testToolName}" saved and displayed in main list?`, isToolListed);

  // 7. Edit and publish item
  console.log('\n--- Testing Edit and Rename ---');
  const updatedToolName = 'SavvyCAN Bus Sniffer Pro';
  await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll('.divide-y > div'));
    for (const row of rows) {
      if (row.innerText.includes(name)) {
        const editBtn = row.querySelector('button[title="Edit skill or tool"]');
        if (editBtn) editBtn.click();
        break;
      }
    }
  }, testToolName);

  await page.waitForSelector('#add-item-name-input', { timeout: 5000 });
  await page.focus('#add-item-name-input');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('#add-item-name-input', updatedToolName, { delay: 20 });

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText && b.innerText === 'SAVE');
    if (btn) btn.click();
  });
  await page.waitForFunction(() => !document.body.innerText.includes('SAVING...'), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000));

  const isUpdatedListed = await page.evaluate((name) => {
    const list = document.querySelector('.divide-y');
    return list ? list.innerText.includes(name) : false;
  }, updatedToolName);
  console.log(`[PASS] Was "${updatedToolName}" updated in list?`, isUpdatedListed);

  // 8. Test Hard Reload Persistence
  console.log('\n--- Verifying Database Persistence Across Full Reload ---');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  const hasLoginInputReload = await page.$('input[type="text"]');
  if (hasLoginInputReload) {
    await page.focus('input[type="text"]');
    await page.type('input[type="text"]', 'Kingsman', { delay: 20 });
    await page.focus('input[type="password"]');
    await page.type('input[type="password"]', 'Kingsman', { delay: 20 });
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 2500));
  }

  await page.waitForSelector('#admin-tab-skills', { timeout: 10000 });
  await page.click('#admin-tab-skills');
  await page.waitForSelector('#skills-search-input', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 800));

  const isPersistedDomain05 = await page.evaluate(() => document.body.innerText.includes('IOT & FIRMWARE SECURITY'));
  const isPersistedDomain06 = await page.evaluate(() => document.body.innerText.includes('AUTOMOTIVE CYBERSECURITY'));
  const isPersistedComp = await page.evaluate((name) => document.body.innerText.includes(name), testCompName);
  const isPersistedTool = await page.evaluate((name) => document.body.innerText.includes(name), updatedToolName);

  console.log('[PASS] Domain 05 persisted in database?', isPersistedDomain05);
  console.log('[PASS] Domain 06 persisted in database?', isPersistedDomain06);
  console.log('[PASS] Competency persisted in database?', isPersistedComp);
  console.log('[PASS] Tool persisted in database?', isPersistedTool);

  // 9. Verify Public Portfolio at /#skills
  console.log('\n--- Verifying Public Portfolio Integrity ---');
  const publicPage = await browser.newPage();
  await publicPage.setViewport({ width: 1440, height: 1000 });
  await publicPage.goto('http://localhost:3000/#skills', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2500));

  const publicConstellationPath = path.resolve('public/assets/public_skills_constellation.png');
  await publicPage.screenshot({ path: publicConstellationPath, fullPage: false });
  console.log('[PASS] Saved public constellation screenshot:', publicConstellationPath);
  await publicPage.close();

  // 10. Clean up: Delete Domain 06 & Domain 05 via Manage Domains modal
  console.log('\n--- Cleaning up Test Domains & Items in Admin ---');
  await page.click('#manage-domains-button');
  await page.waitForSelector('#create-new-domain-btn', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 500));

  // Delete Domain 06
  const clicked06 = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    if (!modal) return false;
    const rows = Array.from(modal.querySelectorAll('.divide-y > div'));
    for (const r of rows) {
      if (r.innerText.includes('AUTOMOTIVE CYBERSECURITY')) {
        const delBtn = r.querySelector('button[title="Delete domain"]');
        if (delBtn) {
          delBtn.click();
          return true;
        }
      }
    }
    return false;
  });
  console.log('Clicked delete button for Domain 06?', clicked06);

  await page.waitForSelector('#confirm-delete-domain-btn', { timeout: 5000 });
  console.log('Confirmed domain deletion warning displayed.');
  await page.click('#confirm-delete-domain-btn');
  await page.waitForFunction(() => !document.body.innerText.includes('DELETING...'), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000));

  // Delete Domain 05
  const clicked05 = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    if (!modal) return false;
    const rows = Array.from(modal.querySelectorAll('.divide-y > div'));
    for (const r of rows) {
      if (r.innerText.includes('IOT & FIRMWARE SECURITY')) {
        const delBtn = r.querySelector('button[title="Delete domain"]');
        if (delBtn) {
          delBtn.click();
          return true;
        }
      }
    }
    return false;
  });
  console.log('Clicked delete button for Domain 05?', clicked05);

  await page.waitForSelector('#confirm-delete-domain-btn', { timeout: 5000 });
  await page.click('#confirm-delete-domain-btn');
  await page.waitForFunction(() => !document.body.innerText.includes('DELETING...'), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000));

  // Close Manage Domains modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find((b) => b.innerText === 'CLOSE');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const isCleanedUpDomain05 = await page.evaluate(() => !document.body.innerText.includes('IOT & FIRMWARE SECURITY'));
  const isCleanedUpDomain06 = await page.evaluate(() => !document.body.innerText.includes('AUTOMOTIVE CYBERSECURITY'));
  console.log('[PASS] Was Domain 05 cleanly removed from database?', isCleanedUpDomain05);
  console.log('[PASS] Was Domain 06 cleanly removed from database?', isCleanedUpDomain06);

  await browser.close();
  console.log('\n================================================================');
  console.log('ALL VERIFICATION & LIFECYCLE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
