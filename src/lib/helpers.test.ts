import { describe, it, expect } from 'vitest';
import { reconcileTiers, tierForPick, bracketForCount, buildListUnit, datasheetMap, unitTotal } from './helpers';
import type { Datasheet, FactionData, PointsOption } from './types';

function ds(partial: Partial<Datasheet>): Datasheet {
  return {
    id: 'x', name: 'X', role: '', legend: '', stats: [], weapons: [], abilities: [],
    composition: [], options: [], points: [], keywords: [], faction_keywords: [],
    can_lead: [], is_character: false, is_battleline: false, is_epic_hero: false,
    is_dedicated_transport: false, has_order_tiers: false, ...partial,
  };
}
const opt = (description: string, cost: string, variant: string, lo: number | null, hi: number | null, models: number | null): PointsOption =>
  ({ description, cost, variant, tier_min: lo, tier_max: hi, models });

// Defiler-style: one variant (1 model), escalates 1st -> 2nd+
const defiler = ds({
  id: 'def', name: 'Defiler', has_order_tiers: true, countable: false, model_min: 1, model_max: 1,
  points: [opt('1 model (1st unit)', '290', '1 model', 1, 1, 1), opt('1 model (2nd+ unit)', '320', '1 model', 2, null, 1)],
});
// Genestealers-style: brackets 5/10 models, each with 1st-2nd vs 3rd+ pick-order tiers
const gs = ds({
  id: 'gs', name: 'Genestealers', has_order_tiers: true, countable: true, model_min: 5, model_max: 10,
  points: [
    opt('5 models (1st-2nd unit)', '75', '5 models', 1, 2, 5),
    opt('10 models (1st-2nd unit)', '140', '10 models', 1, 2, 10),
    opt('5 models (3rd+ unit)', '85', '5 models', 3, null, 5),
    opt('10 models (3rd+ unit)', '150', '10 models', 3, null, 10),
  ],
});
// Termagants-style: brackets 10/20, no pick-order tiers
const termagants = ds({
  id: 'tg', name: 'Termagants', has_order_tiers: false, countable: true, model_min: 10, model_max: 20,
  points: [opt('10 models', '60', '10 models', null, null, 10), opt('20 models', '110', '20 models', null, null, 20)],
});
const flat = ds({ id: 'flat', name: 'Flat', points: [opt('1 model', '100', '1 model', null, null, 1)] });

const map = datasheetMap({ datasheets: [defiler, gs, flat, termagants] } as unknown as FactionData);
const mk = (d: Datasheet, variant: string) => ({ ...buildListUnit(d, d.points.find((p) => (p.variant ?? p.description) === variant)!), uid: Math.random().toString(36) });
const mkCount = (d: Datasheet, count: number) => {
  const variant = bracketForCount(d, count);
  const tier = d.points.find((p) => (p.variant ?? p.description) === variant)!;
  return { ...buildListUnit(d, tier, count), uid: Math.random().toString(36) };
};

describe('tierForPick', () => {
  it('Defiler: 1st pick = 290, 2nd = 320, 3rd = 320', () => {
    expect(tierForPick(defiler, '1 model', 1)!.cost).toBe('290');
    expect(tierForPick(defiler, '1 model', 2)!.cost).toBe('320');
    expect(tierForPick(defiler, '1 model', 3)!.cost).toBe('320');
  });
  it('Genestealers: variant-aware (5 models 1st/3rd, 10 models 1st/3rd)', () => {
    expect(tierForPick(gs, '5 models', 2)!.cost).toBe('75');
    expect(tierForPick(gs, '5 models', 3)!.cost).toBe('85');
    expect(tierForPick(gs, '10 models', 2)!.cost).toBe('140');
    expect(tierForPick(gs, '10 models', 3)!.cost).toBe('150');
  });
});

describe('reconcileTiers', () => {
  it('prices 3 Defilers as 290/320/320 by position', () => {
    const units = [mk(defiler, '1 model'), mk(defiler, '1 model'), mk(defiler, '1 model')];
    const out = reconcileTiers(units, map);
    expect(out.map((u) => u.pointsCost)).toEqual([290, 320, 320]);
  });
  it('removing the 1st copy re-prices the rest (320,320 -> 290,320)', () => {
    const units = reconcileTiers([mk(defiler, '1 model'), mk(defiler, '1 model'), mk(defiler, '1 model')], map);
    const afterRemove = reconcileTiers(units.slice(1), map); // drop the first
    expect(afterRemove.map((u) => u.pointsCost)).toEqual([290, 320]);
  });
  it('respects the chosen variant for Genestealers (5 models x3 -> 75,75,85)', () => {
    const units = [mk(gs, '5 models'), mk(gs, '5 models'), mk(gs, '5 models')];
    expect(reconcileTiers(units, map).map((u) => u.pointsCost)).toEqual([75, 75, 85]);
  });
  it('leaves non-tiered datasheets untouched', () => {
    const units = [mk(flat, '1 model'), mk(flat, '1 model')];
    expect(reconcileTiers(units, map).map((u) => u.pointsCost)).toEqual([100, 100]);
  });
});

describe('bracketForCount (price at the smallest bracket that contains the count)', () => {
  it('Genestealers 5-10: 5->5, 6->10, 7->10, 10->10', () => {
    expect(bracketForCount(gs, 5)).toBe('5 models');
    expect(bracketForCount(gs, 6)).toBe('10 models');
    expect(bracketForCount(gs, 7)).toBe('10 models');
    expect(bracketForCount(gs, 10)).toBe('10 models');
  });
  it('Termagants 10-20: 10->10, 11->20, 14->20, 20->20', () => {
    expect(bracketForCount(termagants, 10)).toBe('10 models');
    expect(bracketForCount(termagants, 11)).toBe('20 models');
    expect(bracketForCount(termagants, 14)).toBe('20 models');
    expect(bracketForCount(termagants, 20)).toBe('20 models');
  });
});

describe('reconcileTiers by model count (countable units)', () => {
  it('7 Genestealers -> 10 bracket (140), 5 -> 75', () => {
    expect(reconcileTiers([mkCount(gs, 7)], map)[0].pointsCost).toBe(140);
    expect(reconcileTiers([mkCount(gs, 5)], map)[0].pointsCost).toBe(75);
  });
  it('three 7-model Genestealers escalate: 140,140,150 (3rd is 3rd+ tier)', () => {
    const units = [mkCount(gs, 7), mkCount(gs, 7), mkCount(gs, 7)];
    expect(reconcileTiers(units, map).map((u) => u.pointsCost)).toEqual([140, 140, 150]);
  });
  it('14 Termagants -> 20 bracket (110)', () => {
    expect(reconcileTiers([mkCount(termagants, 14)], map)[0].pointsCost).toBe(110);
  });
});

describe('unitTotal (base + enhancement + paid wargear)', () => {
  it('sums base, enhancement and qty x cost wargear', () => {
    const u = {
      ...mk(flat, '1 model'),
      enhancementCost: 20,
      wargearCosts: [{ name: 'Thunder Hammer', cost: 5, qty: 3 }],
    };
    expect(unitTotal(u)).toBe(100 + 20 + 15);
  });
  it('zero wargear leaves base unchanged', () => {
    expect(unitTotal(mk(flat, '1 model'))).toBe(100);
  });
});
