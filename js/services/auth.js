import { auth, db } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export const ROLE_LEVEL = Object.freeze({
  reviewer: 1,
  content_admin: 2,
  superadmin: 3,
  super_admin: 3,
  admin: 3
});

export function level(role) {
  return ROLE_LEVEL[role] || 0;
}

export function can(role, requiredRole) {
  return level(role) >= level(requiredRole);
}

export async function currentAdmin(user = auth.currentUser) {
  if (!user) return null;
  const snapshot = await getDoc(doc(db, 'admins', user.uid));
  if (!snapshot.exists() || snapshot.data().active !== true) return null;
  const data = snapshot.data();
  const rawRole = data.role || 'reviewer';
  const role = rawRole === 'super_admin' || rawRole === 'admin' ? 'superadmin' : rawRole;
  return { uid: user.uid, email: user.email || data.email || '', role };
}

export async function requireAdmin(requiredRole = 'reviewer') {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('AUTH_REQUIRED');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }
  const admin = await currentAdmin(user);
  if (!admin || !can(admin.role, requiredRole)) {
    const error = new Error('INSUFFICIENT_PERMISSIONS');
    error.code = 'INSUFFICIENT_PERMISSIONS';
    throw error;
  }
  return admin;
}

export function watchAuth(callback) { return onAuthStateChanged(auth, callback); }
export function login(email, password) { return signInWithEmailAndPassword(auth, email, password); }
export function logout() { return signOut(auth); }
