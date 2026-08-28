import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';

const app = getApps()[0] ?? initializeApp();
const db = getFirestore(app);

const COLLECTIONS = [
  'resources',
  'foundations',
  'subjects',
  'categories',
  'branches',
  'solutions',
  'flashcards',
  'templates',
] as const;

const PAGE_SIZE = 100;
const WRITE_BATCH_SIZE = 400;

function normalizeArabic(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sourceText(data: FirebaseFirestore.DocumentData): string {
  const fields = ['title', 'name', 'description', 'content', 'question', 'answer'];
  return fields
    .map((field) => data[field])
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
}

async function migrateCollection(collectionName: string): Promise<{ scanned: number; updated: number; skipped: number }> {
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  while (true) {
    let query = db.collection(collectionName).orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
    if (last) query = query.startAfter(last);
    const snapshot = await query.get();
    if (snapshot.empty) break;

    let batch = db.batch();
    let writes = 0;
    for (const doc of snapshot.docs) {
      scanned += 1;
      const data = doc.data();
      const normalized = normalizeArabic(sourceText(data));
      if (!normalized) {
        skipped += 1;
        continue;
      }
      if (data.searchNormalized === normalized) {
        skipped += 1;
        continue;
      }
      batch.update(doc.ref, { searchNormalized: normalized });
      updated += 1;
      writes += 1;

      if (writes >= WRITE_BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        writes = 0;
      }
    }
    if (writes > 0) await batch.commit();
    last = snapshot.docs[snapshot.docs.length - 1];
    console.log(`${collectionName}: scanned=${scanned} updated=${updated} skipped=${skipped}`);
  }

  return { scanned, updated, skipped };
}

async function main(): Promise<void> {
  console.log('Starting non-destructive searchNormalized migration.');
  const totals = { scanned: 0, updated: 0, skipped: 0 };
  for (const collection of COLLECTIONS) {
    const result = await migrateCollection(collection);
    totals.scanned += result.scanned;
    totals.updated += result.updated;
    totals.skipped += result.skipped;
  }
  console.log(`Completed. scanned=${totals.scanned} updated=${totals.updated} skipped=${totals.skipped}`);
}

main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
