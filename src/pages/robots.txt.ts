import type { APIRoute } from 'astro';

// Previews (GitHub Pages) are not indexed. The real site points search engines to the sitemap.
export const GET: APIRoute = ({ site }) => {
  const preview = !!import.meta.env.PUBLIC_PREVIEW;
  const lines = ['User-agent: *', preview ? 'Disallow: /' : 'Allow: /'];
  if (!preview && site) lines.push(`Sitemap: ${new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap.xml`, site).href}`);
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
