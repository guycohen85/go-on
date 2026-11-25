// @ts-check
import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import { AstroPWAIntegration } from '@vite-pwa/astro';

const base = process.env.BASE_PATH ?? '/';
/**
 * Writes sitemap.xml after the build, when the site URL is known and this is not a preview.
 * Small enough not to need a sitemap package.
 */
/** @type {import('astro').AstroIntegration} */
const sitemap = {
  name: 'go-on-sitemap',
  hooks: {
    'astro:build:done': ({ pages, dir }) => {
      const site = process.env.SITE_URL;
      if (!site || process.env.PUBLIC_PREVIEW) return;
      const urls = pages
        .map((p) => p.pathname.replace(/\/$/, ''))
        .filter((p) => p !== '404' && !p.endsWith('.txt') && !p.endsWith('.xml'))
        .map((p) => `  <url><loc>${new URL(`${base}${p}`, site).href}</loc></url>`);
      writeFileSync(
        new URL('sitemap.xml', dir),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      );
    },
  },
};

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  output: 'static',
  // Absolute site URL (for share previews and the sitemap). Set per deploy; without it they are skipped.
  site: process.env.SITE_URL,
  // Sub-path when served from a folder, e.g. /go-on/ on GitHub Pages (set by the deploy workflow).
  base,
  trailingSlash: 'ignore',
  // Pages as /tools.html (not /tools/index.html): links have no trailing slash, and the offline
  // cache then finds /tools as tools.html without precaching every page twice.
  build: { format: 'file' },
  integrations: [
    preact(),
    sitemap,
    // Offline support: precache every page and asset at the first visit. A new version waits
    // until the user taps "עדכון" (src/components/UpdateNotice.astro), so nothing being typed is lost.
    AstroPWAIntegration({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'GO ON',
        short_name: 'GO ON',
        description: 'תמיכה, מידע וכלים לצעירים בני 18 עד 44 שמתמודדים עם סרטן',
        lang: 'he',
        dir: 'rtl',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      generateSW: {
        // Pages, scripts, styles, icons and woff2 fonts (the .woff copies are for old browsers only).
        // The plugin adds the manifest and its icons itself.
        globPatterns: ['**/*.{html,js,css,svg,png,woff2}'],
        // The manifest icons are added by the plugin itself; listing them again duplicates them.
        globIgnores: ['og-image.png', 'pwa-*.png', 'maskable-*.png'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: { 'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(version) },
  },
});
