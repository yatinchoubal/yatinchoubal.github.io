import site from '../data/site.json';

// While the site is in draft (indexing off), ask all crawlers to stay away.
export function GET() {
  const body = site.indexing
    ? `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /book/success/\nDisallow: /book/pending/\nDisallow: /book/failed/\nDisallow: /book/canceled/\n\nSitemap: ${new URL('/sitemap-index.xml', site.url)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
