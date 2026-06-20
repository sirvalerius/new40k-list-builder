import { describe, it, expect } from 'vitest';
import { reconcileTiers, tierForPick, buildListUnit, datasheetMap } from './helpers';
import type { Datasheet, FactionData, PointsOption } from './types';

function ds(partial: Partial<Datasheet>): Datasheet {
  return {
    id: 'x', name: 'X', role: '', legend: '', stats: [], weapons: [], abilities: [],
    composition: [], options: [], points: [], keywords: [], faction_keywords: [],
    can_lead: [], is_character: false, is_battleline: false, is_epic_hero: false,
    is_dedicated_transport: false, has_order_tiers: false, ...partial,
  };
}
const opt = (description: string, cost: string, variant: string, lo: number | null, hi: number | null): PointsOption =>
  ({ description, cost, variant, tier_min: lo, tier_max: hi });

// Defiler-style: one variant, escalates 1st -> 2nd+
const defiler = ds({
  id: 'def', name: 'Defiler', has_order_tiers: true,
  points: [opt('1 model (1st unit)', '290', '1 model', 1, 1), opt('1 model (2nd+ unit)', '320', '1 model', 2, null)],
});
// Genestealers-style: two variants (5/10 models), each with 1st-2nd vs 3rd+
const gs = ds({
  id: 'gs', name: 'Genestealers', has_order_tiers: true,
  points: [
    opt('5 models (1st-2nd unit)', '75', '5 models', 1, 2),
    opt('10 models (1st-2nd unit)', '140', '10 models', 1, 2),
    opt('5 models (3rd+ unit)', '85', '5 models', 3, null),
    opt('10 models (3rd+ unit)', '150', '10 models', 3, null),
  ],
});
const flat = ds({ id: 'flat', name: 'Flat', points: [opt('1 model', '100', '1 model', null, null)] });

const map = datasheetMap({ datasheets: [defiler, gs, flat] } as unknown as FactionData);
const mk = (d: Datasheet, variant: string) => ({ ...buildListUnit(d, d.points.find((p) => (p.variant ?? p.description) === variant)!), uid: Math.random().toString(36) });

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
