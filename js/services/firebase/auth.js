import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { auth, db } from "./firebase.js";

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export async function getCurrentAdmin(user = auth.currentUser) {
  if (!user) return null;
  const snapshot = await getDoc(doc(db, "admins", user.uid));
  if (!snapshot.exists()) return null;
  return { uid: snapshot.id, ...snapshot.data() };
}

export async function requireAuthenticatedAdmin() {
  const user = auth.currentUser;
  if (!user) throw new Error("AUTH_REQUIRED");
  const admin = await getCurrentAdmin(user);
  if (!admin?.active) throw new Error("ADMIN_ACCESS_REQUIRED");
  return { user, admin };
}
