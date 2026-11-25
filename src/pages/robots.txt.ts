import type { APIRoute } from 'astro';

// The real site points search engines to the sitemap. Crawlers read robots.txt only at the host
// root, so on the GitHub Pages preview (/go-on/robots.txt) the Disallow has no effect; the preview
// is kept out of search by the noindex meta tag in Base.astro.
export const GET: APIRoute = ({ site }) => {
  const preview = !!import.meta.env.PUBLIC_PREVIEW;
  const lines = ['User-agent: *', preview ? 'Disallow: /' : 'Allow: /'];
  if (!preview && site) lines.push(`Sitemap: ${new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap.xml`, site).href}`);
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
