# GO ON: architecture

Type 1: static PWA, no server of our own. All personal data stays on the user's device.
Version 1 has no companion flow (no unlock codes, no companion area, no participant number); see "Later" below.

## Stack
- Astro 7 (static output) + Tailwind CSS 4 + TypeScript
- Preact islands for interactive parts (station worksheets, diary, tools, calculators, tracking, feedback)
- Content in Markdown via Astro content collections (`src/content/`), separated from code so a CMS (Keystatic) can be added later. Topic pages: one folder per topic in `src/content/topics/<topic>/`, one Markdown file per section; a section's frontmatter can add a worksheet, a status checklist, resource cards, internal links or tools
- "חוזרים לחיים": hub texts and baseline domains in `src/content/back-to-life.json`; stations in `src/content/stations/<nn>.md` (frontmatter only); intro, before, baseline and appendix are topic folders `src/content/topics/back-to-life-<part>/`
- PWA: `@vite-pwa/astro` 2.x (Workbox precache of all pages and assets; works offline after first load)
- Hosting: Cloudflare Workers with static assets, account in the client's name. Until then, previews on GitHub Pages (https://guycohen85.github.io/go-on/), deployed by `.github/workflows/pages.yml` on every push to main with `BASE_PATH=/go-on/` and `PUBLIC_PREVIEW=1` (noindex)
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
- Storage: IndexedDB (`idb-keyval`), one key per area: `progress`, `baseline`, `worksheet:<id>`, `checklist:<id>`, `log:<id>`, `diary` (encrypted blob), `feedbackQueue`.
- Progress (`progress`): station number → ISO date it was marked done. Each station has a "סיימתי" button and a way to undo it; the hub shows which stations are done and links to the next undone one. Nothing is locked.
- Station worksheets: `worksheet:station-<n>`, one field per question, keyed by the field id in the station file (keep ids stable).
- Baseline (`baseline`): `{ start, again }`, each a map of domain text → 0 to 10. `again` is the re-rating in station 11, shown next to `start`.
- Logs (`log:<id>`): append-only lists (activity, brain training, between stations), shown on the tracking page.
- Diary (`src/lib/diary.ts`): stored as `{ v: 1, iter, salt, iv, data }` (base64). Key: PBKDF2-SHA-256, 600,000 iterations, 16-byte random salt → AES-GCM 256, non-extractable, kept in memory only while open; a fresh 12-byte IV on every save. The plaintext is `{ journal, questions, symptoms, plan }`, re-encrypted whole on each change; saves, code changes and deletion run through one queue so no late write uses an old key. The diary is read without the storage timeout, so a slow read never looks like "no diary" (creating one would overwrite it). Locks after 5 minutes without activity in the diary, on leaving the page, and by button. A forgotten code cannot be recovered (stated in the UI).
- Other keys: `steps:<YYYY-MM-DD>` and `steps:goal` (step counter), `meta:lastBackup`.
- Backup (`/settings`): one JSON file `{ app: "go-on", version: 1, exportedAt, data: { <key>: <value> } }` with every key except `feedbackQueue`; the diary stays encrypted inside it, the rest is plain. Import checks `app` and `version`, asks once, then replaces everything (clear + setMany). Persistent storage is requested via `navigator.storage.persist()` after the first successful write.
- Tracking (`/tracking`): the baseline gauge in `auto` mode (first rating = `start`, later = `again`), a weekly habit worksheet, and a read-only history of every `log:*` list and the step counter. Field names come from the log form that writes each list.
- Toolkit (`/tools`): worksheets; the hard-day card, week plan and conversation prep share their ids with the "חוזרים לחיים" appendix, so answers are the same in both places.
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
