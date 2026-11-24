# GO ON: design

Source: the approved mockup `docs/mockup/direction-g.html`. The build uses only these tokens (defined in the `@theme` block of `src/styles/global.css`). No colors, fonts, sizes or spacing outside them.

## Colors (OKLCH)
| Token | Value | Use |
|---|---|---|
| `ink` | `oklch(35.1% 0.165 268.8)` | headings, body text, primary icons, dark buttons |
| `ink-2` | `oklch(46.7% 0.084 273.5)` | secondary text, descriptions, inactive nav |
| `paper` | `oklch(100% 0 0)` | page background, cards |
| `sky` | `oklch(94% 0.026 239.1)` | intro band, help pill, quiet surfaces |
| `line` | `oklch(91% 0.022 245.9)` | dividers, card borders |
| `go` | `oklch(52.5% 0.127 146.3)` | **actions only**: primary buttons, links that act |
| `go-hover` | `oklch(46.6% 0.115 146.1)` | hover/active of `go` |

Icon tiles: a pastel tile with the icon in a deeper shade of the same hue. Six pairs, `t-*` (tile) and `i-*` (icon): green, pink, blue, yellow, orange, purple. Each topic keeps one fixed pair everywhere it appears.

| Pair | Tile | Icon |
|---|---|---|
| green | `oklch(95.3% 0.036 140.2)` | `oklch(52.5% 0.127 146.3)` |
| pink | `oklch(93.9% 0.03 359.5)` | `oklch(55.1% 0.181 7.2)` |
| blue | `oklch(94.1% 0.025 261.1)` | `oklch(49.1% 0.184 264.9)` |
| yellow | `oklch(96% 0.05 89.8)` | `oklch(57.8% 0.125 69.8)` |
| orange | `oklch(94.1% 0.036 56.5)` | `oklch(57.9% 0.161 44.3)` |
| purple | `oklch(93.7% 0.029 303.1)` | `oklch(49.1% 0.191 293.4)` |

Contrast (checked, WCAG AA): ink on paper 11.8:1, ink on sky 10:1, ink-2 on paper 7:1, white on go 5.1:1. The rainbow appears only in the logo. The one hex value outside the tokens is `<meta name="theme-color" content="#ffffff">` (= `paper`), because that meta tag is read by the browser UI.

## Type
- Headings: Fredoka 600 (display, h1, h2), Fredoka 500 (list titles, card titles). Body and UI: Assistant 400/600/700.
- Scale: h1 `clamp(34px, 7.4vw, 64px)` / h2 30px / card title 20–22px / body 17px / lead 19px / small 15px / nav label 13px.
- Line height: headings 1.08–1.25, body 1.55. Line length under 75 characters.

## Spacing and shape
- Touch targets at least 44px high, including the logo and footer links.
- Page gutter 20px, max width 1080px. Section spacing 40px.
- Radius: tiles 14px (48px tile), 18px (60px app tile), 22px (76px app tile); cards 18px; pills 999px. Not one radius for everything.
- No shadows. Borders (2px `line`) separate cards; hover turns the border `ink`.

## Components
- **Intro band:** `sky` background, h1 + one lead sentence. No illustration.
- **Need row:** icon tile 48px + title (Fredoka 500, 22px) + one-line description; 1px `line` divider; 2 columns from 768px.
- **Tool card (הכלים שלי):** 2px border, tile + title + one line; 2 columns on mobile, 4 from 768px.
- **App grid (גוף ונפש):** 5 equal columns from 400px; below 400px (most phones), 3 + 2 centered. Tile above a centered label; the tile scales to its column (max 60px, 76px from 768px).
- **Primary button:** `go` background, white text, 14px radius. One primary action per screen.
- **Bottom nav:** fixed, 5 items, icon + label (13px, `text-tiny`, the only use of this size), current item `ink` and bold, honoring `safe-area-inset-bottom`.
- **Help pill** in the header on every page: "צריך עזרה עכשיו?" → `/safety`.
- **Feedback** at the end of every topic and station: three pill buttons and an optional text field.

## RTL rules
- `<html lang="he" dir="rtl">`. Logical properties only: `ms-/me-`, `ps-/pe-`, `start/end`, `text-start`, `inset-inline`, `margin-inline`. Never `ml-`, `left-`, `text-left`.
- Directional icons point to the reading direction: "forward" is `arrow-left` / `caret-left`.
- Numbers and ranges in text: write "18 עד 44", not "18–44" (bidi reordering).

## Motion (visual level 1)
CSS transitions only (border color, background, ≤ 150ms). Honor `prefers-reduced-motion`. No animation library.

## Banned patterns
- purple-to-blue or cyan gradients on buttons, headings or backgrounds; gradient text
- glassmorphism with neon glow
- a centered hero with a single button followed by three identical cards
- the same corner radius and shadow on every element; boxes inside boxes
- vague headlines ("הפתרון המושלם עבורך"): say what it is and for whom
- a default font with no hierarchy between headings and body
- decorative use of the accent color `go`: it is for actions only
