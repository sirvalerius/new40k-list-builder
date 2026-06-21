# Product

## Register

product

## Users

Warhammer 40,000 **11th edition (#new40k)** players who build and manage army lists.
Primary: the maker (Alhazred.sh) and a small group of friends play-testing the tool.
Context of use is mobile-first and often hostile: a phone held one-handed at the gaming
table, in poor ambient light, sometimes offline. They reach for it twice — once to *build*
a legal list before a game, and again *during* the game as a quick rules/stat reference so
they don't have to open the rulebook.

## Product Purpose

Build legal #new40k army lists with **live validation** (Detachment Points budget, unit
limits / Rule of Three, Epic-Hero uniqueness, enhancement limits, allies caps, unit→detachment
requirements), choose models and paid wargear with correct per-option/sub-model limits, assign
enhancements and a Warlord, and attach Leaders/Support. A separate in-game **"Partita" (bunker)**
mode shows, per fielded unit, its statline, *equipped* weapons, abilities and the **applicable
stratagems** (core + detachment, keyword-filtered). Lists persist locally with portable
JSON backup. Success = a player builds a legal list on their phone and runs their whole game
from the app without touching the physical rules.

## Brand Personality

Grimdark, Imperial, gothic — but a working tool, not a museum piece. Voice is austere and
martial yet plain-spoken (Administratum efficiency, not flowery lore). Three words:
**grimdark, Imperial, utilitarian.** The mood lives in the chrome (titles, frames, empty and
loading states, the seal-like FAB); the data stays ruthlessly clear.

## Anti-references

- **Generic SaaS dashboards** — cream/near-white surfaces, soft friendly rounded cards,
  corporate-cheerful tone, endless identical icon+heading+text card grids.
- **Austere spreadsheets** — a cold technical data table with zero setting personality.
- **1:1 clones of the official Games Workshop / warhammer.com site** — borrow the *mood* of
  the setting, never copy GW's actual layout, art, or chrome.

## Design Principles

1. **Atmosphere in the frame, clarity in the data.** Theme the chrome hard; never let flavor
   (fonts, ornament, texture) sit between the player and a stat line, points value, or option.
2. **Table-ready.** Legible at arm's length on a phone in bad light; fast to operate one-handed
   mid-game. Speed and reach beat decoration.
3. **Rules you can trust.** The product's worth is correctness — surface legality (DP, limits,
   requirements, exclusions) visibly and honestly, never hide a violation to look tidy.
4. **Grimdark, not gaudy.** Imperial gravity over flashy effects. Restraint is part of the 40k
   mood; no neon, no decorative glass, no gradient shouting.
5. **Offline and resilient.** It has to work with no signal at the table.

## Accessibility & Inclusion

Target **WCAG AA** for all data text (dark theme: bone/gold ink on near-black; verify ≥4.5:1
for body, ≥3:1 for large). Touch targets ≥44px; visible gold keyboard-focus rings; honor
`prefers-reduced-motion`; never encode meaning in colour alone (pair colour with labels/badges,
e.g. legality and "needs X" states); no body text below 14px on mobile.
