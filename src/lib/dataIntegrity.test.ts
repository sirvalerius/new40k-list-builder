// Spot-checks the REAL generated data (public/data/factions/*.json), not synthetic fixtures —
// so a data-generation regression like the combi-bolter bug (a weapon option's `grants` wrongly
// listing a weapon it was itself replacing, permanently hiding that base weapon from every unit
// with it) gets caught even when no hand-written unit test happens to model that exact shape.
// Sampling 15% of non-Legends datasheets per army keeps the suite fast while still touching
// every faction; the stride sample spreads picks across the whole roster instead of clustering
// at the top of the file.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { equippedWeapons, normName } from './helpers';
import type { Datasheet, FactionData } from './types';

const here = dirname(fileURLToPath(import.meta.url));
const factionsDir = resolve(here, '../../public/data/factions');

function sample15<T>(items: T[]): T[] {
  if (items.length <= 1) return items;
  const n = Math.max(1, Math.ceil(items.length * 0.15));
  const stride = items.length / n;
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * stride)]);
}

const splitBase = (base: string): string[] =>
  base.split(/\s*(?:,|&|\band\b)\s*/i).map(normName).filter(Boolean);

const factionFiles = readdirSync(factionsDir).filter((f) => f.endsWith('.json'));

describe.each(factionFiles)('real data — %s (15%% of non-Legends units)', (file) => {
  const fd = JSON.parse(readFileSync(resolve(factionsDir, file), 'utf8')) as FactionData;
  const sampled = sample15(fd.datasheets.filter((d) => !d.is_legends));

  it.each(sampled.map((ds): [string, Datasheet] => [ds.name, ds]))(
    "%s: no weapon option's grants include its own replaced base",
    (_name, ds) => {
      for (const o of ds.weapon_options ?? []) {
        if (!o.base) continue;
        const baseParts = splitBase(o.base);
        for (const g of o.grants ?? []) {
          expect(baseParts).not.toContain(normName(g));
        }
      }
    },
  );

  it.each(sampled.map((ds): [string, Datasheet] => [ds.name, ds]))(
    '%s: default loadout (nothing chosen) still fields every stock_weapons entry',
    (_name, ds) => {
      // Checks ds.stock_weapons directly (the authoritative "<Role> is equipped with: ..."
      // parse) rather than re-deriving it from option `base` fields: a base can legitimately
      // be a CHAINED upgrade target (e.g. Aeldari Corsairs' "shuriken cannon instead of
      // shuriken rifle", where shuriken rifle itself only exists after an earlier swap) that
      // must stay hidden until chosen — only stock_weapons entries are owed a default showing.
      const weaponNames = new Set(ds.weapons.map((w) => normName(w.name)));
      const equipped = new Set(equippedWeapons(ds, []).map((w) => normName(w.name)));
      for (const stock of ds.stock_weapons ?? []) {
        const n = normName(stock);
        if (!weaponNames.has(n)) continue;
        expect(equipped.has(n)).toBe(true);
      }
    },
  );
});
