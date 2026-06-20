// Placeholder test so `npm run test` (vitest) is wired up.
// A dedicated tester will add the real rule-engine tests here / alongside.
// Do not delete — it keeps the test runner green until real specs land.
import { describe, it, expect } from 'vitest';
import { validateList } from './rules';
import type { ArmyList, Rules } from './types';

describe('test harness', () => {
  it('validateList is callable and returns totals', () => {
    const rules: Rules = {
      battle_sizes: [
        {
          id: '2',
          name: 'Strike Force',
          points: 2000,
          detachment_points: 3,
          enhancement_limit: 4,
          unit_limit: 3,
          battleline_limit: 6,
          confirmed: 'yes',
        },
      ],
      allies: [],
      faction_supers: [],
      force_dispositions: [],
      attribution: '',
    };
    const list: ArmyList = {
      id: 'x',
      name: 'empty',
      factionId: 'SM',
      battleSizeId: '2',
      detachmentIds: [],
      units: [],
      createdAt: 0,
      updatedAt: 0,
    };
    const res = validateList(list, rules, []);
    expect(res.totals.pointsLimit).toBe(2000);
    expect(res).toHaveProperty('ok');
    expect(Array.isArray(res.violations)).toBe(true);
  });
});
