import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../firebase.js';
import { currentAdmin } from '../auth.js';

export async function writeAdminLog({ action, collectionName, targetId, details = {} }) {
  const admin = await currentAdmin();
  if (!admin) throw new Error('UNAUTHORIZED_ADMIN');
  await addDoc(collection(db, 'adminLogs'), {
    adminUid: admin.uid,
    adminEmail: admin.email || '',
    role: admin.role,
    action,
    collection: collectionName,
    targetId: targetId || null,
    details,
    timestamp: serverTimestamp()
  });
}
