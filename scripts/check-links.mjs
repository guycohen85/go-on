// Checks that every internal href/src in dist/ points to a file that exists.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
// Links carry the base path (e.g. /go-on/) when built for a sub-path; files in dist/ do not.
const base = (process.env.BASE_PATH ?? '/').replace(/\/$/, '');
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) files.push(p);
  }
})(dist);

let broken = 0;
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const [, link] of html.matchAll(/(?:href|src)="(\/(?!\/)[^"#?]*)/g)) {
    // Under a base path, a link without it points outside the site.
    const inBase = !base || link.startsWith(`${base}/`);
    const target = join(dist, decodeURIComponent(base ? link.slice(base.length) : link));
    const ok =
      inBase &&
      ((existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')))) ||
        existsSync(`${target.replace(/\/$/, '')}.html`));
    if (!ok) {
      broken++;
      console.log(`${file.replace(dist, '')}: ${link}`);
    }
  }
}
console.log(`${files.length} pages checked, ${broken} broken links`);
process.exit(broken ? 1 : 0);
