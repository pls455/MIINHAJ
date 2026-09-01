import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { doc, getDoc, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const USERS='users';
const clean=v=>String(v??'').trim();

export async function initStudentAuth(){
  await setPersistence(auth,browserLocalPersistence);
  return auth;
}

export function watchAuth(callback){ return onAuthStateChanged(auth,callback); }

export async function registerStudent({name,email,password,identityNumber=''}){
  const safeName=clean(name).slice(0,100);
  const safeEmail=clean(email).toLowerCase();
  const safeIdentity=clean(identityNumber).replace(/\s+/g,'').slice(0,32);
  if(!safeName) throw Error('STUDENT_NAME_REQUIRED');
  if(!safeEmail) throw Error('STUDENT_EMAIL_REQUIRED');
  if(String(password||'').length<6) throw Error('STUDENT_PASSWORD_SHORT');
  if(safeIdentity && !/^[0-9]{4,32}$/.test(safeIdentity)) throw Error('STUDENT_ID_INVALID');
  const credential=await createUserWithEmailAndPassword(auth,safeEmail,password);
  if(safeName) await updateProfile(credential.user,{displayName:safeName});
  await setDoc(doc(db,USERS,credential.user.uid),{
    name:safeName,
    email:safeEmail,
    role:'student',
    identityNumber:safeIdentity||null,
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });
  return credential.user;
}

export async function loginStudent(email,password){
  const safeEmail=clean(email).toLowerCase();
  if(!safeEmail||!password) throw Error('STUDENT_LOGIN_REQUIRED');
  const credential=await signInWithEmailAndPassword(auth,safeEmail,password);
  return credential.user;
}

export async function logoutStudent(){ await signOut(auth); }

export async function getStudentProfile(uid=auth.currentUser?.uid){
  if(!uid) return null;
  const snap=await getDoc(doc(db,USERS,uid));
  return snap.exists()?{id:snap.id,...snap.data()}:null;
}

export async function saveStudentProfile({name,identityNumber=''}){
  const user=auth.currentUser;
  if(!user) throw Error('STUDENT_LOGIN_REQUIRED');
  const safeName=clean(name).slice(0,100);
  const safeIdentity=clean(identityNumber).replace(/\s+/g,'').slice(0,32);
  if(!safeName) throw Error('STUDENT_NAME_REQUIRED');
  if(safeIdentity && !/^[0-9]{4,32}$/.test(safeIdentity)) throw Error('STUDENT_ID_INVALID');
  await setDoc(doc(db,USERS,user.uid),{name:safeName,email:user.email||'',role:'student',identityNumber:safeIdentity||null,updatedAt:serverTimestamp()},{merge:true});
  if(user.displayName!==safeName) await updateProfile(user,{displayName:safeName});
}

export function authErrorMessage(error){
  const code=error?.code||'';
  const map={
    'auth/email-already-in-use':'هذا البريد مستخدم بالفعل.',
    'auth/invalid-email':'البريد الإلكتروني غير صحيح.',
    'auth/weak-password':'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.',
    'auth/invalid-credential':'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/user-disabled':'هذا الحساب معطل.',
    'auth/too-many-requests':'تمت محاولات كثيرة. جرّب لاحقًا.'
  };
  return map[code]||({STUDENT_ID_INVALID:'رقم الهوية يجب أن يحتوي على أرقام فقط وبطول مناسب.',STUDENT_PASSWORD_SHORT:'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'}[error?.message]||'تعذر إكمال العملية.');
}
