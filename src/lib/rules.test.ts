// Test suite for the #new40k list-building rules engine (src/lib/rules.ts).
// Covers every rule branch and violation `code`, asserting on violations and totals.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateList, getBattleSize, allyCap } from './rules';
import type {
  ArmyList,
  ListUnit,
  Rules,
  BattleSize,
  Detachment,
  Enhancement,
  AllyRule,
} from './types';

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

let uidSeq = 0;
const nextUid = () => `u${++uidSeq}`;

function makeUnit(partial: Partial<ListUnit> = {}): ListUnit {
  return {
    uid: partial.uid ?? nextUid(),
    datasheetId: partial.datasheetId ?? 'ds-default',
    name: partial.name ?? 'Test Unit',
    pointsCost: partial.pointsCost ?? 100,
    pointsLabel: partial.pointsLabel ?? '1 model',
    isEpicHero: partial.isEpicHero ?? false,
    isBattleline: partial.isBattleline ?? false,
    isCharacter: partial.isCharacter ?? false,
    isAlly: partial.isAlly ?? false,
    enhancementName: partial.enhancementName,
    enhancementCost: partial.enhancementCost,
    attachedToUid: partial.attachedToUid,
    warlord: partial.warlord,
    // allyKeyword is read via `(u as any).allyKeyword` in the engine
    ...(('allyKeyword' in partial) ? { allyKeyword: (partial as any).allyKeyword } : {}),
  } as ListUnit;
}

function makeList(partial: Partial<ArmyList> = {}): ArmyList {
  return {
    id: partial.id ?? 'list-1',
    name: partial.name ?? 'My List',
    factionId: partial.factionId ?? 'SM',
    battleSizeId: partial.battleSizeId ?? '2', // Strike Force
    detachmentIds: partial.detachmentIds ?? ['det-1'],
    units: partial.units ?? [],
    createdAt: partial.createdAt ?? 0,
    updatedAt: partial.updatedAt ?? 0,
  };
}

const STRIKE_FORCE: BattleSize = {
  id: '2',
  name: 'Strike Force',
  points: 2000,
  detachment_points: 3,
  enhancement_limit: 4,
  unit_limit: 3,
  battleline_limit: 6,
  confirmed: 'yes',
};

function makeRules(partial: Partial<Rules> = {}): Rules {
  return {
    battle_sizes: partial.battle_sizes ?? [STRIKE_FORCE],
    allies: partial.allies ?? [],
    faction_supers: partial.faction_supers ?? [],
    force_dispositions: partial.force_dispositions ?? [],
    attribution: partial.attribution ?? '',
  };
}

function makeEnhancement(partial: Partial<Enhancement> = {}): Enhancement {
  return {
    name: partial.name ?? 'Enh',
    cost: partial.cost ?? '10',
    description: partial.description ?? '',
    is_upgrade: partial.is_upgrade ?? false,
  };
}

function makeDetachment(partial: Partial<Detachment> = {}): Detachment {
  return {
    id: partial.id ?? 'det-1',
    name: partial.name ?? 'Detachment One',
    legend: partial.legend ?? '',
    dp_cost: partial.dp_cost ?? 1,
    force_disposition: partial.force_disposition ?? '',
    exclusive_tag: partial.exclusive_tag ?? '',
    restriction: partial.restriction ?? '',
    rules: partial.rules ?? [],
    enhancements: partial.enhancements ?? [],
    stratagems: partial.stratagems ?? [],
  };
}

function makeAllyRule(partial: Partial<AllyRule> = {}): AllyRule {
  return {
    army_faction_id: partial.army_faction_id ?? 'GC',
    allied_keyword: partial.allied_keyword ?? 'ASTRA MILITARUM',
    mechanism: partial.mechanism ?? 'detachment_gated',
    gated_by: partial.gated_by ?? 'none',
    cap_incursion: partial.cap_incursion ?? '500',
    cap_strike: partial.cap_strike ?? '1000',
    cap_onslaught: partial.cap_onslaught ?? '1500',
    notes: partial.notes ?? '',
  };
}

// Convenience: a standard CHARACTER warlord so most lists are otherwise legal.
function warlordChar(partial: Partial<ListUnit> = {}): ListUnit {
  return makeUnit({
    datasheetId: 'ds-captain',
    name: 'Captain',
    isCharacter: true,
    warlord: true,
    pointsCost: 80,
    ...partial,
  });
}

const codes = (r: ReturnType<typeof validateList>) =>
  r.violations.map((x) => x.code);

// ---------------------------------------------------------------------------
// 1. Points
// ---------------------------------------------------------------------------

describe('points limit (POINTS)', () => {
  it('under the limit: no POINTS error, totals reflect points', () => {
    const list = makeList({
      detachmentIds: ['det-1'],
      units: [warlordChar({ pointsCost: 500 }), makeUnit({ pointsCost: 500 })],
    });
    const res = validateList(list, makeRules(), [makeDetachment()]);
    expect(codes(res)).not.toContain('POINTS');
    expect(res.totals.points).toBe(1000);
    expect(res.totals.pointsLimit).toBe(2000);
  });

  it('exactly at the limit: no POINTS error', () => {
    const list = makeList({
      detachmentIds: ['det-1'],
      units: [warlordChar({ pointsCost: 1000 }), makeUnit({ pointsCost: 1000 })],
    });
    const res = validateList(list, makeRules(), [makeDetachment()]);
    expect(codes(res)).not.toContain('POINTS');
    expect(res.totals.points).toBe(2000);
  });

  it('over the limit: POINTS error and ok=false', () => {
    const list = makeList({
      detachmentIds: ['det-1'],
      units: [warlordChar({ pointsCost: 1500 }), makeUnit({ pointsCost: 600 })],
    });
    const res = validateList(list, makeRules(), [makeDetachment()]);
    expect(codes(res)).toContain('POINTS');
    expect(res.ok).toBe(false);
    expect(res.totals.points).toBe(2100);
  });

  it('enhancementCost is included in the points total', () => {
    const list = makeList({
      detachmentIds: ['det-1'],
      units: [warlordChar({ pointsCost: 1990, enhancementName: 'X', enhancementCost: 20 })],
    });
    const res = validateList(list, makeRules(), [
      makeDetachment({ enhancements: [makeEnhancement({ name: 'X' })] }),
    ]);
    expect(res.totals.points).toBe(2010);
    expect(codes(res)).toContain('POINTS');
  });
});

// ---------------------------------------------------------------------------
// 2. Detachment Points (DP) + NO_DETACHMENT
// ---------------------------------------------------------------------------

describe('detachment points (DP / NO_DETACHMENT)', () => {
  it('sum of dp within budget passes', () => {
    const list = makeList({
      detachmentIds: ['a', 'b'],
      units: [warlordChar()],
    });
    const res = validateList(list, makeRules(), [
      makeDetachment({ id: 'a', dp_cost: 1 }),
      makeDetachment({ id: 'b', dp_cost: 2 }),
    ]);
    expect(res.totals.dpUsed).toBe(3);
    expect(res.totals.dpBudget).toBe(3);
    expect(codes(res)).not.toContain('DP');
  });

  it('sum of dp over budget => DP error', () => {
    const list = makeList({
      detachmentIds: ['a', 'b'],
      units: [warlordChar()],
    });
    const res = validateList(list, makeRules(), [
      makeDetachment({ id: 'a', dp_cost: 2 }),
      makeDetachment({ id: 'b', dp_cost: 2 }),
    ]);
    expect(res.totals.dpUsed).toBe(4);
    expect(codes(res)).toContain('DP');
    expect(res.ok).toBe(false);
  });

  it('empty detachmentIds => NO_DETACHMENT and dpUsed 0', () => {
    const list = makeList({ detachmentIds: [], units: [warlordChar()] });
    const res = validateList(list, makeRules(), [makeDetachment()]);
    expect(codes(res)).toContain('NO_DETACHMENT');
    expect(res.totals.dpUsed).toBe(0);
    expect(res.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Detachment exclusivity (DET_TAG)
// ---------------------------------------------------------------------------

describe('detachment exclusivity (DET_TAG)', () => {
  it('two detachments sharing the same exclusive_tag => DET_TAG', () => {
    const list = makeList({ detachmentIds: ['a', 'b'], units: [warlordChar()] });
    const res = validateList(list, makeRules(), [
      makeDetachment({ id: 'a', name: 'Host A', dp_cost: 1, exclusive_tag: 'HOST' }),
      makeDetachment({ id: 'b', name: 'Host B', dp_cost: 1, exclusive_tag: 'HOST' }),
    ]);
    expect(codes(res)).toContain('DET_TAG');
    expect(res.ok).toBe(false);
  });

  it('different exclusive_tags => no DET_TAG', () => {
    const list = makeList({ detachmentIds: ['a', 'b'], units: [warlordChar()] });
    const res = validateList(list, makeRules(), [
      makeDetachment({ id: 'a', dp_cost: 1, exclusive_tag: 'HOST' }),
      makeDetachment({ id: 'b', dp_cost: 1, exclusive_tag: 'WAR DOGS' }),
    ]);
    expect(codes(res)).not.toContain('DET_TAG');
  });

  it('empty exclusive_tag is ignored (multiple untagged ok)', () => {
    const list = makeList({ detachmentIds: ['a', 'b'], units: [warlordChar()] });
    const res = validateList(list, makeRules(), [
      makeDetachment({ id: 'a', dp_cost: 1, exclusive_tag: '' }),
      makeDetachment({ id: 'b', dp_cost: 1, exclusive_tag: '' }),
    ]);
    expect(codes(res)).not.toContain('DET_TAG');
  });
});

// ---------------------------------------------------------------------------
// 4. Unit limits (Rule of Three) + Battleline doubling
// ---------------------------------------------------------------------------

describe('unit limits (UNIT_LIMIT)', () => {
  it('N copies of a non-battleline datasheet at the limit passes', () => {
    const units = [
      warlordChar(),
      ...Array.from({ length: 3 }, () =>
        makeUnit({ datasheetId: 'ds-x', name: 'Squad X' }),
      ),
    ];
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment()]);
    expect(codes(res)).not.toContain('UNIT_LIMIT');
  });

  it('limit + 1 copies of a non-battleline datasheet => UNIT_LIMIT', () => {
    const units = [
      warlordChar(),
      ...Array.from({ length: 4 }, () =>
        makeUnit({ datasheetId: 'ds-x', name: 'Squad X' }),
      ),
    ];
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment()]);
    expect(codes(res)).toContain('UNIT_LIMIT');
    expect(res.ok).toBe(false);
  });

  it('battleline limit is doubled: 6 battleline copies pass at Strike Force', () => {
    const units = [
      warlordChar(),
      ...Array.from({ length: 6 }, () =>
        makeUnit({ datasheetId: 'ds-bl', name: 'Battleline', isBattleline: true }),
      ),
    ];
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment()]);
    expect(codes(res)).not.toContain('UNIT_LIMIT');
  });

  it('battleline limit + 1 (7 copies) => UNIT_LIMIT', () => {
    const units = [
      warlordChar(),
      ...Array.from({ length: 7 }, () =>
        makeUnit({ datasheetId: 'ds-bl', name: 'Battleline', isBattleline: true }),
      ),
    ];
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment()]);
    expect(codes(res)).toContain('UNIT_LIMIT');
  });
});

// ---------------------------------------------------------------------------
// 5. Epic Hero uniqueness (EPIC_HERO)
// ---------------------------------------------------------------------------

describe('epic hero uniqueness (EPIC_HERO)', () => {
  it('two of the same epic hero => EPIC_HERO', () => {
    const units = [
      makeUnit({ datasheetId: 'eh', name: 'Marneus', isEpicHero: true, isCharacter: true, warlord: true }),
      makeUnit({ datasheetId: 'eh', name: 'Marneus', isEpicHero: true, isCharacter: true }),
    ];
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment()]);
    expect(codes(res)).toContain('EPIC_HERO');
    expect(res.ok).toBe(false);
  });

  it('two different epic heroes => no EPIC_HERO', () => {
    const units = [
      makeUnit({ datasheetId: 'eh1', name: 'Marneus', isEpicHero: true, isCharacter: true, warlord: true }),
      makeUnit({ datasheetId: 'eh2', name: 'Calgar', isEpicHero: true, isCharacter: true }),
    ];
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment()]);
    expect(codes(res)).not.toContain('EPIC_HERO');
  });
});

// ---------------------------------------------------------------------------
// 6. Warlord (NO_WARLORD / MULTI_WARLORD / WARLORD_CHAR)
// ---------------------------------------------------------------------------

describe('warlord rules', () => {
  it('zero warlords (with units) => NO_WARLORD warning, not an error', () => {
    const list = makeList({ units: [makeUnit({ isCharacter: true })] });
    const res = validateList(list, makeRules(), [makeDetachment()]);
    const w = res.violations.find((x) => x.code === 'NO_WARLORD');
    expect(w).toBeDefined();
    expect(w!.level).toBe('warning');
    // a lone warning does not flip ok=false
    expect(res.ok).toBe(true);
  });

  it('empty list => no NO_WARLORD (only flagged when units exist)', () => {
    const res = validateList(makeList({ units: [] }), makeRules(), [makeDetachment()]);
    expect(codes(res)).not.toContain('NO_WARLORD');
  });

  it('two warlords => MULTI_WARLORD error', () => {
    const units = [
      warlordChar({ datasheetId: 'a', name: 'A' }),
      warlordChar({ datasheetId: 'b', name: 'B' }),
    ];
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment()]);
    expect(codes(res)).toContain('MULTI_WARLORD');
    expect(res.ok).toBe(false);
  });

  it('non-CHARACTER warlord => WARLORD_CHAR error', () => {
    const units = [makeUnit({ name: 'Tank', isCharacter: false, warlord: true })];
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment()]);
    expect(codes(res)).toContain('WARLORD_CHAR');
    expect(res.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Enhancements (ENH_LIMIT / ENH_CHAR / UPGRADE_3 + shared upgrade counting)
// ---------------------------------------------------------------------------

describe('enhancements', () => {
  it('enhancement on a non-Character non-Upgrade unit => ENH_CHAR', () => {
    const list = makeList({
      units: [warlordChar(), makeUnit({ name: 'Tank', isCharacter: false, enhancementName: 'Relic' })],
    });
    const res = validateList(list, makeRules(), [
      makeDetachment({ enhancements: [makeEnhancement({ name: 'Relic', is_upgrade: false })] }),
    ]);
    expect(codes(res)).toContain('ENH_CHAR');
    expect(res.ok).toBe(false);
  });

  it('enhancement on a CHARACTER is fine (no ENH_CHAR)', () => {
    const list = makeList({
      units: [warlordChar({ enhancementName: 'Relic' })],
    });
    const res = validateList(list, makeRules(), [
      makeDetachment({ enhancements: [makeEnhancement({ name: 'Relic' })] }),
    ]);
    expect(codes(res)).not.toContain('ENH_CHAR');
    expect(res.totals.enhancementsUsed).toBe(1);
  });

  it('count over enhancement_limit => ENH_LIMIT', () => {
    // limit is 4 at Strike Force; give 5 distinct character enhancements
    const units = [warlordChar()];
    for (let i = 0; i < 5; i++) {
      units.push(makeUnit({ datasheetId: `ch${i}`, name: `Char ${i}`, isCharacter: true, enhancementName: `Enh${i}` }));
    }
    const enhancements = Array.from({ length: 5 }, (_, i) => makeEnhancement({ name: `Enh${i}` }));
    const res = validateList(makeList({ units }), makeRules(), [makeDetachment({ enhancements })]);
    expect(res.totals.enhancementsUsed).toBe(5);
    expect(codes(res)).toContain('ENH_LIMIT');
    expect(res.ok).toBe(false);
  });

  it('a shared Upgrade across <=3 non-Character units counts as ONE choice', () => {
    const units = [warlordChar()];
    for (let i = 0; i < 3; i++) {
      units.push(makeUnit({ datasheetId: `sq${i}`, name: `Squad ${i}`, isCharacter: false, enhancementName: 'Banner' }));
    }
    const res = validateList(makeList({ units }), makeRules(), [
      makeDetachment({ enhancements: [makeEnhancement({ name: 'Banner', is_upgrade: true })] }),
    ]);
    expect(res.totals.enhancementsUsed).toBe(1);
    expect(codes(res)).not.toContain('ENH_CHAR');
    expect(codes(res)).not.toContain('UPGRADE_3');
  });

  it('a shared Upgrade across >3 non-Character units => UPGRADE_3', () => {
    const units = [warlordChar()];
    for (let i = 0; i < 4; i++) {
      units.push(makeUnit({ datasheetId: `sq${i}`, name: `Squad ${i}`, isCharacter: false, enhancementName: 'Banner' }));
    }
    const res = validateList(makeList({ units }), makeRules(), [
      makeDetachment({ enhancements: [makeEnhancement({ name: 'Banner', is_upgrade: true })] }),
    ]);
    expect(codes(res)).toContain('UPGRADE_3');
    // still a single choice for the enhancement budget
    expect(res.totals.enhancementsUsed).toBe(1);
    expect(res.ok).toBe(false);
  });

  it('the same standard enhancement on two characters => ENH_DUP', () => {
    const units = [
      warlordChar({ enhancementName: 'Relic' }),
      makeUnit({ datasheetId: 'c2', name: 'Char 2', isCharacter: true, enhancementName: 'Relic' }),
    ];
    const res = validateList(makeList({ units }), makeRules(), [
      makeDetachment({ enhancements: [makeEnhancement({ name: 'Relic', is_upgrade: false })] }),
    ]);
    expect(codes(res)).toContain('ENH_DUP');
    expect(res.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. Ally caps (ALLY_CAP)
// ---------------------------------------------------------------------------

describe('ally caps (ALLY_CAP)', () => {
  it('GC -> ASTRA MILITARUM ally points over the Strike Force cap (1000) => ALLY_CAP', () => {
    const rules = makeRules({ allies: [makeAllyRule()] });
    const units = [
      warlordChar({ datasheetId: 'gc-warlord', name: 'Patriarch' }),
      makeUnit({ datasheetId: 'am1', name: 'Guard', isAlly: true, pointsCost: 700, allyKeyword: 'ASTRA MILITARUM' } as any),
      makeUnit({ datasheetId: 'am2', name: 'Tank', isAlly: true, pointsCost: 400, allyKeyword: 'ASTRA MILITARUM' } as any),
    ];
    const res = validateList(makeList({ factionId: 'GC', units }), rules, [makeDetachment()]);
    expect(res.totals.allyPoints).toBe(1100);
    expect(codes(res)).toContain('ALLY_CAP');
    expect(res.ok).toBe(false);
  });

  it('ally points at the cap (exactly 1000) passes', () => {
    const rules = makeRules({ allies: [makeAllyRule()] });
    const units = [
      warlordChar({ datasheetId: 'gc-warlord', name: 'Patriarch' }),
      makeUnit({ datasheetId: 'am1', name: 'Guard', isAlly: true, pointsCost: 1000, allyKeyword: 'ASTRA MILITARUM' } as any),
    ];
    const res = validateList(makeList({ factionId: 'GC', units }), rules, [makeDetachment()]);
    expect(res.totals.allyPoints).toBe(1000);
    expect(codes(res)).not.toContain('ALLY_CAP');
  });

  it('DRU -> HARLEQUINS over the Strike Force cap (500) => ALLY_CAP', () => {
    const rules = makeRules({
      allies: [
        makeAllyRule({
          army_faction_id: 'DRU',
          allied_keyword: 'HARLEQUINS',
          mechanism: 'supra_faction',
          cap_incursion: '250',
          cap_strike: '500',
          cap_onslaught: '750',
        }),
      ],
    });
    const units = [
      warlordChar({ datasheetId: 'dru-warlord', name: 'Archon' }),
      makeUnit({ datasheetId: 'h1', name: 'Troupe', isAlly: true, pointsCost: 600, allyKeyword: 'HARLEQUINS' } as any),
    ];
    const res = validateList(makeList({ factionId: 'DRU', units }), rules, [makeDetachment()]);
    expect(res.totals.allyPoints).toBe(600);
    expect(codes(res)).toContain('ALLY_CAP');
  });

  it('ally rules with mechanism native/chapter_restriction/agents are skipped (no cap enforced)', () => {
    const rules = makeRules({
      allies: [
        makeAllyRule({ army_faction_id: 'SM', allied_keyword: 'AGENTS OF THE IMPERIUM', mechanism: 'agents', cap_strike: '0' }),
      ],
    });
    const units = [
      warlordChar(),
      makeUnit({ name: 'Inquisitor', isAlly: true, pointsCost: 900, allyKeyword: 'AGENTS OF THE IMPERIUM' } as any),
    ];
    const res = validateList(makeList({ factionId: 'SM', units }), rules, [makeDetachment()]);
    expect(codes(res)).not.toContain('ALLY_CAP');
  });
});

// ---------------------------------------------------------------------------
// allyCap / getBattleSize helpers
// ---------------------------------------------------------------------------

describe('allyCap helper', () => {
  const rule = makeAllyRule({ cap_incursion: '250', cap_strike: '500', cap_onslaught: '750' });
  it('matches by battle-size name (case-insensitive substring)', () => {
    expect(allyCap(rule, 'Incursion')).toBe(250);
    expect(allyCap(rule, 'Strike Force')).toBe(500);
    expect(allyCap(rule, 'Onslaught')).toBe(750);
  });
  it('returns 0 for an unknown battle-size name', () => {
    expect(allyCap(rule, 'Combat Patrol')).toBe(0);
  });
});

describe('getBattleSize helper', () => {
  it('finds a battle size by id, undefined otherwise', () => {
    const rules = makeRules();
    expect(getBattleSize(rules, '2')?.name).toBe('Strike Force');
    expect(getBattleSize(rules, '99')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 9. Fully-legal Strike Force list
// ---------------------------------------------------------------------------

describe('fully-legal Strike Force list', () => {
  it('2000 pts across two detachments within 3 DP, one warlord, a couple of units => ok', () => {
    const list = makeList({
      factionId: 'SM',
      battleSizeId: '2',
      detachmentIds: ['gladius', 'anvil'],
      units: [
        warlordChar({ datasheetId: 'captain', name: 'Captain', pointsCost: 100, enhancementName: 'Artificer Armour' }),
        makeUnit({ datasheetId: 'intercessors', name: 'Intercessors', isBattleline: true, pointsCost: 200 }),
        makeUnit({ datasheetId: 'hellblasters', name: 'Hellblasters', pointsCost: 230 }),
        makeUnit({ datasheetId: 'redemptor', name: 'Redemptor Dreadnought', pointsCost: 210 }),
      ],
    });
    const res = validateList(list, makeRules(), [
      makeDetachment({ id: 'gladius', name: 'Gladius Task Force', dp_cost: 2, enhancements: [makeEnhancement({ name: 'Artificer Armour' })] }),
      makeDetachment({ id: 'anvil', name: 'Anvil Siege Force', dp_cost: 1 }),
    ]);
    expect(res.violations.filter((x) => x.level === 'error')).toEqual([]);
    expect(res.ok).toBe(true);
    expect(res.totals.dpUsed).toBe(3);
    expect(res.totals.points).toBe(740);
    expect(res.totals.enhancementsUsed).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Sanity checks against the real public/data/rules.json
// ---------------------------------------------------------------------------

describe('real rules.json data', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const realRules = JSON.parse(
    readFileSync(resolve(here, '../../public/data/rules.json'), 'utf8'),
  ) as Rules;

  it('Strike Force has 3 detachment points', () => {
    const sf = getBattleSize(realRules, '2');
    expect(sf?.name).toBe('Strike Force');
    expect(Number(sf?.detachment_points)).toBe(3);
  });

  it('GC -> ASTRA MILITARUM ally cap at Strike Force is 1000', () => {
    const rule = realRules.allies.find(
      (a) => a.army_faction_id === 'GC' && a.allied_keyword === 'ASTRA MILITARUM',
    )!;
    expect(rule).toBeDefined();
    expect(allyCap(rule, 'Strike Force')).toBe(1000);
  });

  it('engine works end-to-end with the real (string-typed) rules.json: over-points triggers POINTS', () => {
    const units = [warlordChar({ pointsCost: 2500 })];
    // factionId GC so any matching ally rule resolves; no allies present
    const list = makeList({ factionId: 'GC', battleSizeId: '2', detachmentIds: ['det-1'], units });
    const res = validateList(list, realRules, [makeDetachment()]);
    expect(res.totals.points).toBe(2500);
    expect(codes(res)).toContain('POINTS');
    // string-typed limit still surfaces in totals
    expect(Number(res.totals.pointsLimit)).toBe(2000);
  });
});
