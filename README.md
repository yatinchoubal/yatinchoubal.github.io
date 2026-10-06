# Yatin Choubal | Career & Product Leadership Coaching

This is the website for Yatin Choubal's career and product leadership coaching practice. It's a static [Astro](https://astro.build) site with content in Markdown and JSON, edited through [Decap CMS](https://decapcms.org) at `/admin` and hosted on Netlify.

**Current state:** this is a draft.
- **Payments:** test mode. PayPal, Venmo, and Zelle are paid on each provider's own app and verified by hand. Card payments are off.
- **Booking:** Google Calendar appointment schedules (links not set yet).
- **Search engines:** blocked (`indexing: false`).
- **Placeholders:** shown wherever owner content is still needed.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (Node 22+) |
| `npm run dev` | Local site at http://localhost:4321 |
| `npm run dev:drafts` | Local site including draft blog posts |
| `npm run cms` | Local CMS backend. Run alongside `dev`, then open `/admin/`. |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run check` | Type-check the Astro project |
| `npm run audit:content` | Pre-launch audit: placeholders, links, settings, policies, payments |

## Where things live

```
src/data/            site.json, payments.json, policies.json, home.json, faqs.json, testimonials.json, navigation.json
src/content/         services/, blog/, resources/, policies/, pages/about.md
src/pages/           routes (book/ = intake + payment status pages)
src/lib/             booking flow, order reference helpers, utilities
public/admin/        Decap CMS
netlify/functions/   optional Stripe installment webhook (untested; only for card payments, which are off)
scripts/             audit-content.mjs
docs/                OWNER-GUIDE.md, INTEGRATIONS.md, LAUNCH-CHECKLIST.md
```

## Docs

- [Owner guide](docs/OWNER-GUIDE.md): day-to-day editing, handling bookings, privacy, and backup.
- [Integrations](docs/INTEGRATIONS.md): provider findings, setup steps, and what is not yet verified.
- [Launch checklist](docs/LAUNCH-CHECKLIST.md): test flows and the go-live steps.
