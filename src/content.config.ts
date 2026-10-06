import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const urlOrEmpty = z.union([z.url(), z.literal('')]).default('');

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().default(100),
    published: z.boolean().default(true),
    // Format drives filtering and labels.
    format: z.enum(['digital', 'group', 'async', 'session', 'package']),
    // Buying path groups services on the pricing page.
    path: z.enum(['independent', 'specific', 'bigger']),
    price: z.number(),
    priceSuffix: z.string().default(''),
    duration: z.string().default(''),
    sessions: z.string().default(''),
    capacity: z.string().default(''),
    turnaround: z.string().default(''),
    revisions: z.string().default(''),
    validity: z.string().default(''),
    whoFor: z.array(z.string()).default([]),
    problems: z.array(z.string()).default([]),
    deliverables: z.array(z.string()).default([]),
    exclusions: z.array(z.string()).default([]),
    preparation: z.array(z.string()).default([]),
    focusAreas: z.array(z.string()).default([]),
    installments: z
      .array(z.object({ count: z.number(), amount: z.number(), interval: z.string().default('month') }))
      .default([]),
    links: z
      .object({
        scheduler: urlOrEmpty,
        card: urlOrEmpty,
        cardInstallments: urlOrEmpty,
        paypal: urlOrEmpty,
        digitalStore: urlOrEmpty,
      })
      .default({ scheduler: '', card: '', cardInstallments: '', paypal: '', digitalStore: '' }),
    schedulerHandlesPayment: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['Resumes', 'Interviews', 'Performance & Promotion', 'Product Careers', 'Leadership', 'AI & Careers']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(true),
    relatedServices: z.array(z.string()).default([]),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    seoTitle: z.string().optional(),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(100),
    // 'included' resources come free with every service and aren't sold on their own.
    access: z.enum(['free', 'included', 'paid']),
    leadMagnet: z.boolean().default(false),
    available: z.boolean().default(false),
    price: z.number().optional(),
    relatedService: z.string().optional(),
    fileUrl: z.string().default(''),
    purchaseUrl: urlOrEmpty,
    format: z.string().default(''),
  }),
});

const policies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/policies' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(100),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    intro: z.string().optional(),
    expertise: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
    philosophy: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
    bestFit: z.array(z.string()).default([]),
    notFit: z.array(z.string()).default([]),
  }),
});

export const collections = { services, blog, resources, policies, pages };
