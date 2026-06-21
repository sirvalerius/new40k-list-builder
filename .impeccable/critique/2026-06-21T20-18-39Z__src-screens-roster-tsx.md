---
target: Roster
total_score: 28
p0_count: 0
p1_count: 1
timestamp: 2026-06-21T20-18-39Z
slug: src-screens-roster-tsx
---
# Critique — Roster (builder unit-management tab)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live points/DP/enh summary + legality banner + skeletons; no toast on add/remove |
| 2 | Match System / Real World | 3 | Correct 40k terminology; now consistent English |
| 3 | User Control & Freedom | 3 | Remove/Duplicate/steppers/cancel; no global undo |
| 4 | Consistency & Standards | 3 | Unified vocabulary, gold selection, consistent badges |
| 5 | Error Prevention | 3 | Over-budget/at-limit disabled, option caps, needs-detachment, sub-model gating |
| 6 | Recognition over Recall | 3 | Visible options, search, favourites, equipped-loadout datasheet |
| 7 | Flexibility & Efficiency | 2 | No keyboard shortcuts; add is one-unit-at-a-time via modal; no bulk add |
| 8 | Aesthetic & Minimalist | 3 | Distilled redundant badges; card still dense but purposeful |
| 9 | Error Recovery | 3 | Clear validation messages; autosave prevents loss |
| 10 | Help & Documentation | 2 | No inline help for DP / Upgrade / "1 per N" jargon |
| **Total** | | **28/40** | **Good** |

## Anti-Patterns Verdict
LLM: not AI-slop — distinctive grimdark-Imperial identity, font discipline (display on chrome
only), no identical card grids, ✠ reserved to roster dividers. Deterministic scan
(`detect.mjs` on Roster.tsx + index.css): **0 findings**. Measured contrast all WCAG AA.

## What's working
- On-brand identity without slop; live validation + bottom summary (status visibility).
- Consistent component vocabulary; favourites + search; AA contrast + focus-visible + reduced-motion.

## Priority Issues
- **[P1] Efficiency of list-building**: adding units is one-at-a-time through a modal that closes
  on each pick; a 2000pt list is many repetitions. Fix: keep the browse sheet open after add with
  a running count, and/or a quantity control. Command: `/impeccable harden`.
- **[P2] Sub-44px touch targets**: `.small` (34px), `.stepper.sm` (32px) and `.star` (34px) are
  below 44×44 for one-handed table use. Fix: enlarge hit areas. Command: `/impeccable adapt`.
- **[P2] First-timer help**: no inline explanation of DP, the Upgrade tag, "1 per N", Force
  Disposition. Command: `/impeccable clarify`.
- **[P3] Unit-card density**: many controls per card; tuck "Attach to" + datasheet behind
  consistent progressive disclosure. Command: `/impeccable distill`.

## Persona red flags
- **Alex (power user)**: no keyboard shortcuts; one-unit-at-a-time add loop; no bulk.
- **Sam (accessibility)**: strong — AA contrast, focus rings, reduced-motion, aria-labels, native
  selects, skeleton role=status. Watch color-only meaning on legality (currently paired with text).
- **Casey (mobile)**: FAB + summary in thumb zone, state persists, pinch-pin; but secondary
  controls (small buttons/steppers/stars) are 32–34px, under the 44px target.

## Questions
- Is one-unit-at-a-time intentional, or should the browse sheet stay open for rapid mustering?
- Do first-timers among your testers need inline jargon help, or is the audience all veterans?
