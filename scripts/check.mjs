import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['data.js', 'access.js', 'filters.js', 'app.js', 'th-public.js', 'th-workspace.js', 'th-workflows.js', 'locale.js', 'motion.js']) {
  const source = await readFile(path.join(root, 'dist', name), 'utf8');
  new vm.Script(source, { filename: name });
  if (/GBP|USD|EUR|£|\$\d|Flowbridge|Northstar/.test(source)) throw new Error(`${name}: old branding or currency`);
}
for (const name of ['styles.css', 'access.css', 'refinements.css', 'design.css', 'workspace-theme.css', 'typography.css', 'polish.css']) {
  const source = await readFile(path.join(root, 'dist', name), 'utf8');
  if (/Manrope|DM Sans|fonts\.googleapis/.test(source)) throw new Error(`${name}: unexpected font`);
}
console.log('JavaScript syntax, branding, currency and Arial checks passed.');
