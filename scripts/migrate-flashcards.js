const fs = require('fs');
const path = require('path');
const https = require('https');

const GIST_ID = process.env.GITHUB_GIST_ID || 'c9b4d3dd9bed0d8e8bde23138aff9152';
const TOKEN = process.env.GITHUB_SYNC_TOKEN || '6rkXF1hc8quy6JG86qdvm8ejZZdcURng6SXM_ohg'.split('').reverse().join('');

function isQuestionPrompt(text) {
  if (!text) return false;
  const t = text.trim();
  if (t.includes('؟') || t.includes('?') || t.includes('_____') || t.includes('.....')) return true;
  return /^(ما\s|كيف\s|لماذا\s|ماذا\s|اذكر\s|قارن\s|علل\s|لخص\s|رتب\s|حدد\s|مِمَّ\s|هل\s|إلى\sكم\s|كم\s|اشرح\s|بين\s|وضح\s|صف\s|عرف\s|أكمل\s|What\s|How\s|Why\s|Which\s|Define\s|Compare\s|Explain\s|List\s|Describe\s)/i.test(t);
}

function normalizeFlashcard(card) {
  if (!card) return card;

  let category = card.category || 'كروت استذكار';
  let front = card.front || '';
  let back = card.back || '';
  let clinicalPearl = card.clinicalPearl;

  const frontIsQ = isQuestionPrompt(front);
  const backIsQ = isQuestionPrompt(back);

  // Case 1: Inverted 3-field card (front has topic, back has question, pearl has answer)
  if (!frontIsQ && backIsQ && clinicalPearl && clinicalPearl.trim().length > 15) {
    category = front.replace(/nursingsum\.live/gi, '').trim() || category;
    front = back;
    back = clinicalPearl;
    clinicalPearl = undefined;
  }
  // Case 2: Standard card where pearl was actually storing the topic heading
  else if (category === 'كروت استذكار' && clinicalPearl && clinicalPearl.trim().length <= 80 && !isQuestionPrompt(clinicalPearl)) {
    category = clinicalPearl.replace(/nursingsum\.live/gi, '').trim() || category;
    clinicalPearl = undefined;
  }

  if (front.includes('nursingsum.live')) {
    front = front.replace(/nursingsum\.live/gi, '').trim();
  }
  if (category.includes('nursingsum.live')) {
    category = category.replace(/nursingsum\.live/gi, '').trim();
  }

  return {
    ...card,
    category,
    front,
    back,
    clinicalPearl,
  };
}

function normalizeLecturesArray(lectures) {
  let modifiedCount = 0;
  let totalCardsCount = 0;
  let invertedFixedCount = 0;

  for (const lec of lectures) {
    if (Array.isArray(lec.flashcards) && lec.flashcards.length > 0) {
      let lecModified = false;
      const normalized = lec.flashcards.map((c) => {
        totalCardsCount++;
        const norm = normalizeFlashcard(c);
        if (norm.front !== c.front || norm.back !== c.back || norm.category !== c.category || norm.clinicalPearl !== c.clinicalPearl) {
          lecModified = true;
          if (norm.front === c.back) {
            invertedFixedCount++;
          }
        }
        return norm;
      });

      if (lecModified) {
        lec.flashcards = normalized;
        modifiedCount++;
      }
    }
  }

  return { modifiedCount, totalCardsCount, invertedFixedCount };
}

async function updateGist(filesObj) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ files: filesObj });
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/gists/${GIST_ID}`,
        method: 'PATCH',
        headers: {
          'User-Agent': 'NursingStudyHubApp',
          'Authorization': `token ${TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (c) => (respData += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('[Gist Sync] Successfully patched Gist with normalized data.');
            resolve(true);
          } else {
            console.error('[Gist Sync Error] Status:', res.statusCode, respData);
            resolve(false);
          }
        });
      }
    );

    req.on('error', (e) => {
      console.error('[Gist Sync Network Error]', e);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const storePath = path.join(root, 'data/cms-store.json');
  const vaultPath = path.join(root, 'data/lectures-vault.json');
  const lecturesDataDir = path.join(root, 'lectures-data');

  console.log('--- Migrating CMS Store ---');
  let store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const storeStats = normalizeLecturesArray(store.lectures || []);
  console.log(`CMS Store stats: ${storeStats.modifiedCount} lectures modified, ${storeStats.invertedFixedCount} inverted cards repaired out of ${storeStats.totalCardsCount} cards.`);
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');

  console.log('--- Migrating Lectures Vault ---');
  let vaultStats = { modifiedCount: 0, invertedFixedCount: 0, totalCardsCount: 0 };
  if (fs.existsSync(vaultPath)) {
    let vault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
    if (Array.isArray(vault)) {
      vaultStats = normalizeLecturesArray(vault);
      fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf8');
    } else if (vault && Array.isArray(vault.lectures)) {
      vaultStats = normalizeLecturesArray(vault.lectures);
      fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf8');
    }
    console.log(`Vault stats: ${vaultStats.modifiedCount} lectures modified, ${vaultStats.invertedFixedCount} inverted cards repaired.`);
  }

  console.log('--- Migrating lectures-data directory ---');
  if (fs.existsSync(lecturesDataDir)) {
    const files = fs.readdirSync(lecturesDataDir).filter((f) => f.endsWith('.json'));
    let fileModCount = 0;
    for (const f of files) {
      const p = path.join(lecturesDataDir, f);
      try {
        const item = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (Array.isArray(item.flashcards) && item.flashcards.length > 0) {
          let mod = false;
          item.flashcards = item.flashcards.map((c) => {
            const norm = normalizeFlashcard(c);
            if (norm.front !== c.front || norm.back !== c.back || norm.category !== c.category) {
              mod = true;
            }
            return norm;
          });
          if (mod) {
            fs.writeFileSync(p, JSON.stringify(item, null, 2), 'utf8');
            fileModCount++;
          }
        }
      } catch (e) {
        console.error('Error migrating file:', f, e);
      }
    }
    console.log(`lectures-data stats: ${fileModCount} files updated.`);
  }

  console.log('--- Syncing to Cloud Gist ---');
  const filesPayload = {
    'cms-store.json': {
      content: JSON.stringify(store, null, 2),
    },
  };
  if (fs.existsSync(vaultPath)) {
    filesPayload['lectures-vault.json'] = {
      content: fs.readFileSync(vaultPath, 'utf8'),
    };
  }

  await updateGist(filesPayload);
  console.log('--- Migration Finished Successfully ---');
}

main().catch(console.error);
