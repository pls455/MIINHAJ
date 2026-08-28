import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['firebase', 'emulators:exec', '--only', 'firestore', '"npx vitest run tests/rules/firestore.rules.test.ts"'];
const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
