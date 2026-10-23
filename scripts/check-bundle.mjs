// Fails when the built JS + CSS exceed the gzipped budget from the brief (450 KB).
// Usage: npm run build && node scripts/check-bundle.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 450;
const dir = new URL('../dist/assets/', import.meta.url);
let total = 0;
for (const f of readdirSync(dir)) {
  if (!/\.(js|css)$/.test(f)) continue;
  total += gzipSync(readFileSync(new URL(f, dir)), { level: 9 }).length;
}
const kb = total / 1024;
console.log(`JS + CSS gzipped: ${kb.toFixed(1)} KB (budget ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) {
  console.error('Over budget.');
  process.exit(1);
}
