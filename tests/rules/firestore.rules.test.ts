import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';

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

const db = (uid?: string, claims?: Record<string, unknown>) =>
  uid ? testEnv.authenticatedContext(uid, claims).firestore() : testEnv.unauthenticatedContext().firestore();

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
    const ctx = db('content-admin', { role: 'content_admin' });
    await assertSucceeds(setDoc(doc(ctx, 'resources/resource-a'), { title: 'Resource', active: true }));
  });

  it('rejects reviewer from changing resources', async () => {
    const ctx = db('reviewer', { role: 'reviewer' });
    await assertFails(setDoc(doc(ctx, 'resources/resource-a'), { title: 'Resource' }));
  });

  it('allows superadmin to manage admins', async () => {
    const ctx = db('superadmin', { role: 'superadmin' });
    await assertSucceeds(setDoc(doc(ctx, 'admins/admin-a'), { role: 'reviewer', active: true }));
  });

  it('rejects content_admin from managing admins', async () => {
    const ctx = db('content-admin', { role: 'content_admin' });
    await assertFails(setDoc(doc(ctx, 'admins/admin-a'), { role: 'reviewer' }));
  });

  it('allows a validated suggestion submission but blocks oversized/unexpected writes', async () => {
    const ctx = db('student');
    await assertSucceeds(addDoc(collection(ctx, 'suggestions'), {
      title: 'Useful book',
      type: 'resource',
      url: 'https://example.com/book',
      status: 'pending',
    }));
    await assertFails(addDoc(collection(ctx, 'suggestions'), { title: 'x', status: 'approved' }));
  });

  it('prevents ordinary users from writing admin logs', async () => {
    await assertFails(setDoc(doc(db('student'), 'adminLogs/log-a'), { action: 'delete' }));
  });

  it('rejects unknown collections by default', async () => {
    await assertFails(setDoc(doc(db('unknown/record-a')), { value: true }));
  });
});
