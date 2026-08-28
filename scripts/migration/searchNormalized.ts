import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';

const app = getApps()[0] ?? initializeApp();
const db = getFirestore(app);

export const COLLECTIONS = ['resources', 'foundations', 'subjects', 'categories', 'branches', 'solutions', 'flashcards', 'templates'] as const;
const PAGE_SIZE = 100;
const WRITE_BATCH_SIZE = 400;

export function normalizeArabic(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ar').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ـ/g, '').replace(/\s+/g, ' ').trim();
}

export function sourceText(data: FirebaseFirestore.DocumentData): string {
  return ['title', 'name', 'description', 'content', 'question', 'answer'].map((field) => data[field]).filter((value): value is string => typeof value === 'string').join(' ');
}

export interface MigrationOptions { dryRun: boolean; collections?: readonly string[] }
export interface MigrationResult { scanned: number; updated: number; skipped: number }

export async function migrateCollection(collectionName: string, options: MigrationOptions): Promise<MigrationResult> {
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  const result: MigrationResult = { scanned: 0, updated: 0, skipped: 0 };
  while (true) {
    let query = db.collection(collectionName).orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
    if (last) query = query.startAfter(last);
    const snapshot = await query.get();
    if (snapshot.empty) break;
    let batch = db.batch(); let writes = 0;
    for (const doc of snapshot.docs) {
      result.scanned++;
      const normalized = normalizeArabic(sourceText(doc.data()));
      if (!normalized || doc.data().searchNormalized === normalized) { result.skipped++; continue; }
      result.updated++;
      if (!options.dryRun) { batch.update(doc.ref, { searchNormalized: normalized }); writes++; if (writes >= WRITE_BATCH_SIZE) { await batch.commit(); batch = db.batch(); writes = 0; } }
    }
    if (!options.dryRun && writes) await batch.commit();
    last = snapshot.docs[snapshot.docs.length - 1];
  }
  return result;
}

export async function runMigration(options: MigrationOptions): Promise<Record<string, MigrationResult>> {
  const results: Record<string, MigrationResult> = {};
  for (const collection of options.collections ?? COLLECTIONS) results[collection] = await migrateCollection(collection, options);
  return results;
}

const dryRun = process.argv.includes('--dry-run');
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration({ dryRun }).then((results) => { console.log(JSON.stringify({ dryRun, results }, null, 2)); }).catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
