// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
    define: { 'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(version) },
  },
});
