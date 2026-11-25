// Generates the app icons, favicon and share image from the client's logo files.
// Run once when the logo changes: node scripts/make-icons.mjs
// Uses sharp, which Astro already installs for its image service (no extra dependency).
import sharp from 'sharp';

const stacked = 'assets/source/logo-go-on-stacked.png';
const horizontal = 'assets/source/logo-go-on-horizontal.png';
const white = { r: 255, g: 255, b: 255, alpha: 1 };
const out = (name) => `public/${name}`;

// App icons: the stacked logo on white (it already has room around it, so it also fits the
// maskable safe zone, a centered circle of 80%).
for (const size of [192, 512]) {
  await sharp(stacked).flatten({ background: white }).resize(size, size).png().toFile(out(`pwa-${size}x${size}.png`));
}
await sharp(stacked).flatten({ background: white }).resize(512, 512).png().toFile(out('maskable-icon-512x512.png'));
await sharp(stacked).flatten({ background: white }).resize(180, 180).png().toFile(out('apple-touch-icon-180x180.png'));

// Favicon: the ribbon mark only (the words are unreadable at 32px), squared with a little margin.
const mark = await sharp(stacked).extract({ left: 160, top: 90, width: 200, height: 220 }).toBuffer();
const square = await sharp({ create: { width: 240, height: 240, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: mark, left: 20, top: 10 }])
  .png()
  .toBuffer();
for (const size of [32, 48]) await sharp(square).resize(size, size).png().toFile(out(`favicon-${size}.png`));

// Share image (Open Graph) 1200x630: the horizontal logo centered on white.
const logo = await sharp(horizontal).resize({ width: 1000 }).toBuffer();
const { height = 0 } = await sharp(logo).metadata();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: white } })
  .composite([{ input: logo, left: 100, top: Math.round((630 - height) / 2) }])
  .flatten({ background: white })
  .png()
  .toFile(out('og-image.png'));
console.log('icons written to public/');
