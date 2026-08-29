import { db } from '../services/firebase.js';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit, getCountFromServer } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const configs = Object.freeze({
  branches: { label: 'الفرع', fields: ['name','description','icon','order','active'] },
  subjects: { label: 'المادة', fields: ['name','description','icon','order','active','branchIds'] },
  categories: { label: 'التصنيف', fields: ['name','description','icon','order','active','stableId'] }
});

export function getConfig(collectionName) {
  const config = configs[collectionName];
  if (!config) throw new Error('UNSUPPORTED_ADMIN_COLLECTION');
  return config;
}

function clean(input, collectionName) {
  const config = getConfig(collectionName);
  const data = {};
  for (const field of config.fields) {
    const value = input[field];
    if (field === 'order') data[field] = Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
    else if (field === 'active') data[field] = value !== false;
    else if (field === 'branchIds') data[field] = Array.isArray(value) ? [...new Set(value.map(String).map(v => v.trim()).filter(Boolean))] : [];
    else data[field] = String(value ?? '').trim();
  }
  if (!data.name) throw new Error('ADMIN_NAME_REQUIRED');
  if (collectionName === 'categories' && !data.stableId) throw new Error('CATEGORY_STABLE_ID_REQUIRED');
  return data;
}

export async function listAdminCollection(collectionName) {
  getConfig(collectionName);
  const snap = await getDocs(query(collection(db, collectionName), orderBy('order'), limit(100)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function countAdminCollection(collectionName) {
  getConfig(collectionName);
  return (await getCountFromServer(collection(db, collectionName))).data().count;
}

export async function saveAdminItem(collectionName, id, input) {
  const data = clean(input, collectionName);
  if (id) {
    await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
    await writeAdminLog({ action: 'update', collectionName, targetId: id, details: { name: data.name } });
    return id;
  }
  const result = await addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'create', collectionName, targetId: result.id, details: { name: data.name } });
  return result.id;
}

export async function removeAdminItem(collectionName, id) {
  getConfig(collectionName);
  await deleteDoc(doc(db, collectionName, id));
  await writeAdminLog({ action: 'delete', collectionName, targetId: id });
}
