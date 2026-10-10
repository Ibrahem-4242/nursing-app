import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import { Flashcard } from './types';

function cleanHtmlText(html: string): string {
  if (!html) return '';

  return html
    // Remove style and script blocks
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Convert breaks and divs to line breaks
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Unescape common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

let sqlPromise: Promise<any> | null = null;

async function getSqlInstance(): Promise<any> {
  if (sqlPromise) return sqlPromise;

  sqlPromise = (async () => {
    // 1. In Node.js / Serverless environment
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const candidatePaths = [
          path.join(process.cwd(), 'public', 'sql-wasm.wasm'),
          path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
        ];
        for (const p of candidatePaths) {
          if (fs.existsSync(p)) {
            const wasmBinary = fs.readFileSync(p);
            return await initSqlJs({ wasmBinary });
          }
        }
      } catch (e) {
        console.warn('[AnkiParser] Local wasm load failed, attempting network fetch:', e);
      }

      // Fallback: fetch from CDN
      try {
        const res = await fetch('https://sql.js.org/dist/sql-wasm.wasm');
        if (res.ok) {
          const wasmBinary = new Uint8Array(await res.arrayBuffer());
          return await initSqlJs({ wasmBinary });
        }
      } catch (fetchErr) {
        console.warn('[AnkiParser] CDN wasm fetch failed:', fetchErr);
      }
    } else {
      // 2. In Browser environment
      try {
        return await initSqlJs({
          locateFile: () => '/sql-wasm.wasm',
        });
      } catch {
        return await initSqlJs({
          locateFile: (file) => `https://sql.js.org/dist/${file}`,
        });
      }
    }

    return await initSqlJs();
  })();

  return sqlPromise;
}

// Fallback pure JS SQLite B-Tree reader for notes table
function readVarint(buf: Uint8Array, offset: number) {
  let res = 0;
  let bytesRead = 0;
  for (let i = 0; i < 9; i++) {
    const byte = buf[offset + i];
    bytesRead++;
    if (i === 8) {
      res = (res << 8) | byte;
      break;
    }
    res = (res << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) break;
  }
  return { val: res, bytesRead };
}

function parseSqliteFallback(dbBytes: Uint8Array): Flashcard[] {
  try {
    const pageSize = (dbBytes[16] << 8) | dbBytes[17] || 65536;
    const numPages = Math.floor(dbBytes.length / pageSize);
    const cards: Flashcard[] = [];
    let cardId = 1;

    for (let p = 0; p < numPages; p++) {
      const pageStart = p * pageSize;
      const pageType = dbBytes[pageStart];
      if (pageType === 0x0d) {
        const cellCount = (dbBytes[pageStart + 3] << 8) | dbBytes[pageStart + 4];
        for (let c = 0; c < cellCount; c++) {
          const ptr = pageStart + 8 + c * 2;
          const cellOffset = pageStart + ((dbBytes[ptr] << 8) | dbBytes[ptr + 1]);
          if (cellOffset >= dbBytes.length) continue;

          let cur = cellOffset;
          const payloadVar = readVarint(dbBytes, cur);
          cur += payloadVar.bytesRead;
          const rowidVar = readVarint(dbBytes, cur);
          cur += rowidVar.bytesRead;

          const recordStart = cur;
          const headerLenVar = readVarint(dbBytes, cur);
          cur += headerLenVar.bytesRead;
          const headerEnd = recordStart + headerLenVar.val;

          const colTypes: number[] = [];
          while (cur < headerEnd && cur < dbBytes.length) {
            const typeVar = readVarint(dbBytes, cur);
            cur += typeVar.bytesRead;
            colTypes.push(typeVar.val);
          }

          const cols: any[] = [];
          let bodyOffset = headerEnd;
          for (const st of colTypes) {
            if (st === 0) {
              cols.push(null);
            } else if (st === 1) {
              cols.push(dbBytes[bodyOffset]);
              bodyOffset += 1;
            } else if (st === 2) {
              cols.push((dbBytes[bodyOffset] << 8) | dbBytes[bodyOffset + 1]);
              bodyOffset += 2;
            } else if (st >= 12 && st % 2 === 0) {
              const len = (st - 12) / 2;
              bodyOffset += len;
              cols.push(null);
            } else if (st >= 13 && st % 2 === 1) {
              const len = (st - 13) / 2;
              const slice = dbBytes.subarray(bodyOffset, bodyOffset + len);
              const str = new TextDecoder('utf-8').decode(slice);
              cols.push(str);
              bodyOffset += len;
            } else {
              bodyOffset += st === 3 ? 3 : st === 4 ? 4 : st === 5 ? 6 : st === 6 ? 8 : st === 7 ? 8 : 0;
              cols.push(null);
            }
          }

          // In notes table, flds has \x1f
          let fldsCol: string | null = null;
          let tagsCol: string | null = null;
          for (let i = 0; i < cols.length; i++) {
            const val = cols[i];
            if (typeof val === 'string' && val.includes('\x1f')) {
              if (!val.trim().startsWith('{') && !val.includes('"css":')) {
                fldsCol = val;
                if (i > 0 && typeof cols[i - 1] === 'string') tagsCol = cols[i - 1];
                break;
              }
            }
          }

          if (fldsCol) {
            const parts = fldsCol.split('\x1f');
            const front = cleanHtmlText(parts[0] || '');
            const back = cleanHtmlText(parts[1] || '');
            const pearl = cleanHtmlText(parts[2] || '');

            let category = 'كروت استذكار';
            if (tagsCol && tagsCol.trim()) {
              category = cleanHtmlText(tagsCol).split(/\s+/)[0] || category;
            } else if (pearl && pearl.length < 60) {
              category = pearl;
            }

            if (front || back) {
              cards.push({
                id: cardId++,
                front: front || `سؤال ${cardId}`,
                back: back || 'لا توجد إجابة مسجلة',
                category,
                clinicalPearl: pearl && pearl !== category ? pearl : undefined,
              });
            }
          }
        }
      }
    }
    return cards;
  } catch (e) {
    console.warn('[AnkiParser] Fallback SQLite parsing error:', e);
    return [];
  }
}

export async function parseAnkiPackage(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<Flashcard[]> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);

  // 1. Check if the file is plain JSON
  try {
    const text = new TextDecoder('utf-8').decode(bytes);
    const trimmed = text.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: idx + 1,
          front: cleanHtmlText(item.front || item.question || item.q || `سؤال ${idx + 1}`),
          back: cleanHtmlText(item.back || item.answer || item.a || 'الإجابة'),
          category: item.category || 'كروت استذكار',
          clinicalPearl: item.clinicalPearl || item.pearl || undefined,
        }));
      }
    }
  } catch {}

  // 2. Try parsing as Anki .apkg (ZIP + SQLite)
  try {
    const zip = await JSZip.loadAsync(bytes);

    let dbFile = zip.file('collection.anki2');
    if (!dbFile) {
      dbFile = zip.file('collection.anki21');
    }
    if (!dbFile) {
      const match = Object.keys(zip.files).find((name) =>
        name.toLowerCase().includes('collection.anki')
      );
      if (match) {
        dbFile = zip.file(match);
      }
    }

    if (!dbFile) {
      throw new Error('لم يتم العثور على قاعدة بيانات Anki (collection.anki2) داخل الحزمة');
    }

    const dbBytes = await dbFile.async('uint8array');

    // Attempt 1: Full SQL.js WebAssembly Engine
    try {
      const SQL = await getSqlInstance();
      const db = new SQL.Database(dbBytes);

      let results: Array<{ columns: string[]; values: any[][] }> = [];
      try {
        results = db.exec('SELECT flds, tags FROM notes ORDER BY id ASC;');
      } catch {
        results = db.exec('SELECT flds FROM notes ORDER BY id ASC;');
      }

      if (results && results.length > 0 && results[0].values && results[0].values.length > 0) {
        const cards: Flashcard[] = [];
        const rows = results[0].values;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const fldsRaw = String(row[0] || '');
          const tagsRaw = row[1] ? String(row[1]) : '';

          const fields = fldsRaw.split('\x1f');
          const frontRaw = fields[0] || '';
          const backRaw = fields[1] || '';
          const pearlRaw = fields[2] || '';

          const front = cleanHtmlText(frontRaw);
          const back = cleanHtmlText(backRaw);
          const clinicalPearl = pearlRaw ? cleanHtmlText(pearlRaw) : undefined;

          let category = 'كروت استذكار';
          if (tagsRaw) {
            const cleanTags = tagsRaw.trim().replace(/^_+|_+$/g, '');
            if (cleanTags) {
              category = cleanTags.split(/\s+/)[0] || category;
            }
          } else if (clinicalPearl && clinicalPearl.length < 60) {
            category = clinicalPearl;
          }

          if (front || back) {
            cards.push({
              id: i + 1,
              front: front || `سؤال ${i + 1}`,
              back: back || 'لا توجد إجابة مسجلة',
              category,
              clinicalPearl: clinicalPearl || undefined,
            });
          }
        }

        if (cards.length > 0) {
          return cards;
        }
      }
    } catch (sqlErr) {
      console.warn('[AnkiParser] sql.js engine failed, trying pure JS fallback:', sqlErr);
    }

    // Attempt 2: Pure JS SQLite Parser Fallback
    const fallbackCards = parseSqliteFallback(dbBytes);
    if (fallbackCards.length > 0) {
      return fallbackCards;
    }

    throw new Error('قاعدة بيانات Anki فارغة أو لا تحتوي على بطاقات');
  } catch (err: any) {
    console.error('[AnkiParser] Error parsing .apkg:', err);
    throw new Error(err.message || 'فشل استخراج البطاقات من حزمة Anki');
  }
}
