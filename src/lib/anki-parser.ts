import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import { Flashcard } from './types';
import { cleanLatexMath } from './text-cleaner';


export function isQuestionPrompt(text?: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.includes('؟') || t.includes('?') || t.includes('_____') || t.includes('.....')) return true;
  return /^(ما\s|كيف\s|لماذا\s|ماذا\s|اذكر\s|قارن\s|علل\s|لخص\s|رتب\s|حدد\s|مِمَّ\s|هل\s|إلى\sكم\s|كم\s|اشرح\s|بين\s|وضح\s|صف\s|عرف\s|أكمل\s|What\s|How\s|Why\s|Which\s|Define\s|Compare\s|Explain\s|List\s|Describe\s)/i.test(t);
}

export function splitCombinedQuestionAndAnswer(text?: string): { question: string; answer: string; pearl?: string } | null {
  if (!text) return null;
  const t = text.trim();
  if (t.length < 5) return null;

  // Check for exam pearl inside answer
  let mainText = t;
  let pearl: string | undefined = undefined;
  const pearlMarkerRegex = /(?:(?:\r?\n|^)\s*(?:💡\s*)?(?:فكرة\s+البطاقة\s+الجوهرية|نقطة\s+تركيز\s+للامتحان|معلومة\s+للامتحان|Exam\s*Pearl|Key\s*Idea)\s*[:：\-–]\s*)([\s\S]+)$/i;
  const pearlMatch = mainText.match(pearlMarkerRegex);
  if (pearlMatch && pearlMatch.index !== undefined) {
    pearl = pearlMatch[1].trim();
    mainText = mainText.substring(0, pearlMatch.index).trim();
  }

  // Pattern 1: Explicit labels like "السؤال: ... الجواب: ..." or "• السؤال: ... • الجواب: ..."
  const answerMarkerRegex = /(?:(?:\r?\n|^)\s*(?:•\s*)?(?:الجواب(?:\s+الصحيح)?|الإجابة(?:\s+النموذجية|\s+الصحيحة)?|الحل|الرد|Answer|Ans)\s*[:：\-–]\s*)/i;
  const match = mainText.match(answerMarkerRegex);
  if (match && match.index !== undefined) {
    const qPart = mainText.substring(0, match.index)
      .replace(/^(?:•\s*)?(?:السؤال|س|Question|Q)\s*[:：\-–]\s*/i, '')
      .trim();
    const aPart = mainText.substring(match.index + match[0].length).trim();
    if (qPart && aPart) {
      return { question: qPart, answer: aPart, pearl };
    }
  }

  // Pattern 2: Question mark followed by newline
  const qMarkNewlineMatch = mainText.match(/([؟?])(?:\r?\n+)/);
  if (qMarkNewlineMatch && qMarkNewlineMatch.index !== undefined) {
    const splitIndex = qMarkNewlineMatch.index + 1;
    const qPart = mainText.substring(0, splitIndex)
      .replace(/^(?:•\s*)?(?:السؤال|س|Question|Q)\s*[:：\-–]\s*/i, '')
      .trim();
    const aPart = mainText.substring(splitIndex).trim();
    if (qPart && aPart) {
      return { question: qPart, answer: aPart, pearl };
    }
  }

  // Pattern 3: Question mark with space and answer text
  const qMarkMatch = mainText.match(/([؟?])\s+([\s\S]+)$/);
  if (qMarkMatch && qMarkMatch.index !== undefined) {
    const splitIndex = qMarkMatch.index + 1;
    const qPart = mainText.substring(0, splitIndex)
      .replace(/^(?:•\s*)?(?:السؤال|س|Question|Q)\s*[:：\-–]\s*/i, '')
      .trim();
    const aPart = mainText.substring(splitIndex).trim();
    if (qPart && aPart && aPart.length >= 3) {
      return { question: qPart, answer: aPart, pearl };
    }
  }

  // Pattern 4: First line starts with a question prompt (e.g. اذكر/علل/قارن/صف) and there are multiple lines
  const lines = mainText.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const firstLine = lines[0].replace(/^(?:•\s*)?(?:السؤال|س|Question|Q)\s*[:：\-–]\s*/i, '').trim();
    if (isQuestionPrompt(firstLine)) {
      const remaining = lines.slice(1).join('\n').trim();
      if (remaining) {
        return { question: firstLine, answer: remaining, pearl };
      }
    }
  }

  return null;
}

export function buildFlashcardFromFields(
  id: number,
  fields: string[],
  tags?: string
): Flashcard | null {
  const f0 = cleanHtmlText(fields[0] || '');
  const f1 = cleanHtmlText(fields[1] || '');
  const f2 = cleanHtmlText(fields[2] || '');
  const f3 = cleanHtmlText(fields[3] || '');

  if (!f0 && !f1) return null;

  let category = 'كروت استذكار';
  if (tags && tags.trim()) {
    const cleanTags = tags.trim().replace(/^_+|_+$/g, '');
    if (cleanTags) {
      category = cleanTags.split(/\s+/)[0] || category;
    }
  }

  let front = f0;
  let back = f1;
  let clinicalPearl: string | undefined = f2 || undefined;

  // 1. 4-Field or 3-Field Smart Detection:
  // If field 0 is a topic heading (e.g., 'طبقات الجسم واللفافة') and field 1 is the question (e.g. 'ما هو الترتيب...؟') and field 2 is the detailed answer:
  if (fields.length >= 3 && !isQuestionPrompt(f0) && isQuestionPrompt(f1) && f2 && f2.length > 5) {
    category = f0.replace(/nursingsum\.live/gi, '').trim() || category;
    front = f1;
    back = f2;
    clinicalPearl = f3 || undefined;
  }
  // 2. 3-Field where field 0 is question, field 1 is answer, field 2 is topic
  else if (fields.length >= 3 && isQuestionPrompt(f0) && !isQuestionPrompt(f2) && f2.length <= 100) {
    front = f0;
    back = f1;
    category = f2.replace(/nursingsum\.live/gi, '').trim() || category;
    clinicalPearl = f3 || undefined;
  }
  // 3. Fallback when tags not present and clinicalPearl was storing category
  else if (!tags && clinicalPearl && clinicalPearl.length <= 100 && !isQuestionPrompt(clinicalPearl)) {
    category = clinicalPearl.replace(/nursingsum\.live/gi, '').trim() || category;
    clinicalPearl = undefined;
  }

  return normalizeFlashcard({
    id,
    front: front || `سؤال ${id}`,
    back: back || 'لا توجد إجابة مسجلة',
    category,
    clinicalPearl,
  });
}

export function normalizeFlashcard(card: Flashcard): Flashcard {
  if (!card) return card;

  let category = card.category || 'كروت استذكار';
  let front = (card.front || '').trim();
  let back = (card.back || '').trim();
  let clinicalPearl = card.clinicalPearl?.trim();

  const frontIsQ = isQuestionPrompt(front);
  const backIsQ = isQuestionPrompt(back);

  // Case 1: Inverted 3-field card (front has topic, back has question, pearl has answer)
  if (!frontIsQ && backIsQ && clinicalPearl && clinicalPearl.length > 0) {
    category = front.replace(/nursingsum\.live/gi, '').trim() || category;
    front = back;
    back = clinicalPearl;
    clinicalPearl = undefined;
  }
  // Case 2: 2-field card where front is Topic and back has BOTH Question and Answer!
  else if (!frontIsQ && (!clinicalPearl || clinicalPearl.length === 0)) {
    const split = splitCombinedQuestionAndAnswer(back);
    if (split) {
      category = front.replace(/nursingsum\.live/gi, '').trim() || category;
      front = split.question;
      back = split.answer;
      if (split.pearl) clinicalPearl = split.pearl;
    } else if (backIsQ && front.length > 50) {
      // Inverted 2-field card: front was answer, back was question!
      const temp = front;
      front = back;
      back = temp;
    }
  }
  // Case 3: 2-field card where front has BOTH Question and Answer, and back has Topic!
  else if (!backIsQ && (!clinicalPearl || clinicalPearl.length === 0)) {
    const split = splitCombinedQuestionAndAnswer(front);
    if (split && back.length <= 100) {
      category = back.replace(/nursingsum\.live/gi, '').trim() || category;
      front = split.question;
      back = split.answer;
      if (split.pearl) clinicalPearl = split.pearl;
    }
  }
  // Case 4: Standard card where pearl was actually storing the topic heading
  else if (category === 'كروت استذكار' && clinicalPearl && clinicalPearl.length <= 100 && !isQuestionPrompt(clinicalPearl)) {
    category = clinicalPearl.replace(/nursingsum\.live/gi, '').trim() || category;
    clinicalPearl = undefined;
  }
  // Case 5: Front has explicit "السؤال: ... \n الجواب: ..." combined in front, and back has nothing or topic
  else if (frontIsQ && (!back || back.length < 5)) {
    const split = splitCombinedQuestionAndAnswer(front);
    if (split) {
      front = split.question;
      back = split.answer;
      if (split.pearl) clinicalPearl = split.pearl;
    }
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

function cleanHtmlText(html: string): string {
  if (!html) return '';

  const raw = html
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

  return cleanLatexMath(raw);
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
            const card = buildFlashcardFromFields(cardId++, parts, tagsCol || undefined);
            if (card) {
              cards.push(card);
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
        return parsed.map((item: any, idx: number) => {
          const raw: Flashcard = {
            id: idx + 1,
            front: cleanHtmlText(item.front || item.question || item.q || `سؤال ${idx + 1}`),
            back: cleanHtmlText(item.back || item.answer || item.a || 'الإجابة'),
            category: item.category || 'كروت استذكار',
            clinicalPearl: item.clinicalPearl || item.pearl || undefined,
          };
          return normalizeFlashcard(raw);
        });
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
          const card = buildFlashcardFromFields(i + 1, fields, tagsRaw);
          if (card) {
            cards.push(card);
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
