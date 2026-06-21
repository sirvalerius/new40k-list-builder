# Design

Visual system for the New40k List Builder. Grimdark-Imperial **chrome**, ruthlessly clear
**data** (see PRODUCT.md). Dark theme only — it matches the setting and the table-side context.

## Theme

Single dark theme. Atmosphere comes from a centre-lit **vignette** (gold bleed at the top,
shadow at the edges), an Imperial-gold/blood-red/bone palette, and a gothic display face on the
chrome. The content surfaces stay near-black so stat lines and points read instantly.

## Color (tokens in `src/index.css :root`)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0b0f` | app background (near-black) |
| `--bg-elev` | `#13151c` | cards / content surface |
| `--bg-elev2` | `#1b1f29` | inputs, badges, controls (second neutral layer) |
| `--border` | `#2b3140` | hairlines |
| `--border-gold` | `#4a3c17` | gold rules / hover edges |
| `--text` | `#e7e3d8` | body / data ink (bone-white) |
| `--text-dim` | `#9a948a` | secondary / muted (parchment) |
| `--bone` | `#cdbf9e` | title ink |
| `--accent` | `#b62626` | **blood red** — primary action / FAB / danger fills (always behind white text, never small text) |
| `--accent-2` | `#c9a43a` | **Imperial gold** — section headings, current selection, focus ring, the ✠ |
| `--ok / --warn / --err` | `#3fb950 / #d29922 / #f85149` | legality states |

**Strategy: Restrained.** Gold + red are used only for headings, selection/active, state, and
the focus ring — never as decoration. Contrast is verified AA: body 15.3:1, muted ≥5.5:1, gold
headers 8.3:1. Never encode meaning in colour alone — pair with labels/badges ("needs X",
"Over budget", "Warlord").

## Typography

- **Display:** `Cinzel` (Google Fonts, runtime-cached for offline) — **chrome only**: app title,
  section headings, bunker titles. Uppercase, `letter-spacing 0.02–0.08em`, `text-wrap: balance`.
- **Body / data / labels / buttons:** the system sans stack (`system-ui, -apple-system, 'Segoe
  UI', Roboto`). Never put the display face on data, labels, or controls.
- Fixed rem scale (not fluid): h1 1.3 / h2 1.1 / h3 ~0.8–0.98rem; body 1rem; small 0.85; tiny
  0.75. Data uses `font-variant-numeric: tabular-nums`. No text below ~0.75rem; nothing critical
  below 14px on mobile.

## Iconography

Sparse glyph set, consistent: Imperial cross `✠` (brand mark + section markers), `★/☆`
favourites, `−/＋` steppers, `🐞` feedback, `🛡` in-game tab, `🗑` delete. No icon library.

## Layout & spacing

- App column `max-width: 680px`, centred. Mobile-first; responsiveness is structural.
- Cards for genuine groupings only; **no nested cards**. Radius 10px.
- Section headings: gold uppercase Cinzel with a `✠` marker and a hairline rule.
- Touch targets ≥44px (`--tap`). Z-index is semantic (content < sticky topbar < summary/FAB <
  modal-backdrop < modal).
- Fixed contextual controls (FAB, summary bar) pin to the **visual viewport** during pinch-zoom.

## Components & states

Every interactive element ships **default / hover / focus-visible / active / disabled**; async
paths add **loading**, forms add **error**. Standardised:
- Buttons: `.primary` (blood-red gradient, white text), `.ghost`, `.small`, `.danger`, `.iconbtn`,
  `.stepper`. Hover lifts the border to gold; focus shows a 2px gold ring (`:focus-visible`).
- Inputs/selects/textarea: gold border + soft glow on focus.
- Selection/active uses gold (tabs `.active`, `.det-selected`, `.pill-pts.sel`).
- FAB is a sealed blood-red disc ringed in gold.
- Weapon profiles render as a compact **table** (Range/A/BS-WS/S/AP/D), not inline prose.
- Empty states teach in-voice ("The muster is empty — summon your forces with the ✠ seal").

## Motion

Minimal and state-only (150–250ms, ease-out). No orchestrated load sequences, no bounce/elastic,
no decorative motion. `prefers-reduced-motion: reduce` collapses all animation/transition.

## Bans (this project)

Generic SaaS-dashboard look (cream/soft/identical card grids), austere personality-free
spreadsheet, 1:1 GW-site cloning; gradient text, decorative glassmorphism, side-stripe borders,
display fonts in data/labels.
