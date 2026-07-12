import { describe, it, expect } from 'vitest';
import { reconcileTiers, tierForPick, bracketForCount, buildListUnit, datasheetMap, unitTotal, optionMax, equippedWeapons, clampLoadout, unitGroup, eligibleBodyguards, attachedLeaders, stratagemAppliesTo, effectiveKeywords, enhancementAllowed, enhancementCoreRules, enhancementFor, armyRules, unitAbilities, duplicateList } from './helpers';
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

// Pathfinder-style: 10 models with a stock weapon, up to 3 may swap it for a special weapon —
// the base should stay listed until every model has swapped it away (bug: it used to vanish
// the instant any single model swapped).
const pathfinders = ds({
  id: 'pf', name: 'Pathfinder Team', model_min: 10, model_max: 10,
  weapons: [w('Pulse carbine'), w('Rail rifle')],
  weapon_options: [
    { text: 'Rail rifle (instead of pulse carbine)', cost: 0, type: 'wargear',
      limit: { kind: 'fixed', max: 3 }, base: 'pulse carbine', model: '', grants: ['Rail rifle'] },
  ],
});
const RAIL = 'Rail rifle (instead of pulse carbine)';

describe('equippedWeapons (squad-wide partial swaps keep the base weapon)', () => {
  it('1 of 10 swapped: keeps the base weapon alongside the swap', () => {
    const eq = names(equippedWeapons(pathfinders, [{ name: RAIL, cost: 0, qty: 1 }], 10));
    expect(eq).toContain('Pulse carbine');
    expect(eq).toContain('Rail rifle');
  });
  it('3 of 10 swapped (the option max): base still fielded by the other 7', () => {
    const eq = names(equippedWeapons(pathfinders, [{ name: RAIL, cost: 0, qty: 3 }], 10));
    expect(eq).toContain('Pulse carbine');
  });
  it('every model swapped: base finally disappears', () => {
    const eq = names(equippedWeapons(pathfinders, [{ name: RAIL, cost: 0, qty: 3 }], 3));
    expect(eq).not.toContain('Pulse carbine');
  });
});

// Chaos Terminators-style: a combo base ("combi-bolter and accursed weapon" replaced by 1
// paired accursed weapons) names two weapons in one phrase — bug: the phrase never matched
// either weapon's own name, so both leaked into `grants` and were permanently hidden even
// with nothing chosen, and choosing the swap never actually hid them either.
const terminators = ds({
  id: 'term', name: 'Chaos Terminators', model_min: 5, model_max: 5,
  weapons: [w('Combi-bolter'), w('Accursed weapon'), w('Paired accursed weapons')],
  weapon_options: [
    { text: "1 model's combi-bolter and accursed weapon can be replaced with 1 paired accursed weapons.",
      cost: 0, type: 'wargear', limit: { kind: 'fixed', max: 1 }, base: 'combi-bolter and accursed weapon',
      model: '', grants: ['Paired accursed weapons'] },
  ],
});
const PAIRED = "1 model's combi-bolter and accursed weapon can be replaced with 1 paired accursed weapons.";

describe('equippedWeapons (combo base names two weapons in one phrase)', () => {
  it('nothing chosen: both base weapons still show', () => {
    const eq = names(equippedWeapons(terminators, [], 5));
    expect(eq).toContain('Combi-bolter');
    expect(eq).toContain('Accursed weapon');
  });
  it('1 of 5 swapped: the other 4 still carry both bases alongside the swap', () => {
    const eq = names(equippedWeapons(terminators, [{ name: PAIRED, cost: 0, qty: 1 }], 5));
    expect(eq).toContain('Combi-bolter');
    expect(eq).toContain('Accursed weapon');
    expect(eq).toContain('Paired accursed weapons');
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
  it('caps a weapon offered in two groups by "cannot be equipped with more than one"', () => {
    const defiler = ds({
      id: 'def', name: 'Defiler', model_min: 1, model_max: 1,
      weapons: [w('Electroscourge'), w('Heavy baleflamer'), w('Heavy missile launcher')],
      weapon_options: [
        { text: 'Electroscourge (a model cannot be equipped with more than one electroscourge) (instead of heavy baleflamer)',
          cost: 0, type: 'wargear', limit: { kind: 'fixed', max: 1 }, base: 'heavy baleflamer', group: 'g2', grants: ['Electroscourge'] },
        { text: 'Electroscourge (a model cannot be equipped with more than one electroscourge) (instead of heavy missile launcher)',
          cost: 0, type: 'wargear', limit: { kind: 'fixed', max: 1 }, base: 'heavy missile launcher', group: 'g3', grants: ['Electroscourge'] },
      ],
    });
    const [a, b] = defiler.weapon_options!;
    const unit = { ...buildListUnit(defiler, defiler.points[0] ?? { description: '', cost: '0' }, 1),
      wargearCosts: [{ name: a.text, cost: 0, qty: 1 }, { name: b.text, cost: 0, qty: 1 }] as ChosenWargear[] };
    const out = clampLoadout(unit, defiler);
    expect(out.reduce((s, x) => s + x.qty, 0)).toBe(1); // only one Electroscourge total
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

describe('armyRules (Faction-type ability, deduped, per-datasheet override wins)', () => {
  const oath = { name: 'Oath of Moment', type: 'Faction', parameter: '', description: 'Pick a target.' };
  const vows = { name: 'Templar Vows', type: 'Faction', parameter: '', description: 'Pick a vow.' };
  const core = { name: '', type: 'Core', parameter: '7"', description: '' }; // blank Core ability: never surfaced
  const intercessors = ds({ id: 'int', name: 'Intercessor Squad', abilities: [oath, core] });
  const emperorsChampion = ds({ id: 'ec', name: "Emperor's Champion", abilities: [vows, core] });
  const dsMap = datasheetMap({ datasheets: [intercessors, emperorsChampion] } as unknown as FactionData);
  const u = (datasheetId: string): ListUnit =>
    ({ uid: Math.random().toString(36), datasheetId, name: 'X', pointsCost: 0, pointsLabel: '',
       isEpicHero: false, isBattleline: false, isCharacter: false, isAlly: false, warlord: false });

  it('surfaces the army rule off the fielded datasheet, not a hardcoded faction default', () => {
    const list = { units: [u('int')] } as ArmyList;
    expect(armyRules(list, dsMap).map((r) => r.name)).toEqual(['Oath of Moment']);
  });
  it('a Black Templars-keyword datasheet brings its own override instead', () => {
    const list = { units: [u('ec')] } as ArmyList;
    expect(armyRules(list, dsMap).map((r) => r.name)).toEqual(['Templar Vows']);
  });
  it('dedupes when every unit shares the same rule', () => {
    const list = { units: [u('int'), u('int')] } as ArmyList;
    expect(armyRules(list, dsMap)).toHaveLength(1);
  });
});

describe('unitAbilities (innate rules always shown; wargear-gated only when taken)', () => {
  const stealth = { name: 'Stealth', type: 'Core', parameter: '', description: '-1 to hit.' };
  const armyRule = { name: 'For the Greater Good', type: 'Faction', parameter: '', description: 'Spotting.' };
  const special = { name: 'Forward Observers', type: 'Datasheet', parameter: '', description: 'Re-roll.' };
  const beacon = { name: 'Homing Beacon', type: 'Wargear', parameter: '', description: 'Free Rapid Ingress.' };
  const oneShot = { name: 'One Shot', type: 'Wargear profile', parameter: '', description: 'Once per battle.' };
  const suit = ds({ id: 'st', name: 'Stealth Battlesuits',
    abilities: [stealth, armyRule, special, beacon, oneShot] });
  // matches the real data shape: the option's text is a full sentence, not just the item name
  const BEACON_OPT = "1 Stealth Shas'ui can be equipped with 1 homing beacon.";

  it('browsing (no selected loadout) shows everything except Faction and Wargear profile', () => {
    const names = unitAbilities(suit, undefined).map((a) => a.name);
    expect(names).toEqual(['Stealth', 'Forward Observers', 'Homing Beacon']);
  });
  it('Wargear-type ability is hidden until its option is actually taken', () => {
    const names = unitAbilities(suit, []).map((a) => a.name);
    expect(names).toEqual(['Stealth', 'Forward Observers']);
  });
  it('Wargear-type ability appears once its option is chosen, matched loosely against the full option text', () => {
    const names = unitAbilities(suit, [{ name: BEACON_OPT, cost: 0, qty: 1 }]).map((a) => a.name);
    expect(names).toContain('Homing Beacon');
  });
});

describe('enhancementFor / enhancementCoreRules', () => {
  const stealth = { name: 'Stealth', type: 'Core', parameter: '', description: '-1 to hit.' };
  const leader = { name: 'Leader', type: 'Core', parameter: '', description: 'Can attach to a unit.' };
  const hasStealth = ds({ id: 'hs', name: 'Has Stealth', abilities: [stealth, leader] });
  const plain = ds({ id: 'pl', name: 'Plain', abilities: [] });
  const fd = { datasheets: [hasStealth, plain] } as unknown as FactionData;
  const cloak = { name: 'Shroud Cloak', cost: '15', is_upgrade: false,
    description: 'This model has the Stealth ability.' };
  const det = { id: 'd1', name: 'Det', legend: '', dp_cost: 0, force_disposition: '', exclusive_tag: '',
    restriction: '', rules: [], enhancements: [cloak], stratagems: [] } as unknown as Detachment;

  it('enhancementFor finds the enhancement by name across detachments', () => {
    expect(enhancementFor([det], 'Shroud Cloak')).toBe(cloak);
    expect(enhancementFor([det], 'Nonexistent')).toBeUndefined();
    expect(enhancementFor([det], undefined)).toBeUndefined();
  });

  it('enhancementCoreRules resolves a Core rule the enhancement text names, from anywhere in fd', () => {
    const found = enhancementCoreRules(cloak.description, fd, []);
    expect(found.map((a) => a.name)).toEqual(['Stealth']);
    expect(found[0].description).toBe('-1 to hit.');
  });

  it('enhancementCoreRules excludes a rule the unit already has innately', () => {
    const found = enhancementCoreRules(cloak.description, fd, [stealth]);
    expect(found).toEqual([]);
  });

  it('enhancementCoreRules requires a whole-word match, not a substring of a longer word', () => {
    // "Leadership" contains "Leader" as a raw substring — must not match the Leader Core rule.
    const found = enhancementCoreRules("Add 1 to this model's Leadership characteristic.", fd, []);
    expect(found.map((a) => a.name)).not.toContain('Leader');
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
  it('ignores location/condition keywords after "from your army"', () => {
    // "embarked within a TRANSPORT" must not require the unit itself to BE a Transport
    const s = 'WHEN: Command phase. TARGET: One INFANTRY unit from your army embarked within a TRANSPORT. EFFECT: x.';
    expect(stratagemAppliesTo(s, ['INFANTRY'], vocab)).toBe(true);
    // a disembark stratagem still only requires the leading keywords
    const d = 'TARGET: One INFANTRY unit from your army that disembarked from a VEHICLE.';
    expect(stratagemAppliesTo(d, ['INFANTRY'], vocab)).toBe(true);
    expect(stratagemAppliesTo(d, ['VEHICLE'], vocab)).toBe(false);
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
  it('per_n with a "per K" multiplier ("for every 5, up to 3")', () => {
    expect(optionMax({ kind: 'per_n', n: 5, per: 3 }, 10)).toBe(6);
    expect(optionMax({ kind: 'per_n', n: 5, per: 2 }, 5)).toBe(2);
    expect(optionMax({ kind: 'per_n', n: 5, per: 2 }, 10)).toBe(4);
  });
  it('subpop = the named sub-population size at this model count (Crusader Neophytes)', () => {
    const lim = { kind: 'subpop', counts: { '10': 4, '20': 8 } };
    expect(optionMax(lim, 10)).toBe(4);
    expect(optionMax(lim, 20)).toBe(8);
    expect(optionMax(lim, 15)).toBe(8); // off-bracket -> the largest known size
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

describe('duplicateList (clone under a new id, ready to save and open)', () => {
  const u = (over: Partial<ListUnit>): ListUnit =>
    ({ uid: 'x', datasheetId: 'squad', name: 'Intercessors', pointsCost: 0,
       pointsLabel: '', isEpicHero: false, isBattleline: true, isCharacter: false, isAlly: false,
       warlord: false, ...over });
  const original: ArmyList = {
    id: 'list-1', name: 'My Crusade', factionId: 'SM', battleSizeId: '2', detachmentIds: ['d1'],
    units: [
      u({ uid: 's1', wargearCosts: [{ name: 'Meltagun', cost: 5, qty: 1 }] }),
      u({ uid: 'c1', datasheetId: 'cap', name: 'Captain', isCharacter: true, isBattleline: false,
          attachedToUid: 's1' }),
    ],
    createdAt: 1, updatedAt: 1,
  };

  it('gets a new list id and a "(copy)" name, distinct from the original', () => {
    const copy = duplicateList(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('My Crusade (copy)');
    expect(copy.detachmentIds).toEqual(['d1']); // everything else carried over
  });

  it('regenerates every unit uid, remapping attachedToUid to match', () => {
    const copy = duplicateList(original);
    const [sq, cap] = copy.units;
    expect(sq.uid).not.toBe('s1');
    expect(cap.uid).not.toBe('c1');
    expect(cap.attachedToUid).toBe(sq.uid); // still points at the (renamed) bodyguard
  });

  it('deep-clones wargearCosts so editing the copy cannot mutate the original', () => {
    const copy = duplicateList(original);
    copy.units[0].wargearCosts![0].qty = 99;
    expect(original.units[0].wargearCosts![0].qty).toBe(1);
  });
});
