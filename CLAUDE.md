# GO ON

A Hebrew (RTL) web app (PWA) for young adults aged 18 to 44 coping with cancer: information, tools and a self-paced 12-station process ("חוזרים לחיים"). No server, no accounts: everything the user writes stays on their device.

- Decisions and project state: `decisions.md` (Hebrew) is the source of truth.
- Structure, routes, data and services: `docs/architecture.md`.
- Design tokens and component rules: `DESIGN.md`. Follow it; no colors, fonts, sizes or spacing outside the tokens.
- Approved home mockup: `docs/mockup/direction-g.html`.
- Source content (Hebrew, extracted from the prototype): `content/` (see `content/README.md`). Never use the prototype's code.

## Stack
- Astro 7 (static output), Tailwind CSS 4 (`@theme` tokens in `src/styles/global.css`), TypeScript (strict)
- Preact islands (`client:visible` / `client:load`) only where interaction is needed
- Content collections in `src/content/`, Markdown
- `@vite-pwa/astro` 2.x for offline support
- Storage: IndexedDB via `idb-keyval`; diary encrypted with Web Crypto (AES-GCM, PBKDF2)
- Fonts via Fontsource (Fredoka, Assistant); icons from `@phosphor-icons/core` inlined as SVG
- Feedback: Web3Forms (`PUBLIC_WEB3FORMS_KEY`)
- Hosting: Cloudflare Workers with static assets
- Node 26 LTS, npm

No new libraries or services without the user's approval.

## Rules
- Hebrew UI, `<html lang="he" dir="rtl">`. Logical CSS only (`ms-`/`me-`, `ps-`/`pe-`, `start`/`end`, `text-start`); never `ml-`, `left-`, `text-left`.
- Write number ranges as "18 עד 44", not "18–44" (bidi reverses digit–digit in RTL). Technique names like "נשימה 4–6" are not ranges.
- Accessibility (IS 5568 / WCAG AA): labels on every field, visible focus, keyboard navigation, alt text, contrast as in `DESIGN.md`, touch targets ≥ 44px.
- Visual level 1: CSS transitions only; honor `prefers-reduced-motion`.
- Privacy: no analytics, no cookies, no third-party requests except the feedback POST. Never send personal content anywhere. Show "נשמר רק בטלפון הזה" wherever the user writes.
- Medical content is general information, not advice: keep the disclaimer and never add personal medical recommendations.
- Keep content in `src/content/`, not in components, so a CMS can be added later.
- Placeholders for missing content: `[חסר: ...]`. Draft text from the spec stays marked `[טיוטה מהאפיון – לבדיקה]` (`draft: true`), and content Claude added is marked `[טיוטה – לבדיקה]` (`draft: "[טיוטה – לבדיקה]"`), until the client approves it.

## Commands
```
npm install
npm run dev       # local dev server
npm run build     # static build to dist/
npm run preview   # serve the build
npm run check     # astro check (types)
```

## Workflow
- One milestone per branch; build, `npm run check` and a link check pass before asking for review.
- Update `decisions.md`, and this file or `docs/architecture.md` when a decision changes them.
