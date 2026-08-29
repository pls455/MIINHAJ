import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = ['index.html','firebase.json','firestore.rules','README.md','css/variables.css','js/services/firebase.js','js/repositories/resourceRepository.js','js/services/ai/aiService.js'];
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);
const missing = required.filter(p => !fs.existsSync(path.join(root,p)));
const forbidden = htmlFiles.filter(p => /<script[^>]+(?:src|type)=[^>]*(?:\.ts|tsx|react|vue)/i.test(fs.readFileSync(p,'utf8')));
if (missing.length || forbidden.length) {
  console.error('Smoke test failed');
  if (missing.length) console.error('Missing:', missing);
  if (forbidden.length) console.error('Forbidden frontend references:', forbidden);
  process.exit(1);
}
console.log(`Smoke test passed: ${htmlFiles.length} HTML pages checked.`);
