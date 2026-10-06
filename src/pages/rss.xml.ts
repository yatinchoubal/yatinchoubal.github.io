import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/utils';
import site from '../data/site.json';

export async function GET(context: APIContext) {
  const posts = (await getPosts()).filter((p) => !p.data.draft);
  return rss({
    title: `${site.brand} | ${site.brandSuffix}`,
    description: site.defaultDescription,
    site: context.site ?? site.url,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/blog/${p.id}/`,
      categories: [p.data.category, ...p.data.tags],
    })),
  });
}
