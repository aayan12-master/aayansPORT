import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fetchGitHubRepoForImport, validateGitHubRepoUrl, normalizeToolFromProject } from '../src/lib/github.js';
import { getProjects, createProject, updateProject, deleteProject, findProjectByRepoUrl, getProjectById } from '../src/lib/cms.js';

// Read environment
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
}

for (const [k, v] of Object.entries(envVars)) {
  process.env[k] = v;
}

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function runCyberStrikeTest() {
  console.log('================================================================');
  console.log('   CYBERSTRIKE LIFECYCLE TEST: IMPORT -> DRAFT -> PUBLISH -> UNPUBLISH');
  console.log('================================================================\n');

  const results = [];
  function recordResult(testName, expected, actual, passed, extra = '') {
    results.push({ testName, expected, actual, passed, extra });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}`);
    console.log(`       Expected: ${expected}`);
    console.log(`       Actual:   ${actual}`);
    if (extra) console.log(`       Details:  ${extra}`);
    console.log('');
  }

  // 0. Clean up any previous test CyberStrike record if present
  const existingCheck = await findProjectByRepoUrl('https://github.com/CyberStrikeus/CyberStrike');
  if (existingCheck) {
    console.log(`[*] Pre-cleanup: found existing record ${existingCheck.id}, deleting before test...`);
    await deleteProject(existingCheck.id);
  }

  let importedData = null;
  let recordId = null;

  // ---------------------------------------------------------------------------
  // STEP 1: IMPORT CYBERSTRIKE REPOSITORY
  // ---------------------------------------------------------------------------
  const rawUrl = 'https://github.com/CyberStrikeus/CyberStrike.git';
  try {
    const parsed = validateGitHubRepoUrl(rawUrl);
    const isGitParsed = parsed.repo === 'CyberStrike' && parsed.normalizedUrl === 'https://github.com/CyberStrikeus/CyberStrike';
    recordResult(
      'URL Parsing with .git suffix',
      'owner: CyberStrikeus, repo: CyberStrike, normalizedUrl without .git',
      `${parsed.owner}/${parsed.repo} -> ${parsed.normalizedUrl}`,
      isGitParsed
    );

    importedData = await fetchGitHubRepoForImport(rawUrl);
    const hasReadme = importedData.readme_status === 'available' && importedData.readme_preview.length > 50;
    recordResult(
      'Import CyberStrike',
      'Accurate README preview or honest fallback',
      hasReadme ? `Extracted real README preview (${importedData.readme_preview.length} chars)` : 'Failed to extract',
      hasReadme,
      `Preview excerpt: "${importedData.readme_preview}"`
    );
  } catch (err) {
    recordResult('Import CyberStrike', 'Accurate README preview', `Error: ${err.message}`, false);
    return;
  }

  // ---------------------------------------------------------------------------
  // STEP 2: TEST DRAFT BEHAVIOR
  // ---------------------------------------------------------------------------
  try {
    console.log('[*] Saving CyberStrike as DRAFT...');
    const draftPayload = {
      title: importedData.title,
      slug: importedData.slug,
      summary: importedData.summary,
      description: importedData.readme_preview,
      readme_preview: importedData.readme_preview,
      readme_status: importedData.readme_status,
      tech_stack: importedData.tech_stack,
      category: importedData.category,
      repo_url: importedData.repo_url,
      demo_url: importedData.demo_url,
      default_branch: importedData.default_branch,
      status: 'draft',
      featured: false,
      display_order: 10,
    };

    const savedDraft = await createProject(draftPayload);
    recordId = savedDraft.id;

    recordResult(
      'Save draft',
      'Saved in Supabase with status=draft',
      savedDraft && savedDraft.status === 'draft' ? `Saved in Supabase with status=${savedDraft.status}` : 'Save failed',
      savedDraft && savedDraft.status === 'draft',
      `Record ID: ${savedDraft.id}`
    );

    // Verify Admin view includes draft
    const adminProjects = await getProjects({ publishedOnly: false });
    const foundInAdmin = adminProjects.find((p) => p.id === recordId);
    recordResult(
      'Admin refresh while draft',
      'Still visible in admin with status=draft',
      foundInAdmin ? `Visible in admin list (status=${foundInAdmin.status})` : 'Not found in admin list',
      Boolean(foundInAdmin && foundInAdmin.status === 'draft')
    );

    // Verify Public view excludes draft
    const publicProjects = await getProjects({ publishedOnly: true });
    const foundInPublic = publicProjects.find((p) => p.id === recordId || p.slug === importedData.slug);
    recordResult(
      'Public view while draft',
      'Hidden from public visitors',
      foundInPublic ? `ERROR: Found in public list: ${foundInPublic.title}` : 'Hidden (Not present in published list)',
      !foundInPublic
    );

    // Verify draft can be edited and saved again
    const updatedSummary = 'Updated draft summary for penetration testing tool.';
    await updateProject(recordId, { summary: updatedSummary });
    const reCheckedDraft = await getProjectById(recordId);
    recordResult(
      'Edit draft without status change',
      'Summary updated, status remains draft',
      reCheckedDraft?.summary === updatedSummary && reCheckedDraft?.status === 'draft'
        ? 'Summary updated, status remains draft'
        : 'Update failed',
      Boolean(reCheckedDraft?.summary === updatedSummary && reCheckedDraft?.status === 'draft')
    );

    // Verify no duplicates on reload
    const duplicateCheckDraft = adminProjects.filter((p) => p.repo_url === importedData.repo_url);
    recordResult(
      'Duplicate check while draft',
      'Exactly 1 record in database',
      `${duplicateCheckDraft.length} record found`,
      duplicateCheckDraft.length === 1
    );

  } catch (err) {
    recordResult('Save draft & verify', 'Success', `Error: ${err.message}`, false);
  }

  // ---------------------------------------------------------------------------
  // STEP 3: TEST PUBLISH BEHAVIOR
  // ---------------------------------------------------------------------------
  try {
    console.log('[*] Updating existing CyberStrike record to PUBLISHED...');
    await updateProject(recordId, { status: 'published' });

    const publishedRecord = await getProjectById(recordId);
    recordResult(
      'Publish existing record',
      'Same record updated to status=published',
      publishedRecord?.status === 'published' ? `Record ${recordId} updated to status=published` : 'Status not published',
      Boolean(publishedRecord && publishedRecord.status === 'published' && publishedRecord.id === recordId)
    );

    // Verify Admin view shows published
    const adminAfterPublish = await getProjects({ publishedOnly: false });
    const foundAdminPub = adminAfterPublish.find((p) => p.id === recordId);
    recordResult(
      'Refresh after publish (Admin)',
      'Still published in admin after refresh',
      foundAdminPub?.status === 'published' ? `Published (status=${foundAdminPub.status})` : 'Status mismatch',
      Boolean(foundAdminPub?.status === 'published')
    );

    // Verify Public view includes CyberStrike
    const publicAfterPublish = await getProjects({ publishedOnly: true });
    const foundPublic = publicAfterPublish.find((p) => p.id === recordId);
    recordResult(
      'Public view after publish',
      'Visible in public Tools section',
      foundPublic ? `Visible publicly: "${foundPublic.title}" (${foundPublic.category})` : 'Missing in public list',
      Boolean(foundPublic)
    );

    // Verify public normalization displays saved Supabase content and real link
    if (foundPublic) {
      const normalized = normalizeToolFromProject(foundPublic);
      const isContentAccurate =
        normalized.readme_excerpt.length > 50 &&
        normalized.html_url === 'https://github.com/CyberStrikeus/CyberStrike' &&
        normalized.default_branch === 'main' &&
        normalized.stars === 0; // no fake stars

      recordResult(
        'Public Card & Modal Data Fidelity',
        'Saved snapshot preview, verified branch, correct repo URL, zero fake stars',
        `Excerpt len: ${normalized.readme_excerpt.length}, branch: ${normalized.default_branch}, url: ${normalized.html_url}, stars: ${normalized.stars}`,
        isContentAccurate
      );
    }

    // Verify exactly one record exists (no duplicate created by publishing)
    const allRecordsPub = (await getProjects({ publishedOnly: false })).filter(
      (p) => p.repo_url === importedData.repo_url || p.slug === importedData.slug
    );
    recordResult(
      'Duplicate check after publish',
      'Exactly 1 record in database',
      `${allRecordsPub.length} record found`,
      allRecordsPub.length === 1
    );

  } catch (err) {
    recordResult('Publish existing record & verify', 'Success', `Error: ${err.message}`, false);
  }

  // ---------------------------------------------------------------------------
  // STEP 4: TEST UNPUBLISH BEHAVIOR
  // ---------------------------------------------------------------------------
  try {
    console.log('[*] Changing status back to DRAFT (Unpublish)...');
    await updateProject(recordId, { status: 'draft' });

    const unpubRecord = await getProjectById(recordId);
    recordResult(
      'Unpublish',
      'Hidden publicly, retained in admin as draft',
      unpubRecord?.status === 'draft' ? `Status updated to draft (ID: ${unpubRecord.id})` : 'Status failed to revert',
      Boolean(unpubRecord && unpubRecord.status === 'draft')
    );

    // Check Public view
    const publicAfterUnpub = await getProjects({ publishedOnly: true });
    const foundInPublicUnpub = publicAfterUnpub.find((p) => p.id === recordId);
    recordResult(
      'Public view after unpublish',
      'Disappears from public Tools section',
      foundInPublicUnpub ? 'ERROR: Still visible publicly' : 'Hidden publicly (Not in published list)',
      !foundInPublicUnpub
    );

    // Check Admin view
    const adminAfterUnpub = await getProjects({ publishedOnly: false });
    const foundInAdminUnpub = adminAfterUnpub.find((p) => p.id === recordId);
    recordResult(
      'Admin view after unpublish',
      'Retained in admin list as draft',
      foundInAdminUnpub && foundInAdminUnpub.status === 'draft' ? `Retained in admin (status=draft)` : 'Not in admin',
      Boolean(foundInAdminUnpub && foundInAdminUnpub.status === 'draft')
    );

  } catch (err) {
    recordResult('Unpublish & verify', 'Success', `Error: ${err.message}`, false);
  }

  // ---------------------------------------------------------------------------
  // STEP 5: FINAL CLEANUP OR LEAVING TOOL RECORD
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('   TEST SUMMARY TABLE');
  console.log('================================================================');
  console.table(
    results.map((r) => ({
      Test: r.testName,
      'Expected Result': r.expected,
      'Actual Result': r.actual,
      Status: r.passed ? 'PASSED' : 'FAILED',
    }))
  );

  console.log(`\nCyberStrike Supabase Record ID: ${recordId}`);
}

runCyberStrikeTest();
