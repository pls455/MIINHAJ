import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db } from '../services/firebase/firebaseConfig.js';
const NAME='solutions';
const pageLimit=n=>Math.min(Math.max(Number(n)||24,1),50);
export async function getSolutions({pageSize=24,cursor=null,subjectId=null,activeOnly=false}={}){const c=[];if(activeOnly)c.push(where('active','==',true));c.push(orderBy('order','asc'),limit(pageLimit(pageSize)));if(cursor)c.splice(c.length-1,0,startAfter(cursor));const s=await getDocs(query(collection(db,NAME),...c));return{items:s.docs.map(d=>({id:d.id,...d.data()})),nextCursor:s.docs.at(-1)||null};}
export async function createSolution(data){return addDoc(collection(db,NAME),data)}
export async function updateSolution(id,data){return updateDoc(doc(db,NAME,id),data)}
export async function deleteSolution(id){return deleteDoc(doc(db,NAME,id))}
