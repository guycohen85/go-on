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
    /** true = text drafted from the spec; a string = a custom draft label (e.g. content Claude added). */
    draft: z.union([z.boolean(), z.string()]).default(false),
    worksheet: z
      .object({ id: z.string(), title: z.string().optional(), fields: z.array(field) })
      .optional(),
    checklist: z.object({ id: z.string(), items: z.array(z.string()) }).optional(),
    resources: z.array(resource).optional(),
    links: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
    /** Interactive tools rendered after the text, in order. `data` is tool-specific content. */
    tools: z
      .array(z.object({ type: z.string(), data: z.record(z.string(), z.unknown()).optional() }))
      .optional(),
  }),
});

const meditations = defineCollection({
  loader: file('src/content/meditations.json'),
  schema: z.object({
    order: z.number(),
    folder: z.string(),
    folderSummary: z.string(),
    title: z.string(),
    minutes: z.string(),
    lines: z.array(z.string()),
  }),
});

/** One station of "חוזרים לחיים": src/content/stations/<nn>.md (frontmatter only). */
const stations = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/stations' }),
  schema: z.object({
    n: z.number().int().min(1),
    title: z.string(),
    goal: z.string(),
    rationale: z.string(),
    objectives: z.array(z.string()),
    process: z.array(z.string()),
    /** Worksheet fields. Keep each id stable once published: saved answers are keyed by it. */
    worksheet: z.array(z.object({ id: z.string(), label: z.string() })),
    task: z.string(),
    /** Show the baseline gauge again to re-rate it next to the first rating. */
    baselineAgain: z.boolean().default(false),
    draft: z.union([z.boolean(), z.string()]).default(false),
  }),
});

const link = z.object({ title: z.string(), summary: z.string(), icon: z.string(), color, href: z.string() });

/** Texts of the "חוזרים לחיים" hub and the baseline gauge. */
const backToLife = defineCollection({
  loader: file('src/content/back-to-life.json'),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    lead: z.string(),
    note: z.string(),
    noteDraft: z.string().optional(),
    start: z.object({ heading: z.string(), items: z.array(link) }),
    stations: z.object({ heading: z.string(), subtitle: z.string() }),
    more: z.object({ heading: z.string(), items: z.array(link) }),
    baseline: z.object({
      domains: z.array(z.string()),
      scale: z.string(),
      scaleDraft: z.string().optional(),
    }),
  }),
});

export const collections = { home, needs, bodyMind, myTools, sections, meditations, stations, backToLife };
