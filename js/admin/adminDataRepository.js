import { db } from '../services/firebase.js';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit, getCountFromServer } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const MAX_LIST = 100;
const MAX_NAME = 200;
const MAX_DESCRIPTION = 2000;
const STABLE_ID_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/;

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
    else if (field === 'branchIds') data[field] = Array.isArray(value) ? [...new Set(value.map(v => String(v).trim()).filter(Boolean))].slice(0, 100) : [];
    else data[field] = String(value ?? '').trim();
  }
  if (!data.name) throw new Error('ADMIN_NAME_REQUIRED');
  if (data.name.length > MAX_NAME) throw new Error('ADMIN_NAME_TOO_LONG');
  if (data.description.length > MAX_DESCRIPTION) throw new Error('ADMIN_DESCRIPTION_TOO_LONG');
  if (collectionName === 'categories') {
    if (!data.stableId) throw new Error('CATEGORY_STABLE_ID_REQUIRED');
    if (!STABLE_ID_RE.test(data.stableId)) throw new Error('CATEGORY_STABLE_ID_INVALID');
  }
  return data;
}

async function ensureCategoryStableIdUnique(stableId, exceptId = null) {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('stableId'), limit(MAX_LIST)));
  if (snap.docs.some(d => d.id !== exceptId && String(d.data().stableId || '') === stableId)) throw new Error('CATEGORY_STABLE_ID_DUPLICATE');
}

export async function listAdminCollection(collectionName) {
  getConfig(collectionName);
  const snap = await getDocs(query(collection(db, collectionName), orderBy('order'), limit(MAX_LIST)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function countAdminCollection(collectionName) {
  getConfig(collectionName);
  return (await getCountFromServer(collection(db, collectionName))).data().count;
}

export async function saveAdminItem(collectionName, id, input) {
  const data = clean(input, collectionName);
  if (collectionName === 'categories') await ensureCategoryStableIdUnique(data.stableId, id || null);
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
