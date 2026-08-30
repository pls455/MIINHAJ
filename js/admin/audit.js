import { db } from '../services/firebase.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export async function logAction(admin, action, targetCollection, targetId, details = '') {
  try {
    await addDoc(collection(db, 'adminLogs'), {
      adminUid: admin?.uid || '', adminEmail: admin?.email || '', role: admin?.role || '',
      action, collection: targetCollection, targetId: String(targetId || ''),
      details: String(details || ''), timestamp: serverTimestamp(), createdAt: serverTimestamp()
    });
  } catch (e) { console.error('[adminLogs]', e); }
}

// Status transitions belong to feature repositories. This helper only logs the action,
// preventing the generic admin layer from writing fields that differ between workflows.
export async function updateStatus(collectionName, id, status, admin) {
  await logAction(admin, `status:${status}`, collectionName, id, status);
}
