// #new40k (11th edition) list-building rules engine.
// Pure functions — the single source of truth for list legality, shared by UI and tests.
import type { ArmyList, BattleSize, Detachment, AllyRule, Rules } from './types';

export interface Violation { level: 'error' | 'warning'; code: string; message: string; }
export interface ListTotals {
  points: number;
  pointsLimit: number;
  dpUsed: number;
  dpBudget: number;
  enhancementsUsed: number;
  enhancementLimit: number;
  allyPoints: number;
}
export interface ValidationResult { ok: boolean; violations: Violation[]; totals: ListTotals; }

const intOf = (s: string | number | undefined) => {
  if (typeof s === 'number') return s;
  const n = parseInt(String(s ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

/** Full points of a unit: base + enhancement + paid wargear options (qty x cost). */
const unitCost = (u: ArmyList['units'][number]): number =>
  intOf(u.pointsCost) +
  intOf(u.enhancementCost) +
  (u.wargearCosts ?? []).reduce((s, w) => s + intOf(w.cost) * (w.qty || 0), 0);

export function getBattleSize(rules: Rules, id: string): BattleSize | undefined {
  return rules.battle_sizes.find((b) => b.id === id);
}

/** Cap (points) for an ally rule at a given battle size; 0 = no flat cap (special gating). */
export function allyCap(rule: AllyRule, battleSizeName: string): number {
  if (/incursion/i.test(battleSizeName)) return intOf(rule.cap_incursion);
  if (/strike/i.test(battleSizeName)) return intOf(rule.cap_strike);
  if (/onslaught/i.test(battleSizeName)) return intOf(rule.cap_onslaught);
  return 0;
}

export function validateList(
  list: ArmyList,
  rules: Rules,
  detachments: Detachment[],
): ValidationResult {
  const v: Violation[] = [];
  const bs = getBattleSize(rules, list.battleSizeId);
  const pointsLimit = bs?.points ?? 0;
  const dpBudget = bs?.detachment_points ?? 0;
  const enhancementLimit = bs?.enhancement_limit ?? 0;
  const unitLimit = bs?.unit_limit ?? 0;
  const battlelineLimit = bs?.battleline_limit ?? 0;

  const chosen = detachments.filter((d) => list.detachmentIds.includes(d.id));

  // --- points ---
  const unitPts = list.units.reduce((s, u) => s + unitCost(u), 0);
  const allyPoints = list.units.filter((u) => u.isAlly).reduce((s, u) => s + unitCost(u), 0);
  if (pointsLimit && unitPts > pointsLimit)
    v.push({ level: 'error', code: 'POINTS', message: `Punti ${unitPts} oltre il limite ${pointsLimit}.` });

  // --- detachment points ---
  const dpUsed = chosen.reduce((s, d) => s + intOf(d.dp_cost), 0);
  if (dpUsed > dpBudget)
    v.push({ level: 'error', code: 'DP', message: `Detachment Points ${dpUsed} oltre il budget ${dpBudget}.` });
  if (list.detachmentIds.length === 0)
    v.push({ level: 'error', code: 'NO_DETACHMENT', message: 'Seleziona almeno una detachment.' });

  // detachment exclusivity (cannot take two with the same exclusive tag)
  const tagSeen = new Map<string, string>();
  for (const d of chosen) {
    if (d.exclusive_tag) {
      if (tagSeen.has(d.exclusive_tag))
        v.push({ level: 'error', code: 'DET_TAG', message: `Due detachment con tag ${d.exclusive_tag} (${tagSeen.get(d.exclusive_tag)}, ${d.name}).` });
      else tagSeen.set(d.exclusive_tag, d.name);
    }
  }

  // --- unit counts (Rule of Three) ---
  const counts = new Map<string, { n: number; battleline: boolean; name: string }>();
  for (const u of list.units) {
    const e = counts.get(u.datasheetId) ?? { n: 0, battleline: u.isBattleline, name: u.name };
    e.n += 1; counts.set(u.datasheetId, e);
  }
  for (const [, e] of counts) {
    const lim = e.battleline ? battlelineLimit : unitLimit;
    if (lim && e.n > lim)
      v.push({ level: 'error', code: 'UNIT_LIMIT', message: `${e.name}: ${e.n} copie (max ${lim}).` });
  }

  // --- Epic Heroes unique ---
  const heroes = new Map<string, number>();
  for (const u of list.units) if (u.isEpicHero) heroes.set(u.datasheetId, (heroes.get(u.datasheetId) ?? 0) + 1);
  for (const [, n] of heroes) if (n > 1)
    v.push({ level: 'error', code: 'EPIC_HERO', message: `Epic Hero duplicato (gli Epic Hero sono unici).` });

  // --- Warlord ---
  const warlords = list.units.filter((u) => u.warlord);
  if (list.units.length > 0 && warlords.length === 0)
    v.push({ level: 'warning', code: 'NO_WARLORD', message: 'Nessun Warlord selezionato.' });
  if (warlords.length > 1)
    v.push({ level: 'error', code: 'MULTI_WARLORD', message: 'Solo un Warlord ammesso.' });
  if (warlords.some((u) => !u.isCharacter))
    v.push({ level: 'error', code: 'WARLORD_CHAR', message: 'Il Warlord deve essere un CHARACTER.' });

  // --- Enhancements ---
  // Upgrade-tag enhancements applied to non-Character units count as a single choice when shared by name.
  const upgradeNames = new Map<string, number>();   // name -> count of non-character bearers
  let nonUpgradeChoices = 0;
  for (const u of list.units) {
    if (!u.enhancementName) continue;
    const det = chosen.flatMap((d) => d.enhancements).find((e) => e.name === u.enhancementName);
    if (det?.is_upgrade && !u.isCharacter) {
      upgradeNames.set(u.enhancementName, (upgradeNames.get(u.enhancementName) ?? 0) + 1);
    } else {
      nonUpgradeChoices += 1;
      if (!u.isCharacter)
        v.push({ level: 'error', code: 'ENH_CHAR', message: `${u.name}: enhancement solo su CHARACTER (o Upgrade su non-Character).` });
    }
  }
  for (const [name, n] of upgradeNames) {
    if (n > 3) v.push({ level: 'error', code: 'UPGRADE_3', message: `Enhancement "${name}" su ${n} unità (max 3 per Upgrade).` });
  }
  const enhancementsUsed = nonUpgradeChoices + upgradeNames.size;  // each shared Upgrade = 1 choice
  if (enhancementLimit && enhancementsUsed > enhancementLimit)
    v.push({ level: 'error', code: 'ENH_LIMIT', message: `${enhancementsUsed} enhancement (max ${enhancementLimit}).` });
  // one enhancement per character
  const perChar = new Map<string, number>();
  for (const u of list.units) if (u.enhancementName && u.isCharacter) perChar.set(u.uid, (perChar.get(u.uid) ?? 0) + 1);

  // --- Allies caps ---
  const allyRules = rules.allies.filter((a) => a.army_faction_id === list.factionId);
  if (bs) {
    // group ally points by matched ally rule keyword
    for (const rule of allyRules) {
      if (rule.mechanism === 'native' || rule.mechanism === 'chapter_restriction') continue;
      const cap = allyCap(rule, bs.name);
      if (cap <= 0) continue; // agents / special gating handled in UI
      const used = list.units
        .filter((u) => u.isAlly && (u as any).allyKeyword === rule.allied_keyword)
        .reduce((s, u) => s + unitCost(u), 0);
      if (used > cap)
        v.push({ level: 'error', code: 'ALLY_CAP', message: `Alleati ${rule.allied_keyword}: ${used} pt oltre il cap ${cap}.` });
    }
  }

  const totals: ListTotals = {
    points: unitPts, pointsLimit, dpUsed, dpBudget,
    enhancementsUsed, enhancementLimit, allyPoints,
  };
  return { ok: v.every((x) => x.level !== 'error'), violations: v, totals };
}
