import { getCollection, type CollectionEntry } from 'astro:content';
import site from '../data/site.json';

export type Service = CollectionEntry<'services'>;
export type Post = CollectionEntry<'blog'>;

export const showDrafts = import.meta.env.DEV || process.env.SHOW_DRAFTS === 'true';

export const formatLabels: Record<Service['data']['format'], string> = {
  digital: 'Digital product',
  group: 'Group session',
  async: 'Asynchronous review',
  session: 'Individual session',
  package: 'Multi-session package',
};

export const pathLabels: Record<Service['data']['path'], string> = {
  independent: 'Start independently',
  specific: 'Solve a specific problem',
  bigger: 'Work together on a bigger goal',
};

/** The additional focus areas that are discoverable across services. */
export const focusAreaList = [
  'Moving from technical roles into product management',
  'Product strategy, prioritization, and execution interview preparation',
  'Stakeholder management and executive communication',
  'First-time manager and leadership transition coaching',
  'Promotion readiness and annual self-evaluation writing',
  'Offer negotiation conversation practice',
  'Responsible use of AI for career preparation',
];

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatPrice(amount: number) {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

export async function getServices() {
  const all = await getCollection('services', ({ data }) => data.published);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getPosts() {
  const all = await getCollection('blog', ({ data }) => showDrafts || !data.draft);
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

/** Replace {{token}} placeholders in policy text with values from policies.json. */
export function fillTokens(html: string, values: Record<string, unknown>) {
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) =>
    key in values && values[key] !== '' ? String(values[key]) : match,
  );
}
