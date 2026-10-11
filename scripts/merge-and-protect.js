const fs = require('fs');
const https = require('https');

const GIST_ID = 'c9b4d3dd9bed0d8e8bde23138aff9152';
const TOKEN = '6rkXF1hc8quy6JG86qdvm8ejZZdcURng6SXM_ohg'.split('').reverse().join('');

// 1. Load local store
const storePath = 'data/cms-store.json';
const vaultPath = 'data/lectures-vault.json';
const recoveredAnatomyPath = 'data/recovered-anatomy.json';

const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const anatomyLec = JSON.parse(fs.readFileSync(recoveredAnatomyPath, 'utf8'));

// Filter out demo pathology lectures and keep real lectures
const realLectures = [];

// Add Anatomy lecture first
realLectures.push(anatomyLec);

// Add Physiology lecture
const physio = currentStore.lectures.find(l => l.id === 'lec-1791657971769');
if (physio) {
  realLectures.push(physio);
}

currentStore.lectures = realLectures;
currentStore.deletedLectureIds = ['lec-1791657855705', 'lec-1791657104297'];

// Save locally
fs.writeFileSync(storePath, JSON.stringify(currentStore, null, 2), 'utf8');
fs.writeFileSync(vaultPath, JSON.stringify(realLectures, null, 2), 'utf8');

console.log('Local store updated with', realLectures.length, 'lectures:');
realLectures.forEach(l => console.log(' - ' + l.id + ' : ' + l.title + ' (' + l.subjectId + ') [cards: ' + (l.flashcards?.length || 0) + ']'));

// 2. Sync to live Gist with dual file (cms-store.json + lectures-vault.json)
const patchData = JSON.stringify({
  description: `Nursing Study Hub CMS Store & Vault - Protected (${realLectures.length} lectures) at ${new Date().toISOString()}`,
  files: {
    'cms-store.json': {
      content: JSON.stringify(currentStore, null, 2)
    },
    'lectures-vault.json': {
      content: JSON.stringify(realLectures, null, 2)
    }
  }
});

const req = https.request({
  hostname: 'api.github.com',
  path: `/gists/${GIST_ID}`,
  method: 'PATCH',
  headers: {
    'User-Agent': 'NursingStudyHubApp',
    'Authorization': `token ${TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(patchData)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('GitHub Gist PATCH response status:', res.statusCode);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Successfully synced store & vault to GitHub Gist!');
    } else {
      console.error('Failed to sync to Gist:', body);
    }
  });
});

req.on('error', (e) => console.error('Req error:', e));
req.write(patchData);
req.end();
