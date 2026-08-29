import { auth, db } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
export const ROLE_LEVEL={reviewer:1,content_admin:2,superadmin:3,super_admin:3,admin:3};
export function level(role){return ROLE_LEVEL[role]||0} export function can(role,needed){return level(role)>=level(needed)}
export async function currentAdmin(user=auth.currentUser){if(!user)return null;const s=await getDoc(doc(db,'admins',user.uid));if(!s.exists()||s.data().active!==true)return null;const raw=s.data().role||'reviewer';return {uid:user.uid,email:user.email||s.data().email||'',role:raw==='super_admin'||raw==='admin'?'superadmin':raw}}
export function watchAuth(callback){return onAuthStateChanged(auth,callback)}
export async function login(email,password){return signInWithEmailAndPassword(auth,email,password)} export async function logout(){return signOut(auth)}