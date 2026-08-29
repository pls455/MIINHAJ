export const $=s=>document.querySelector(s); export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const escapeHtml=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
export const arr=v=>Array.isArray(v)?v:(v==null||v===''?[]:[v]);
export const safeUrl=v=>{try{const u=new URL(String(v||''));return /^https?:$/.test(u.protocol)?u.href:'#'}catch{return '#'}};
export const debounce=(fn,wait=300)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait)}};
export const qs=new URLSearchParams(location.search); export const formatDate=v=>{const d=v?.toDate?v.toDate():v?.seconds?new Date(v.seconds*1000):v?new Date(v):null;return d&&!Number.isNaN(d.valueOf())?d.toLocaleDateString('ar-PS'):''};
export function setMessage(el,text,error=false){if(!el)return;el.textContent=text;el.className=`message ${error?'error':'success'}`}
export function setBusy(button,busy,label='جارٍ التنفيذ...'){if(!button)return;button.disabled=busy;if(busy){button.dataset.label=button.textContent;button.textContent=label}else if(button.dataset.label){button.textContent=button.dataset.label}}
export function saveState(key,value){try{sessionStorage.setItem(`minhaj:${key}`,JSON.stringify(value))}catch{}} export function loadState(key){try{return JSON.parse(sessionStorage.getItem(`minhaj:${key}`)||'null')||{}}catch{return {}}}