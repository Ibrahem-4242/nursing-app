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

export async function parseAnkiPackage(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<Flashcard[]> {
  try {
    const zip = await JSZip.loadAsync(buffer);

    // Look for collection.anki2 or collection.anki21
    let dbFile = zip.file('collection.anki2');
    if (!dbFile) {
      dbFile = zip.file('collection.anki21');
    }
    if (!dbFile) {
      // Search for any file matching collection.anki
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

    // Initialize SQL.js WebAssembly
    const SQL = await initSqlJs();
    const db = new SQL.Database(dbBytes);

    // Query notes table
    let results: Array<{ columns: string[]; values: any[][] }> = [];
    try {
      results = db.exec('SELECT flds, tags FROM notes ORDER BY id ASC;');
    } catch {
      // If tags column doesn't exist, try flds only
      results = db.exec('SELECT flds FROM notes ORDER BY id ASC;');
    }

    if (!results || results.length === 0 || !results[0].values) {
      throw new Error('قاعدة بيانات Anki فارغة أو لا تحتوي على بطاقات');
    }

    const cards: Flashcard[] = [];
    const rows = results[0].values;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fldsRaw = String(row[0] || '');
      const tagsRaw = row[1] ? String(row[1]) : '';

      // Fields in Anki are delimited by \x1f (Unit Separator)
      const fields = fldsRaw.split('\x1f');
      const frontRaw = fields[0] || '';
      const backRaw = fields[1] || '';
      const pearlRaw = fields[2] || '';

      const front = cleanHtmlText(frontRaw);
      const back = cleanHtmlText(backRaw);
      const clinicalPearl = pearlRaw ? cleanHtmlText(pearlRaw) : undefined;

      // Extract category from tags or default
      let category = 'مفاهيم تمريضية';
      if (tagsRaw) {
        const cleanTags = tagsRaw.trim().replace(/^_+|_+$/g, '');
        if (cleanTags) {
          category = cleanTags.split(/\s+/)[0] || category;
        }
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

    return cards;
  } catch (err: any) {
    console.error('[AnkiParser] Error parsing .apkg:', err);
    throw new Error(err.message || 'فشل استخراج البطاقات من حزمة Anki');
  }
}
