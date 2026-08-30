import { db } from '../services/firebase.js';
import { collection, addDoc, getDoc, getDocs, updateDoc, doc, query, where, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export async function logAction(admin, action, targetCollection, targetId, details = '') {
  try {
    await addDoc(collection(db, 'adminLogs'), {
      adminUid: admin?.uid || '', adminEmail: admin?.email || '', role: admin?.role || '',
      action, collection: targetCollection, targetId: String(targetId || ''),
      details: String(details || ''), timestamp: serverTimestamp(), createdAt: serverTimestamp()
    });
  } catch (e) { console.error('[adminLogs]', e); }
}

export async function updateStatus(collectionName, id, status, admin) {
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw Error('العنصر المطلوب غير موجود.');
  const current = snap.data();
  if (collectionName === 'sourceRegistry') {
    const cycle = { pending_review: 'approved', approved: 'rejected', rejected: 'pending_review', pending: 'approved' };
    const next = cycle[current.status] || (status === 'approved' ? 'approved' : status);
    if (next === 'approved') {
      const existing = await getDocs(query(collection(db, 'resources'), where('url', '==', current.url || ''), limit(1)));
      if (current.url && !existing.empty) throw Error('هذا المصدر موجود مسبقًا ضمن المصادر المنشورة.');
      if (!current.url || !current.name || !current.subjectId || !Array.isArray(current.branchIds) || !current.branchIds.length) throw Error('لا يمكن اعتماد المصدر قبل اكتمال العنوان والرابط والفرع والمادة.');
      const published = await addDoc(collection(db, 'resources'), {
        title: current.name, url: current.url, description: current.description || '',
        type: current.type || current.mimeType || 'resource', subjectId: current.subjectId,
        categoryId: current.categoryId || '', branchIds: current.branchIds,
        keywords: Array.isArray(current.keywords) ? current.keywords : [],
        tags: Array.isArray(current.tags) ? current.tags : [], author: current.author || '',
        order: Number(current.order) || 0, active: true,
        sourceId: current.sourceId || current.id || id, provider: current.provider || 'google_drive',
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      await updateDoc(ref, { status: 'published', needsReview: false, publishedResourceId: published.id, publishedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await logAction(admin, 'publish', collectionName, id, `نشر المصدر ${published.id}`);
      return;
    }
    await updateDoc(ref, { status: next, needsReview: next !== 'rejected', updatedAt: serverTimestamp() });
    await logAction(admin, `status:${next}`, collectionName, id, next);
    return;
  }
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  await logAction(admin, `status:${status}`, collectionName, id, status);
}
