import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
// Version local assets so returning visitors receive the current design.
html = html.replace(/\?v=[a-f0-9]{12}(?=")/g, '');
let servedHtml = html;
for (const name of ['styles.css', 'access.css', 'refinements.css', 'design.css', 'workspace-theme.css', 'typography.css', 'polish.css']) {
  const css = await readFile(path.join(root, 'dist', name), 'utf8');
  const hash = createHash('sha256').update(css).digest('hex').slice(0, 12);
  servedHtml = servedHtml.replace(`href="${name}"`, `href="${name}?v=${hash}"`);
  html = html.replace(`<link rel="stylesheet" href="${name}">`, `<style>\n${css}\n</style>`);
}
for (const name of ['data.js', 'access.js', 'filters.js', 'app.js', 'th-public.js', 'th-workspace.js', 'th-workflows.js', 'locale.js', 'motion.js']) {
  const js = await readFile(path.join(root, 'dist', name), 'utf8');
  const hash = createHash('sha256').update(js).digest('hex').slice(0, 12);
  servedHtml = servedHtml.replace(`src="${name}"`, `src="${name}?v=${hash}"`);
  html = html.replace(`<script src="${name}"></script>`, `<script>\n${js}\n</script>`);
}
const image = await readFile(path.join(root, 'dist/assets/bangkok-storefront.jpg'));
html = html.replaceAll('assets/bangkok-storefront.jpg', 'data:image/jpeg;base64,' + image.toString('base64'));
await writeFile(path.join(root, 'Bahtbridge.html'), html);
await writeFile(path.join(root, 'dist/index.html'), servedHtml);
console.log('Created Bahtbridge.html');
