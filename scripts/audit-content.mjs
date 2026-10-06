#!/usr/bin/env node
// Pre-launch content audit. Run `npm run build` first, then `npm run audit:content`.
// BLOCKER = must be fixed before going live. WARN = review. INFO = for awareness.
// Exits with code 1 if any blocker is found.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { load as loadYaml } from 'js-yaml';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const p = (...parts) => join(root, ...parts);
const json = (file) => JSON.parse(readFileSync(p(file), 'utf8'));
const frontmatter = (file) => {
  const m = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? loadYaml(m[1]) : {};
};
const mdFiles = (dir) => readdirSync(p(dir)).filter((f) => f.endsWith('.md')).map((f) => p(dir, f));

const results = [];
const blocker = (msg) => results.push(['BLOCKER', msg]);
const warn = (msg) => results.push(['WARN', msg]);
const info = (msg) => results.push(['INFO', msg]);

// ------------------------------------------------------------ Site settings
const site = json('src/data/site.json');
if (!site.url || site.url.includes('example.com')) blocker('site.json: "url" is still the example domain.');
if (!site.indexing) blocker('site.json: "indexing" is off. Every page is noindex and robots.txt blocks crawlers. Turn it on at launch.');
if (!site.contactEmail) blocker('site.json: "contactEmail" is empty.');
if (!site.profilePhoto?.src) warn('site.json: no profile photo, so the "YC" placeholder is shown.');
else if (!existsSync(p('public', site.profilePhoto.src))) blocker(`site.json: profile photo file not found: public${site.profilePhoto.src}`);
if (!site.booking?.fitCallUrl) blocker('site.json: "booking.fitCallUrl" (free 15-minute fit call) is empty.');
if (!site.booking?.sessionBookingUrl) blocker('site.json: "booking.sessionBookingUrl" (Google Calendar booking page for paid sessions) is empty. Clients get it in their confirmation email after payment is verified.');
const upload = site.booking?.documentUploadUrl ?? '';
if (!upload) warn('site.json: "booking.documentUploadUrl" is empty, so clients are told you will send an upload link.');
else if (/drive\.google\.com\/drive\/(u\/\d+\/)?folders\//.test(upload)) blocker(`site.json: "booking.documentUploadUrl" is a shared Google Drive folder. With viewer access clients can't upload; with editor access every client can see, download, and delete everyone else's resumes. Use a Google Form with a File upload question instead (see docs/INTEGRATIONS.md).`);
if (site.newsletter?.enabled && !site.newsletter.formActionUrl) blocker('site.json: newsletter is enabled but has no "formActionUrl".');
if (!site.newsletter?.enabled) info('Newsletter is disabled. Signup forms show a "coming soon" note.');
if (!site.analytics?.plausibleDomain) info('Analytics is off (no plausibleDomain).');
if (!site.searchConsoleVerification) info('No Search Console verification tag. DNS verification also works.');
if (!site.linkedinUrl) info('No LinkedIn URL set.');

// ------------------------------------------------------------ CMS
const cms = readFileSync(p('public/admin/config.yml'), 'utf8');
if (cms.includes('OWNER/REPO')) warn('public/admin/config.yml: backend "repo" is still OWNER/REPO, so the online editor will not work.');
if (cms.includes('www.example.com')) warn('public/admin/config.yml: site_url still points at example.com.');

// ------------------------------------------------------------ Policies
const pol = json('src/data/policies.json');
if (!pol.ownerApproved) blocker('policies.json: "ownerApproved" is false, so policy pages show a draft banner. Review them (ideally with a lawyer) first.');
if (!pol.governingState) blocker('policies.json: "governingState" is empty.');

// ------------------------------------------------------------ Payments
const pay = json('src/data/payments.json');
const live = pay.mode === 'live';
if (!live) blocker('payments.json: mode is "test". The booking flow simulates payment and shows a test banner.');
const z = pay.methods.zelle;
if (z.enabled && !z.verified) blocker('payments.json: Zelle is enabled but "verified" is false, so instructions stay hidden.');
if (z.enabled && (!z.recipientName || !z.recipientHandle)) blocker('payments.json: Zelle is enabled but the recipient name or handle is empty.');
const pp = pay.methods.paypal;
const vm = pay.methods.venmo;
if (pp.enabled && !pp.paypalMeUrl) blocker('payments.json: PayPal is enabled but "paypalMeUrl" is empty.');
else if (pp.enabled && !/^https:\/\/(www\.)?paypal\.me\/[^/]+\/?$/i.test(pp.paypalMeUrl)) warn(`payments.json: "paypalMeUrl" doesn't look like https://paypal.me/YourName (got ${pp.paypalMeUrl}). The amount is added to the end automatically.`);
if (vm.enabled && !vm.handle && !vm.profileUrl) blocker('payments.json: Venmo is enabled but has no "handle" or "profileUrl".');
if (vm.enabled) warn("payments.json: Venmo is enabled. Venmo personal profiles can't be used to receive payment for services; use a Venmo business profile.");
if (pp.enabled) info('PayPal: receive service payments as Goods & Services (a PayPal Business account is recommended). Fees and 1099-K reporting apply.');
if (z.enabled) info('Zelle: check your bank allows business payments on the receiving account. Some banks restrict Zelle on personal accounts used for business.');

// ------------------------------------------------------------ Services
const services = mdFiles('src/content/services').map((f) => ({ id: relative(p('src/content/services'), f).replace(/\.md$/, ''), ...frontmatter(f) }));
for (const s of services.filter((s) => s.published !== false)) {
  const l = s.links ?? {};
  if (s.format === 'digital') {
    if (!l.digitalStore) (live ? blocker : warn)(`Service "${s.id}": digital product has no "links.digitalStore".`);
    continue;
  }
  if (s.format === 'group') info(`Service "${s.id}": Google Calendar booking pages don't support group slots. Schedule clinics yourself and email invites.`);
  if (s.schedulerHandlesPayment) continue;
  const anyMethod = pp.enabled || vm.enabled || z.enabled || pay.methods.card.enabled;
  if (!anyMethod) (live ? blocker : warn)(`Service "${s.id}": no payment method is enabled.`);
  if (pay.methods.card.enabled && !l.card) (live ? blocker : warn)(`Service "${s.id}": card is enabled but "links.card" is empty.`);
  if (pay.methods.card.enabled && s.installments?.length && !l.cardInstallments) (live ? blocker : warn)(`Service "${s.id}": installments are offered but "links.cardInstallments" is empty.`);
  if (s.installments?.length) {
    for (const i of s.installments) {
      const total = Math.round(i.count * i.amount * 100) / 100;
      if (Math.abs(total - s.price) > 1) warn(`Service "${s.id}": ${i.count} x $${i.amount} = $${total}, which differs from the price $${s.price}.`);
    }
  }
}

// ------------------------------------------------------------ Resources
for (const f of mdFiles('src/content/resources')) {
  const r = frontmatter(f);
  const id = relative(p('src/content/resources'), f);
  if (r.access === 'paid' && r.available && !r.purchaseUrl) blocker(`Resource "${id}": marked available but has no purchaseUrl.`);
  if (r.access === 'paid' && r.fileUrl) blocker(`Resource "${id}": paid resource has a fileUrl. Paid files must live in the download store, never in public/.`);
}
const publicDownloads = existsSync(p('public/downloads')) ? readdirSync(p('public/downloads')).filter((f) => !f.startsWith('.')) : [];
if (publicDownloads.length) warn(`public/downloads contains ${publicDownloads.length} file(s). Anything in public/ is downloadable by anyone; keep only free files there.`);

// ------------------------------------------------------------ Blog
const posts = mdFiles('src/content/blog').map((f) => ({ id: relative(p('src/content/blog'), f), ...frontmatter(f) }));
const drafts = posts.filter((x) => x.draft !== false);
if (drafts.length) info(`${drafts.length} of ${posts.length} blog posts are drafts and hidden in production: ${drafts.map((d) => d.id).join(', ')}`);
for (const post of posts.filter((x) => x.draft === false)) {
  if (readFileSync(p('src/content/blog', post.id), 'utf8').includes('OWNER REVIEW')) warn(`Blog "${post.id}" is published but still contains an OWNER REVIEW note.`);
}

// ------------------------------------------------------------ Testimonials
const t = json('src/data/testimonials.json');
for (const [i, item] of (t.items ?? []).entries()) {
  if (item.approved && !item.consentDate) blocker(`Testimonial #${i + 1} is approved but has no consent date (it stays hidden).`);
}

// ------------------------------------------------------------ Built output
const dist = p('dist');
if (!existsSync(dist)) {
  warn('No dist/ folder. Run `npm run build` first to scan pages and links.');
} else {
  const html = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.html')) html.push(full);
    }
  };
  walk(dist);
  const placeholderPages = [];
  const reviewPages = [];
  const tokenPages = [];
  const broken = new Set();
  for (const file of html) {
    const src = readFileSync(file, 'utf8');
    const rel = '/' + relative(dist, file).replace(/\\/g, '/').replace(/index\.html$/, '');
    if (src.includes('data-placeholder')) placeholderPages.push(rel);
    if (src.includes('OWNER REVIEW')) reviewPages.push(rel);
    if (/\{\{\s*\w+\s*\}\}/.test(src.replace(/<script[\s\S]*?<\/script>/g, ''))) tokenPages.push(rel);
    for (const [, href] of src.matchAll(/href="(\/[^"#?]*)/g)) {
      if (href.startsWith('//') || href.startsWith('/admin')) continue;
      const target = join(dist, decodeURI(href));
      const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
      if (!ok && !existsSync(target + '.html')) broken.add(`${href}  (on ${rel})`);
    }
  }
  if (placeholderPages.length) warn(`${placeholderPages.length} built page(s) show placeholders: ${placeholderPages.slice(0, 12).join(', ')}${placeholderPages.length > 12 ? ', …' : ''}`);
  if (reviewPages.length) warn(`${reviewPages.length} built page(s) contain OWNER REVIEW notes in the HTML source: ${reviewPages.join(', ')}`);
  if (tokenPages.length) blocker(`${tokenPages.length} built page(s) show an unfilled {{token}} (fill it in Settings → Policies): ${tokenPages.join(', ')}`);
  if (broken.size) blocker(`Broken internal links:\n    ${[...broken].join('\n    ')}`);
  info(`Scanned ${html.length} built pages.`);
}

// ------------------------------------------------------------ Report
const order = { BLOCKER: 0, WARN: 1, INFO: 2 };
results.sort((a, b) => order[a[0]] - order[b[0]]);
for (const [level, msg] of results) console.log(`${level.padEnd(7)} ${msg}`);
const count = (lvl) => results.filter((r) => r[0] === lvl).length;
console.log(`\n${count('BLOCKER')} blocker(s), ${count('WARN')} warning(s), ${count('INFO')} note(s).`);
if (count('BLOCKER')) {
  console.log('Not ready for live launch. A draft site with blockers can still be previewed safely while indexing is off and payments are in test mode.');
  process.exitCode = 1;
}
