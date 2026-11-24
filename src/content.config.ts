import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
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

export const collections = { needs, bodyMind, myTools };
