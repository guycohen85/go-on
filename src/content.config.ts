import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const color = z.enum(['green', 'pink', 'blue', 'yellow', 'orange', 'purple']);

const needs = defineCollection({
  loader: file('src/content/needs.json'),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    summary: z.string(),
    icon: z.string(),
    color,
    source: z.string(),
  }),
});

const bodyMind = defineCollection({
  loader: file('src/content/body-mind.json'),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    icon: z.string(),
    color,
    source: z.string(),
  }),
});

const myTools = defineCollection({
  loader: file('src/content/my-tools.json'),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    summary: z.string(),
    icon: z.string(),
    color,
    href: z.string(),
  }),
});

const section = z.object({ heading: z.string(), subtitle: z.string() });

const home = defineCollection({
  loader: file('src/content/home.json'),
  schema: z.object({
    title: z.string(),
    lead: z.string(),
    needs: section,
    myTools: section,
    bodyMind: section,
  }),
});

const field = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'textarea', 'select', 'number']).default('textarea'),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

const resource = z.object({
  name: z.string(),
  description: z.string().optional(),
  phones: z.array(z.object({ number: z.string(), label: z.string().optional() })).default([]),
  emails: z.array(z.string()).default([]),
  links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  missing: z.string().optional(),
});

/** One section of a topic page: src/content/topics/<topic>/<nn>-<slug>.md */
const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/topics' }),
  schema: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    icon: z.string().optional(),
    intro: z.boolean().default(false),
    draft: z.boolean().default(false),
    worksheet: z
      .object({ id: z.string(), title: z.string().optional(), fields: z.array(field) })
      .optional(),
    checklist: z.object({ id: z.string(), items: z.array(z.string()) }).optional(),
    resources: z.array(resource).optional(),
    links: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
  }),
});

export const collections = { home, needs, bodyMind, myTools, sections };
