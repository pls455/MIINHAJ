import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;
const projectId = 'minhaj-rules-test';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const db = (uid?: string) => uid
  ? testEnv.authenticatedContext(uid).firestore()
  : testEnv.unauthenticatedContext().firestore();

async function seedAdmin(uid: string, role: 'reviewer' | 'content_admin' | 'superadmin'): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'admins', uid), {
      email: `${uid}@example.test`,
      role,
      active: true,
    });
  });
}

describe('Firestore security rules', () => {
  it('allows public reads of public branches', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'branches/branch-a'), { name: 'A', active: true });
    });
    await assertSucceeds(getDoc(doc(db(), 'branches/branch-a')));
  });

  it('rejects unauthenticated writes to branches', async () => {
    await assertFails(setDoc(doc(db(), 'branches/branch-a'), { name: 'A', active: true }));
  });

  it('allows content_admin to create content', async () => {
    await seedAdmin('content-admin', 'content_admin');
    const ctx = db('content-admin');
    await assertSucceeds(setDoc(doc(ctx, 'resources/resource-a'), { title: 'Resource', active: true }));
  });

  it('rejects reviewer from changing resources', async () => {
    await seedAdmin('reviewer', 'reviewer');
    const ctx = db('reviewer');
    await assertFails(setDoc(doc(ctx, 'resources/resource-a'), { title: 'Resource' }));
  });

  it('allows superadmin to manage admins', async () => {
    await seedAdmin('superadmin', 'superadmin');
    const ctx = db('superadmin');
    await assertSucceeds(setDoc(doc(ctx, 'admins/admin-a'), { role: 'reviewer', active: true }));
  });

  it('rejects content_admin from managing admins', async () => {
    await seedAdmin('content-admin', 'content_admin');
    const ctx = db('content-admin');
    await assertFails(setDoc(doc(ctx, 'admins/admin-a'), { role: 'reviewer' }));
  });

  it('allows a validated suggestion submission but blocks oversized/unexpected writes', async () => {
    const ctx = db('student');
    await assertSucceeds(addDoc(collection(ctx, 'suggestions'), {
      title: 'Useful book',
      type: 'resource',
      url: 'https://example.com/book',
      status: 'pending',
      createdAt: serverTimestamp(),
    }));
    await assertFails(addDoc(collection(ctx, 'suggestions'), { title: 'x', status: 'approved', createdAt: serverTimestamp() }));
  });

  it('prevents ordinary users from writing admin logs', async () => {
    await assertFails(setDoc(doc(db('student'), 'adminLogs/log-a'), { action: 'delete' }));
  });

  it('rejects unknown collections by default', async () => {
    await assertFails(setDoc(doc(db(), 'unknown', 'record-a'), { value: true }));
  });
});
