# GO ON: architecture

Type 1: static PWA, no server of our own. All personal data stays on the participant's device.

## Stack
- Astro 7 (static output) + Tailwind CSS 4 + TypeScript
- Preact islands for interactive parts (station forms, diary, tools, calculators, companion code screen)
- Content in Markdown/MDX via Astro content collections (`src/content/`), separated from code so a CMS (Keystatic) can be added later
- PWA: `@vite-pwa/astro` 2.x (Workbox precache of all pages and assets; works offline after first load)
- Hosting: Cloudflare Workers with static assets, account in the client's name
- Fonts self-hosted via Fontsource (Fredoka, Assistant); icons: Phosphor (inline SVG at build time)

## Sitemap
```
/                        home: process entry, 8 needs, body & mind
/process                 personal process hub
/process/intro           introduction to the process
/process/before          before we start
/process/baseline        baseline check (מד פתיחה)
/process/station/[1-12]  stations; locked until unlocked with a code
/process/appendix        appendices (weekly plan, conversation prep, hard-day card, between-sessions log)
/topics/[slug]           fertility-sexuality, relationships, return, rights, parenting,
                         community, aya, health, physio, brain, meditation
/diary                   encrypted personal diary
/tools                   toolkit
/tracking                tracking
/safety                  when to seek help (always one tap away)
/references              sources
/settings                participant number, backup export/import, delete all data
/companion               password gate → session structure guide
/companion/station/[n]   companion notes per station
/companion/code          generate unlock code: participant number + station → code
/privacy, /accessibility privacy notice, accessibility statement
```

## Data on the device
- Storage: IndexedDB (`idb-keyval`), one key per area: `progress`, `stations/<n>`, `baseline`, `tracking`, `tools/*`, `diary` (encrypted blob), `participant`.
- Participant number: random 6-character code (unambiguous alphabet) created on first launch, shown in the process screen and in settings.
- Diary: AES-GCM via Web Crypto, key derived from the personal code with PBKDF2. Auto-lock after 5 minutes of inactivity. A forgotten code cannot be recovered (stated clearly in the UI).
- Backup: export everything to a JSON file (diary stays encrypted inside it); import restores it. Persistent storage requested via `navigator.storage.persist()`.
- A visible notice wherever the user writes: saved only on this device.

## Unlock codes
- `code = first 4 digits of HMAC-SHA256(APP_SECRET, participantId + ":" + station)`.
- The companion screen computes the same code from the participant number and the station number.
- `APP_SECRET` ships in the bundle: this is a pacing tool, not a security lock. Documented as such.
- Station 1 is open after the baseline check; stations 2–12 need a code. A wrong code shows a gentle message, with no lockout.

## Companion area
- Password gate checked in the browser (hash compared client-side). Not real security; the area holds only guidance content, no personal data.
- No access to any participant data: none exists outside the participant's device.

## Feedback
- Every topic and station ends with "שימושי / לא ברור / חסר לי" plus an optional short text field (with a hint not to write personal details).
- POST to Web3Forms (`https://api.web3forms.com/submit`) with `access_key`, module id, rating, text, app version. No participant number, no identifying data. Arrives by email to the client.
- Offline: queued in IndexedDB and sent when back online.

## External services
| Service | Use | Env var |
|---|---|---|
| Cloudflare Workers (static assets) | hosting | – (Wrangler config) |
| Web3Forms | feedback | `PUBLIC_WEB3FORMS_KEY` (public by design) |

Build-time config: `PUBLIC_COMPANION_PASSWORD_HASH`, `PUBLIC_UNLOCK_SECRET`. No analytics, no cookies, no third-party requests except the feedback POST.

## Terms
| Hebrew | Code | UI |
|---|---|---|
| התהליך האישי | process | התהליך האישי |
| תחנה | station | תחנה |
| מלווה | companion | מלווה |
| משתתף/ת | participant | משתתף/ת |
| מספר משתתף | participantId | מספר המשתתף שלך |
| קוד פתיחה | unlockCode | קוד לתחנה |
| מד פתיחה | baseline | מד פתיחה |
| 8 הצרכים | needs | 8 הצרכים |
| מעטפת גוף ונפש | bodyMind | גוף ונפש |
| יומן | diary | היומן שלי |
| נספחים | appendix | כלים ונספחים |
