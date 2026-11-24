# GO ON: architecture

Type 1: static PWA, no server of our own. All personal data stays on the user's device.
Version 1 has no companion flow (no unlock codes, no companion area, no participant number); see "Later" below.

## Stack
- Astro 7 (static output) + Tailwind CSS 4 + TypeScript
- Preact islands for interactive parts (station worksheets, diary, tools, calculators, tracking, feedback)
- Content in Markdown via Astro content collections (`src/content/`), separated from code so a CMS (Keystatic) can be added later
- PWA: `@vite-pwa/astro` 2.x (Workbox precache of all pages and assets; works offline after first load)
- Hosting: Cloudflare Workers with static assets, account in the client's name. Until then, previews on GitHub Pages
- Fonts self-hosted via Fontsource (Fredoka 500/600, Assistant 400/600/700); icons: Phosphor duotone/regular, inlined as SVG at build time

## Sitemap
```
/                          home (direction G): intro, 8 needs, my tools, body & mind
/back-to-life              "חוזרים לחיים" hub
/back-to-life/intro        introduction to the process
/back-to-life/before       before we start
/back-to-life/baseline     baseline check (מד פתיחה)
/back-to-life/station/[n]  stations 1-12, all open
/back-to-life/appendix     appendices (weekly plan, conversation prep, hard-day card, between-sessions log)
/needs/[slug]              fertility, relationships, work, rights, parenting, community, after, aya
/body-mind/[slug]          nutrition, physio, activity, mindfulness, cognitive
/diary                     encrypted personal diary
/tools                     toolkit
/tracking                  tracking
/safety                    when to seek help (linked from every page header)
/references                sources
/settings                  backup export/import, delete all data
/privacy, /accessibility   privacy notice, accessibility statement
```
Bottom navigation: בית, חוזרים לחיים, היומן, כלים, מעקב.

## Data on the device
- Storage: IndexedDB (`idb-keyval`), one key per area: `progress`, `stations/<n>`, `baseline`, `tracking`, `tools/*`, `diary` (encrypted blob), `feedbackQueue`.
- Progress: each station has a "סיימתי" button; the hub shows which stations are done. Nothing is locked.
- Diary: AES-GCM via Web Crypto, key derived from the personal code with PBKDF2. Auto-lock after 5 minutes of inactivity. A forgotten code cannot be recovered (stated clearly in the UI).
- Backup: export everything to a JSON file (diary stays encrypted inside it); import restores it. Persistent storage requested via `navigator.storage.persist()`.
- A visible notice wherever the user writes: saved only on this device.

## Feedback
- Every topic and station ends with "שימושי / לא ברור / חסר לי" plus an optional short text field (with a hint not to write personal details).
- POST to Web3Forms (`https://api.web3forms.com/submit`) with `access_key`, page id, rating, text, app version. No identifying data. Arrives by email to the client.
- Offline: queued in IndexedDB and sent when back online.

## External services
| Service | Use | Env var |
|---|---|---|
| Cloudflare Workers (static assets) | hosting | – (Wrangler config) |
| Web3Forms | feedback | `PUBLIC_WEB3FORMS_KEY` (public by design) |

No analytics, no cookies, no third-party requests except the feedback POST.

## Later (not in v1)
Companion flow: per-user unlock codes (HMAC of a random participant id and station number, computed in the browser), a password-gated companion area with session guides. Add as a change request when the client starts working with companions.

## Terms
| Hebrew | Code | UI |
|---|---|---|
| חוזרים לחיים | backToLife | חוזרים לחיים |
| תחנה | station | תחנה |
| מד פתיחה | baseline | מד פתיחה |
| 8 הצרכים | needs | 8 הצרכים |
| גוף ונפש | bodyMind | גוף ונפש |
| הכלים שלי | myTools | הכלים שלי |
| יומן | diary | היומן שלי |
| ערכת כלים | tools | ערכת כלים |
| מעקב | tracking | מעקב |
| נספחים | appendix | כלים ונספחים |
| משוב | feedback | שימושי / לא ברור / חסר לי |
