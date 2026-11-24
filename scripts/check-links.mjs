// Checks that every internal href/src in dist/ points to a file that exists.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
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
  for (const [, link] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const target = join(dist, decodeURIComponent(link));
    const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
    if (!ok) {
      broken++;
      console.log(`${file.replace(dist, '')}: ${link}`);
    }
  }
}
console.log(`${files.length} pages checked, ${broken} broken links`);
process.exit(broken ? 1 : 0);
