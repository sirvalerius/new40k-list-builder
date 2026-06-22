import { describe, it, expect } from 'vitest';
import { reconcileTiers, tierForPick, bracketForCount, buildListUnit, datasheetMap, unitTotal, optionMax, equippedWeapons, clampLoadout, unitGroup, eligibleBodyguards, attachedLeaders, stratagemAppliesTo, effectiveKeywords, enhancementAllowed } from './helpers';
import type { ArmyList, ChosenWargear, Datasheet, Detachment, FactionData, ListUnit, PointsOption, Weapon } from './types';

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

// Outrider Squad: 5 bikes + optional Invader ATV; the ATV's gun can swap to a multi-melta.
const w = (name: string): Weapon =>
  ({ name, type: 'Ranged', range: '24', A: '1', BS_WS: '3', S: '4', AP: '0', D: '1', description: '' });
const outriders = ds({
  id: 'out', name: 'Outrider Squad', model_min: 6, model_max: 6,
  weapons: [w('Twin bolt rifle'), w('Onslaught gatling cannon'), w('Multi-melta'), w('Astartes chainsword')],
  weapon_options: [
    { text: "An Invader ATV's onslaught gatling cannon can be replaced with 1 multi-melta.",
      cost: 0, type: 'wargear', limit: { kind: 'fixed', max: 1 }, base: 'onslaught gatling cannon',
      model: 'INVADER ATV', grants: ['Multi-melta'] },
    { text: '1 Invader ATV', cost: 60, type: 'model', limit: { kind: 'fixed', max: 1 }, base: '',
      model: 'INVADER ATV', grants: [] },
  ],
});
const ATV = '1 Invader ATV';
const MM = "An Invader ATV's onslaught gatling cannon can be replaced with 1 multi-melta.";
const names = (ws: Weapon[]) => ws.map((x) => x.name);

describe('equippedWeapons (show only what the unit fields)', () => {
  it('no ATV: hides the ATV gun and the multi-melta upgrade', () => {
    const eq = names(equippedWeapons(outriders, []));
    expect(eq).toContain('Twin bolt rifle');
    expect(eq).toContain('Astartes chainsword');
    expect(eq).not.toContain('Onslaught gatling cannon'); // sub-model not bought
    expect(eq).not.toContain('Multi-melta');               // upgrade not taken
  });
  it('ATV bought, no swap: shows the gatling cannon, not the multi-melta', () => {
    const eq = names(equippedWeapons(outriders, [{ name: ATV, cost: 60, qty: 1 }]));
    expect(eq).toContain('Onslaught gatling cannon');
    expect(eq).not.toContain('Multi-melta');
  });
  it('ATV + multi-melta: shows the multi-melta, hides the replaced gatling', () => {
    const eq = names(equippedWeapons(outriders, [
      { name: ATV, cost: 60, qty: 1 },
      { name: MM, cost: 0, qty: 1 },
    ]));
    expect(eq).toContain('Multi-melta');
    expect(eq).not.toContain('Onslaught gatling cannon');
  });
  it('browsing (undefined) shows every weapon', () => {
    expect(equippedWeapons(outriders, undefined)).toHaveLength(4);
  });
});

describe('clampLoadout drops sub-model options when the model is removed', () => {
  it('removing the ATV drops its multi-melta', () => {
    const unit = { ...buildListUnit(outriders, outriders.points[0] ?? { description: '', cost: '0' }, 6),
      wargearCosts: [{ name: MM, cost: 0, qty: 1 }] as ChosenWargear[] };
    expect(clampLoadout(unit, outriders).find((x) => x.name === MM)).toBeUndefined();
  });
  it('keeps the multi-melta while the ATV is present', () => {
    const unit = { ...buildListUnit(outriders, outriders.points[0] ?? { description: '', cost: '0' }, 6),
      wargearCosts: [{ name: ATV, cost: 60, qty: 1 }, { name: MM, cost: 0, qty: 1 }] as ChosenWargear[] };
    const out = clampLoadout(unit, outriders);
    expect(out.find((x) => x.name === MM)?.qty).toBe(1);
  });
});

describe('unitGroup (roster sub-type)', () => {
  const mkU = (p: Partial<ListUnit>): ListUnit =>
    ({ uid: 'u', datasheetId: 'd', name: 'N', pointsCost: 0, pointsLabel: '', isEpicHero: false,
       isBattleline: false, isCharacter: false, isAlly: false, warlord: false, ...p });
  it('classifies by epic hero > character > battleline > other', () => {
    expect(unitGroup(mkU({ isEpicHero: true, isCharacter: true }))).toBe('epic');
    expect(unitGroup(mkU({ isCharacter: true }))).toBe('leader');
    expect(unitGroup(mkU({ isBattleline: true }))).toBe('battleline');
    expect(unitGroup(mkU({}))).toBe('other');
  });
});

describe('Leader/Support attachment', () => {
  const captain = ds({ id: 'cap', name: 'Captain', is_character: true, is_leader: true, can_lead: ['squad'] });
  const squad = ds({ id: 'squad', name: 'Intercessors', is_battleline: true });
  const other = ds({ id: 'oth', name: 'Tank' });
  const dsMap = datasheetMap({ datasheets: [captain, squad, other] } as unknown as FactionData);
  const u = (over: Partial<ListUnit>): ListUnit =>
    ({ uid: Math.random().toString(36), datasheetId: 'squad', name: 'Intercessors', pointsCost: 0,
       pointsLabel: '', isEpicHero: false, isBattleline: true, isCharacter: false, isAlly: false, warlord: false, ...over });
  it('offers only bodyguard units the leader can join', () => {
    const sq = u({ uid: 's1' });
    const tk = u({ uid: 't1', datasheetId: 'oth', name: 'Tank', isBattleline: false });
    const list = { units: [sq, tk] } as ArmyList;
    const elig = eligibleBodyguards(captain, list, dsMap);
    expect(elig.map((x) => x.uid)).toEqual(['s1']); // not the Tank
  });
  it('attachedLeaders finds characters joined to a bodyguard', () => {
    const sq = u({ uid: 's1' });
    const cap = u({ uid: 'c1', datasheetId: 'cap', name: 'Captain', isCharacter: true, isBattleline: false, attachedToUid: 's1' });
    const list = { units: [sq, cap] } as ArmyList;
    expect(attachedLeaders('s1', list).map((x) => x.uid)).toEqual(['c1']);
  });
});

describe('stratagemAppliesTo (keyword AND/OR matching)', () => {
  const vocab = ['ADEPTUS ASTARTES', 'INFANTRY', 'VEHICLE', 'TERMINATOR', 'FLY', 'PSYKER', 'MONSTER'];
  it('adjacent keywords are AND (needs all)', () => {
    const s = 'TARGET: One ADEPTUS ASTARTES INFANTRY unit. EFFECT: +1.';
    expect(stratagemAppliesTo(s, ['ADEPTUS ASTARTES', 'INFANTRY'], vocab)).toBe(true);
    // an Adeptus Astartes VEHICLE is not INFANTRY -> excluded
    expect(stratagemAppliesTo(s, ['ADEPTUS ASTARTES', 'VEHICLE'], vocab)).toBe(false);
  });
  it('"VEHICLE FLY" needs both keywords', () => {
    const s = 'TARGET: One VEHICLE FLY unit. EFFECT: x.';
    expect(stratagemAppliesTo(s, ['VEHICLE', 'FLY'], vocab)).toBe(true);
    expect(stratagemAppliesTo(s, ['VEHICLE'], vocab)).toBe(false); // grounded vehicle
  });
  it('"MONSTER/VEHICLE" or "MONSTER or VEHICLE" needs either', () => {
    expect(stratagemAppliesTo('TARGET: One MONSTER/VEHICLE unit.', ['VEHICLE'], vocab)).toBe(true);
    expect(stratagemAppliesTo('TARGET: One MONSTER or VEHICLE unit.', ['MONSTER'], vocab)).toBe(true);
    expect(stratagemAppliesTo('TARGET: One MONSTER/VEHICLE unit.', ['INFANTRY'], vocab)).toBe(false);
  });
  it('PSYKER requirement excludes non-psykers', () => {
    const s = 'TARGET: One friendly PSYKER unit. EFFECT: cast.';
    expect(stratagemAppliesTo(s, ['INFANTRY', 'PSYKER'], vocab)).toBe(true);
    expect(stratagemAppliesTo(s, ['INFANTRY'], vocab)).toBe(false);
  });
  it('ignores "excluding" clauses for the requirement but excludes named keywords', () => {
    const s = 'TARGET: One ADEPTUS ASTARTES unit (excluding TERMINATOR).';
    expect(stratagemAppliesTo(s, ['ADEPTUS ASTARTES'], vocab)).toBe(true);
    expect(stratagemAppliesTo(s, ['ADEPTUS ASTARTES', 'TERMINATOR'], vocab)).toBe(false);
    expect(stratagemAppliesTo('TARGET: One unit from your army.', ['VEHICLE'], vocab)).toBe(true);
  });
  it('Rapid Ingress: general target but excludes AIRCRAFT', () => {
    const s = 'TARGET: One friendly unit in Strategic Reserves. EFFECT: Ingress. RESTRICTIONS: cannot select an Aircraft.';
    const voc = [...vocab, 'AIRCRAFT'];
    expect(stratagemAppliesTo(s, ['INFANTRY'], voc)).toBe(true);
    expect(stratagemAppliesTo(s, ['VEHICLE', 'AIRCRAFT', 'FLY'], voc)).toBe(false);
  });
});

describe('enhancementAllowed ("X model only" keyword requirement)', () => {
  const vocab = ['ADEPTUS ASTARTES', 'GRAVIS', 'CAPTAIN', 'TECHMARINE', 'INFANTRY', 'WATCH MASTER'];
  it('enforces a single keyword requirement', () => {
    expect(enhancementAllowed('GRAVIS model only. +1 W.', ['CAPTAIN', 'GRAVIS'], vocab)).toBe(true);
    expect(enhancementAllowed('GRAVIS model only. +1 W.', ['CAPTAIN', 'INFANTRY'], vocab)).toBe(false);
  });
  it('handles "A or B model only" as OR', () => {
    const d = 'Watch Master or Techmarine model only. Re-roll.';
    expect(enhancementAllowed(d, ['TECHMARINE'], vocab)).toBe(true);
    expect(enhancementAllowed(d, ['CAPTAIN'], vocab)).toBe(false);
  });
  it('enforces "<keyword> unit only" (Upgrade enhancements), not just "model only"', () => {
    const v2 = [...vocab, 'RANGERS', 'ASTRA MILITARUM', 'PLATOON'];
    expect(enhancementAllowed('RANGERS unit only. Infiltrators.', ['RANGERS'], v2)).toBe(true);
    expect(enhancementAllowed('RANGERS unit only. Infiltrators.', ['INFANTRY'], v2)).toBe(false);
    // multi-keyword AND requirement
    const d = 'ASTRA MILITARUM INFANTRY PLATOON unit only. Move.';
    expect(enhancementAllowed(d, ['ASTRA MILITARUM', 'INFANTRY', 'PLATOON'], v2)).toBe(true);
    expect(enhancementAllowed(d, ['ASTRA MILITARUM', 'INFANTRY'], v2)).toBe(false);
  });
  it('matches across curly apostrophes', () => {
    const v = ["EMPEROR’S CHILDREN", 'INFANTRY'];
    expect(enhancementAllowed('Emperor’s Children model only. +1 A.', ["Emperor's Children"], v)).toBe(true);
    expect(enhancementAllowed('Emperor’s Children model only. +1 A.', ['INFANTRY'], v)).toBe(false);
  });
  it('matches "<unit name> only" without the word model/unit', () => {
    const v = ['BIOLOGUS PUTRIFIER', 'INFANTRY'];
    expect(enhancementAllowed('Biologus Putrifier only. Re-roll.', ['Biologus Putrifier'], v)).toBe(true);
    expect(enhancementAllowed('Biologus Putrifier only. Re-roll.', ['INFANTRY'], v)).toBe(false);
  });
  it('ignores "(excluding …)" parentheticals in the requirement', () => {
    const v = ['HERETIC ASTARTES', 'DAMNED', 'INFANTRY'];
    const d = 'Heretic Astartes model (excluding Damned models) only. +1 D.';
    expect(enhancementAllowed(d, ['HERETIC ASTARTES'], v)).toBe(true);
    expect(enhancementAllowed(d, ['INFANTRY'], v)).toBe(false);
  });
  it('no "model/unit only" clause -> allowed', () => {
    expect(enhancementAllowed('Add 1 to wound rolls.', ['INFANTRY'], vocab)).toBe(true);
  });
  it('fails open when the required keyword is not in the vocab', () => {
    expect(enhancementAllowed('PHOBOS model only.', ['INFANTRY'], vocab)).toBe(true);
  });
});

describe('effectiveKeywords (detachment-granted keywords)', () => {
  const fulguris = { keyword_grants: [{ when: ['LAND SPEEDER', 'STORM SPEEDER HAILSTRIKE'], grant: 'SPEEDER' }] } as Detachment;
  it('grants the keyword to a matching unit', () => {
    expect(effectiveKeywords(['Land Speeder', 'Vehicle', 'Fly'], [fulguris])).toContain('SPEEDER');
  });
  it('does not grant it to a non-matching unit (e.g. a Mounted Epic Hero)', () => {
    expect(effectiveKeywords(['Character', 'Mounted', 'Epic Hero'], [fulguris])).not.toContain('SPEEDER');
  });
  it('a SPEEDER stratagem then excludes the non-speeder unit but includes the speeder', () => {
    const vocab = ['SPEEDER', 'VEHICLE', 'MOUNTED'];
    const s = 'WHEN: Move. TARGET: That SPEEDER unit. EFFECT: ingress.';
    const khan = effectiveKeywords(['Character', 'Mounted'], [fulguris]);
    const speeder = effectiveKeywords(['Land Speeder', 'Vehicle'], [fulguris]);
    expect(stratagemAppliesTo(s, khan, vocab)).toBe(false);
    expect(stratagemAppliesTo(s, speeder, vocab)).toBe(true);
  });
});

describe('optionMax (weapon option limits)', () => {
  it('per_n = 1 per N models (floor)', () => {
    expect(optionMax({ kind: 'per_n', n: 10 }, 20)).toBe(2);
    expect(optionMax({ kind: 'per_n', n: 10 }, 10)).toBe(1);
    expect(optionMax({ kind: 'per_n', n: 10 }, 9)).toBe(0);
    expect(optionMax({ kind: 'per_n', n: 5 }, 12)).toBe(2);
  });
  it('all = one per model', () => {
    expect(optionMax({ kind: 'all' }, 6)).toBe(6);
  });
  it('slots = modelCount x slots (aggregate per-model)', () => {
    expect(optionMax({ kind: 'slots', slots: 2 }, 6)).toBe(12);
    expect(optionMax({ kind: 'slots', slots: 3 }, 3)).toBe(9);
  });
  it('fixed and note/undefined', () => {
    expect(optionMax({ kind: 'fixed', max: 1 }, 10)).toBe(1);
    expect(optionMax({ kind: 'note' }, 10)).toBeNull();
    expect(optionMax(undefined, 10)).toBeNull();
  });
});
