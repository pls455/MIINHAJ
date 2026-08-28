import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { AdminRole, AdminUser } from '../types';

interface AuthContextValue { user: User|null; admin: AdminUser|null; loading: boolean; signIn: (email:string,password:string)=>Promise<void>; signOut:()=>Promise<void>; role: AdminRole|null; can: (role: AdminRole)=>boolean; }
const levels: Record<AdminRole,number> = { reviewer:1, content_admin:2, superadmin:3 };
const AuthContext = createContext<AuthContextValue|null>(null);
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null); const [admin,setAdmin]=useState<AdminUser|null>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>onAuthStateChanged(auth, async u=>{ setUser(u); if(u){ const snap=await getDoc(doc(db,'admins',u.uid)); setAdmin(snap.exists()?({id:snap.id,...snap.data()} as AdminUser):null); } else setAdmin(null); setLoading(false); }),[]);
  const value=useMemo(()=>({user,admin,loading,signIn:(email:string,password:string)=>signInWithEmailAndPassword(auth,email,password).then(()=>undefined),signOut:()=>signOut(auth),role:admin?.active?admin.role:null,can:(required:AdminRole)=>Boolean(admin?.active&&levels[admin.role]>=levels[required])}),[user,admin,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>{const ctx=useContext(AuthContext);if(!ctx)throw new Error('useAuth must be used inside AuthProvider');return ctx;};
