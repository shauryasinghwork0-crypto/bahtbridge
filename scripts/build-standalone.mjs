import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
for (const name of ['styles.css', 'access.css', 'refinements.css', 'design.css', 'workspace-theme.css', 'typography.css']) {
  const css = await readFile(path.join(root, 'dist', name), 'utf8');
  html = html.replace(`<link rel="stylesheet" href="${name}">`, `<style>\n${css}\n</style>`);
}
for (const name of ['data.js', 'access.js', 'filters.js', 'app.js', 'th-public.js', 'th-workspace.js', 'th-workflows.js', 'locale.js']) {
  const js = await readFile(path.join(root, 'dist', name), 'utf8');
  html = html.replace(`<script src="${name}"></script>`, `<script>\n${js}\n</script>`);
}
const image = await readFile(path.join(root, 'dist/assets/bangkok-storefront.jpg'));
html = html.replaceAll('assets/bangkok-storefront.jpg', 'data:image/jpeg;base64,' + image.toString('base64'));
await writeFile(path.join(root, 'Bahtbridge.html'), html);
console.log('Created Bahtbridge.html');
