import {signInWithEmailAndPassword,onAuthStateChanged,signOut} from 'firebase/auth';import {doc,getDoc} from 'firebase/firestore';import {auth,db} from './firebase.js';
export const ROLE_LEVEL={reviewer:1,content_admin:2,superadmin:3,super_admin:3,admin:3};
export async function getAdminProfile(uid){const s=await getDoc(doc(db,'admins',uid));return s.exists()?{id:s.id,...s.data()}:null}
export function watchAuth(cb){return onAuthStateChanged(auth,async user=>cb(user,user?await getAdminProfile(user.uid):null));}
export const login=(email,password)=>signInWithEmailAndPassword(auth,email,password);export const logout=()=>signOut(auth);export const level=r=>ROLE_LEVEL[r]||0;export const can=(role,required)=>level(role)>=level(required);
