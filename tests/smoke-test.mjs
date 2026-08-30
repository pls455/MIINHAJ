import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'index.html','firebase.json','firestore.rules','README.md',
  'css/variables.css','js/services/firebase.js',
  'js/repositories/resourceRepository.js','js/services/ai/aiService.js',
  'admin/index.html','admin/problem-reports.html','admin/suggestions.html'
];
const htmlFiles = [];
const failures = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
function cleanTarget(value) { return value.split('#')[0].split('?')[0]; }
function checkTarget(file, raw, kind) {
  const target = cleanTarget(raw);
  if (!target || target.startsWith('#') || /^(https?:|mailto:|tel:|javascript:|data:)/i.test(target)) return;
  const resolved = target.startsWith('/') ? path.join(root,target.slice(1)) : path.resolve(path.dirname(file),target);
  if (!fs.existsSync(resolved)) failures.push(`${kind} missing: ${path.relative(root,file)} -> ${raw}`);
}
walk(root);
const missing = required.filter(p => !fs.existsSync(path.join(root,p)));
for (const file of htmlFiles) {
  const source = fs.readFileSync(file,'utf8');
  if (/<script[^>]+(?:src|type)=[^>]*(?:\.ts|tsx|react|vue)/i.test(source)) failures.push(`Forbidden frontend reference: ${path.relative(root,file)}`);
  for (const match of source.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) checkTarget(file,match[1],'HTML target');
}
const jsFiles = [];
function walkJs(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walkJs(full); else if(/\.m?js$/.test(entry.name)) jsFiles.push(full);
  }
}
walkJs(root);
for (const file of jsFiles) {
  const source=fs.readFileSync(file,'utf8');
  for (const match of source.matchAll(/(?:from\s*["']|import\s*\(["'])(\.\.?\/[^"']+)["']/g)) {
    let target=match[1];
    if(!path.extname(target)) target += '.js';
    const resolved=path.resolve(path.dirname(file),target);
    if(!fs.existsSync(resolved)) failures.push(`JS import missing: ${path.relative(root,file)} -> ${match[1]}`);
  }
}
if (missing.length || failures.length) {
  console.error('Smoke test failed');
  if (missing.length) console.error('Missing required files:', missing);
  for (const failure of failures) console.error(failure);
  process.exit(1);
}
console.log(`Smoke test passed: ${htmlFiles.length} HTML pages and ${jsFiles.length} JS modules checked.`);
