// Misc pure helpers used across the UI.
import type {
  ArmyList,
  ChosenWargear,
  Datasheet,
  Detachment,
  FactionData,
  ListUnit,
  PointsOption,
  Weapon,
} from './types';

const normName = (s: string): string =>
  (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Weapon profiles a unit actually fields, given its chosen loadout (`selected`).
 * Hides: upgrade weapons whose option wasn't taken; weapons that belong only to an
 * optional sub-model (e.g. an Invader ATV) that wasn't purchased; base weapons that a
 * chosen single-model replacement swapped away. When `selected` is undefined (browsing),
 * every weapon is shown.
 */
export function equippedWeapons(ds: Datasheet, selected?: ChosenWargear[]): Weapon[] {
  const weapons = (ds.weapons ?? []).filter((w) => w.name);
  const opts = ds.weapon_options ?? [];
  if (selected == null || !opts.length) return weapons;

  const chosen = new Set(selected.filter((s) => s.qty > 0).map((s) => s.name));
  const addonModels = new Set(
    opts.filter((o) => o.type === 'model' && o.model).map((o) => o.model as string),
  );
  const addonTaken = new Set(
    opts.filter((o) => o.type === 'model' && o.model && chosen.has(o.text)).map((o) => o.model as string),
  );

  const grantedAll = new Set<string>();        // a weapon some option can add
  const grantedNow = new Set<string>();        // a weapon a CHOSEN option adds
  const replacedNow = new Set<string>();       // base swapped away by a chosen single-model option
  const addonForWeapon = new Map<string, string>(); // weapon -> the sub-model it belongs to
  for (const o of opts) {
    // Constraint notes ("* X cannot be replaced") are informational — they neither grant nor
    // replace a weapon. Skipping them stops a named base weapon (e.g. the Sternguard bolt rifle)
    // being mistaken for an unchosen upgrade and hidden from the card.
    if (o.limit?.kind === 'note') continue;
    for (const g of o.grants ?? []) {
      grantedAll.add(normName(g));
      if (chosen.has(o.text)) grantedNow.add(normName(g));
    }
    if (o.base) {
      const onAddon = !!o.model && addonModels.has(o.model);
      if (onAddon) addonForWeapon.set(normName(o.base), o.model as string);
      // a single-model replacement (sub-model or fixed-1) removes its base entirely
      if (chosen.has(o.text) && (onAddon || o.limit?.kind === 'fixed')) replacedNow.add(normName(o.base));
    }
  }

  return weapons.filter((w) => {
    const n = normName(w.name);
    const requiresAddon = addonForWeapon.get(n);
    if (requiresAddon && !addonTaken.has(requiresAddon)) return grantedNow.has(n);
    if (grantedAll.has(n)) return grantedNow.has(n);   // optional/upgrade weapon
    if (replacedNow.has(n)) return false;              // replaced base
    return true;                                       // standard kit
  });
}

export function uid(): string {
  // Good-enough unique id without external deps.
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

export const intOf = (s: string | number | undefined): number => {
  if (typeof s === 'number') return s;
  const n = parseInt(String(s ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

/** Sum of chosen paid wargear options (qty x cost). */
export const wargearTotal = (u: ListUnit): number =>
  (u.wargearCosts ?? []).reduce((s, w) => s + intOf(w.cost) * (w.qty || 0), 0);

/** Full points cost of a list unit: base + enhancement + paid wargear. */
export const unitTotal = (u: ListUnit): number =>
  intOf(u.pointsCost) + intOf(u.enhancementCost) + wargearTotal(u);

/** Clamp a unit's chosen weapon-option quantities to their per-option limits
 *  for the unit's current model count (used when the model count changes). */
export function clampLoadout(unit: ListUnit, ds: Datasheet): ChosenWargear[] {
  const count = unit.modelCount ?? ds.model_max ?? 1;
  const opts = ds.weapon_options ?? [];
  const limitOf = new Map(opts.map((o) => [o.text, o.limit]));
  let wargear = (unit.wargearCosts ?? []).map((w) => {
    const max = optionMax(limitOf.get(w.name), count);
    return max != null && w.qty > max ? { ...w, qty: max } : w;
  });
  // Cap options by the count of the optional sub-model they pertain to (e.g. removing the
  // Invader ATV must also drop its multi-melta).
  const qty = (text: string) => wargear.find((w) => w.name === text)?.qty ?? 0;
  const providerQty = new Map<string, number>();
  for (const o of opts) if (o.type === 'model' && o.model) providerQty.set(o.model, qty(o.text));
  wargear = wargear.map((w) => {
    const o = opts.find((op) => op.text === w.name);
    if (o && o.type !== 'model' && o.model && providerQty.has(o.model)) {
      const cap = providerQty.get(o.model)!;
      return w.qty > cap ? { ...w, qty: cap } : w;
    }
    return w;
  });
  return wargear.filter((w) => w.qty > 0);
}

/** Max copies of a weapon option allowed for a unit of `modelCount` models.
 *  per_n = 1 per N (floor); all/slots/fixed per the limit; null = unbounded. */
export function optionMax(
  limit: { kind: string; n?: number; slots?: number; max?: number } | undefined,
  modelCount: number,
): number | null {
  if (!limit) return null;
  switch (limit.kind) {
    case 'per_n':
      return limit.n ? Math.floor(modelCount / limit.n) : modelCount;
    case 'slots':
      return modelCount * (limit.slots ?? 1); // aggregate per-model slots (Crisis)
    case 'fixed':
      return limit.max ?? 1;
    case 'all':
      return modelCount;
    default:
      return null; // note
  }
}

/** Strip the Wahapedia HTML markup (kwb spans, <br>, <b>) down to plain text. */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildListUnit(
  ds: Datasheet,
  tier: PointsOption,
  modelCount?: number,
): ListUnit {
  return {
    uid: uid(),
    datasheetId: ds.id,
    name: ds.name,
    pointsCost: intOf(tier.cost),
    pointsLabel: tier.description,
    variantKey: tier.variant ?? tier.description,
    modelCount: modelCount ?? tier.models ?? undefined,
    requiresDetachment: ds.requires_detachment || undefined,
    isEpicHero: ds.is_epic_hero,
    isBattleline: ds.is_battleline,
    isCharacter: ds.is_character,
    isAlly: false,
    warlord: false,
  };
}

/** Distinct model-count variants offered for a datasheet (collapses pick-order tiers). */
export function unitVariants(ds: Datasheet): PointsOption[] {
  if (!ds.points.length) return [{ description: 'Default', cost: '0', variant: 'Default' }];
  if (!ds.has_order_tiers) return ds.points;
  const seen = new Set<string>();
  const out: PointsOption[] = [];
  for (const p of ds.points) {
    const key = p.variant ?? p.description;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p); // representative (first/lowest-tier) option for this variant
  }
  return out;
}

const inTier = (p: PointsOption, idx: number): boolean =>
  (p.tier_min == null || idx >= p.tier_min) && (p.tier_max == null || idx <= p.tier_max);

/** Distinct cost brackets {models, variant}, ascending by model count. */
function brackets(ds: Datasheet): { models: number; variant: string }[] {
  const seen = new Map<string, number>();
  for (const p of ds.points) {
    const v = p.variant ?? p.description;
    if (p.models != null && !seen.has(v)) seen.set(v, p.models);
  }
  return [...seen.entries()]
    .map(([variant, models]) => ({ models, variant }))
    .sort((a, b) => a.models - b.models);
}

/** Variant of the smallest bracket that can contain `count` models (>= count); else the largest. */
export function bracketForCount(ds: Datasheet, count: number): string {
  const bs = brackets(ds);
  if (!bs.length) return ds.points[0]?.variant ?? ds.points[0]?.description ?? '';
  return (bs.find((b) => b.models >= count) ?? bs[bs.length - 1]).variant;
}

/** The points option that applies to the `pick`-th copy of a chosen variant (1-based). */
export function tierForPick(
  ds: Datasheet,
  variantKey: string,
  pick: number,
): PointsOption | undefined {
  const opts = ds.points.filter((p) => (p.variant ?? p.description) === variantKey);
  return opts.find((p) => inTier(p, pick)) ?? opts[0];
}

/**
 * Re-price pick-order-tiered units by their position among same-datasheet copies.
 * The Nth unit of a datasheet (in list order) pays the tier whose [min,max] contains N,
 * for the variant (model count) the player chose. Non-tiered units are left untouched.
 * Must run after any add/remove/reorder so escalating costs stay correct.
 */
export function reconcileTiers(
  units: ListUnit[],
  dsMap: Map<string, Datasheet>,
): ListUnit[] {
  const order = new Map<string, number>();
  return units.map((u) => {
    const ds = dsMap.get(u.datasheetId);
    const idx = (order.get(u.datasheetId) ?? 0) + 1;
    order.set(u.datasheetId, idx);
    if (!ds) return u;
    // Resolve the cost bracket: by chosen model count (size range) when countable,
    // otherwise by the stored variant. Then apply the pick-order tier for this position.
    const variant =
      ds.countable && u.modelCount != null
        ? bracketForCount(ds, u.modelCount)
        : u.variantKey ?? u.pointsLabel;
    const opts = ds.points.filter((p) => (p.variant ?? p.description) === variant);
    if (!opts.length) return u;
    const match = (ds.has_order_tiers ? opts.find((p) => inTier(p, idx)) : opts[0]) ?? opts[0];
    if (
      intOf(match.cost) === intOf(u.pointsCost) &&
      match.description === u.pointsLabel &&
      (u.variantKey ?? '') === variant
    )
      return u;
    return { ...u, pointsCost: intOf(match.cost), pointsLabel: match.description, variantKey: variant };
  });
}

export function emptyList(
  factionId: string,
  battleSizeId: string,
  name: string,
): ArmyList {
  const now = Date.now();
  return {
    id: uid(),
    name,
    factionId,
    battleSizeId,
    detachmentIds: [],
    units: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ----- favourites (persisted in localStorage, keyed by kind: 'det' | 'ds') -----
const FAV_KEY = 'new40k:favorites';
function readFavs(): Record<string, string[]> {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
export function getFavorites(kind: string): string[] {
  return readFavs()[kind] ?? [];
}
export function toggleFavorite(kind: string, id: string): string[] {
  const all = readFavs();
  const cur = new Set(all[kind] ?? []);
  if (cur.has(id)) cur.delete(id);
  else cur.add(id);
  all[kind] = [...cur];
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / private mode */
  }
  return all[kind];
}

/** Count current copies of a datasheet (for Rule-of-Three UI affordances). */
export function copiesOf(list: ArmyList, datasheetId: string): number {
  return list.units.filter((u) => u.datasheetId === datasheetId).length;
}

/** Datasheets indexed by id, for fast lookup from saved ListUnits. */
export function datasheetMap(fd: FactionData): Map<string, Datasheet> {
  return new Map(fd.datasheets.map((d) => [d.id, d]));
}

// ----- roster grouping by sub-type -----
export type UnitGroup = 'epic' | 'leader' | 'battleline' | 'other';
export const GROUP_ORDER: UnitGroup[] = ['epic', 'leader', 'battleline', 'other'];
export const GROUP_LABEL: Record<UnitGroup, string> = {
  epic: 'Epic Heroes',
  leader: 'Leaders & Supports',
  battleline: 'Battleline',
  other: 'Other datasheets',
};
export function unitGroup(u: ListUnit): UnitGroup {
  if (u.isEpicHero) return 'epic';
  if (u.isCharacter) return 'leader';
  if (u.isBattleline) return 'battleline';
  return 'other';
}

// ----- Leader / Support attachment -----
/** Units already in the list that this leader (Character) may attach to. */
export function eligibleBodyguards(
  leaderDs: Datasheet,
  list: ArmyList,
  dsById: Map<string, Datasheet>,
): ListUnit[] {
  const can = new Set(leaderDs.can_lead ?? []);
  if (!can.size) return [];
  return list.units.filter((u) => {
    const ds = dsById.get(u.datasheetId);
    return !u.isCharacter && ds != null && can.has(u.datasheetId);
  });
}
/** Characters in the list currently attached to the given bodyguard unit. */
export function attachedLeaders(bodyguardUid: string, list: ArmyList): ListUnit[] {
  return list.units.filter((u) => u.attachedToUid === bodyguardUid);
}

/**
 * Best-effort: does a detachment stratagem apply to a unit with these keywords?
 * `vocab` = every unit-type keyword that exists in the faction. If the stratagem's
 * target names none of them it is treated as general (applies to any unit); otherwise
 * it applies only when the unit shares at least one named keyword.
 */
export function stratagemAppliesTo(
  description: string,
  unitKeywords: string[],
  vocab: string[],
): boolean {
  const text = stripHtml(description).toUpperCase();
  const kws = new Set(unitKeywords.map((k) => k.toUpperCase()));
  // vocab keywords, longest-first so multi-word ones ("ADEPTUS ASTARTES") match before fragments
  const up = [...new Set(vocab.map((v) => v.toUpperCase()).filter((v) => v.length >= 3))].sort(
    (a, b) => b.length - a.length,
  );

  // Exclusion clauses anywhere in the rule ("excluding X", "cannot select an X", "other than
  // X"): a unit holding an excluded keyword is never a legal target — e.g. Rapid Ingress
  // "cannot select an Aircraft" must not appear on AIRCRAFT units.
  const exRe = /EXCLUDING|OTHER THAN|CANNOT SELECT|CANNOT INCLUDE|CANNOT TARGET|THAT IS NOT|THAT ARE NOT/g;
  for (let m = exRe.exec(text); m; m = exRe.exec(text)) {
    const win = text.slice(m.index, m.index + 60);
    if (up.some((v) => win.includes(v) && kws.has(v))) return false;
  }

  let target = text.match(/TARGET:?\s*([\s\S]*?)(?:EFFECT:|WHEN:|RESTRICTIONS:|$)/)?.[1] ?? text;
  // drop exclusion clauses so "excluding TERMINATOR" isn't read as a requirement
  target = target.split(/EXCLUDING|OTHER THAN|THAT IS NOT|THAT ARE NOT|CANNOT/)[0];
  return matchKeywordExpr(target, kws, up);
}

/**
 * Does a unit satisfy the keyword expression in `phrase`? Adjacency = AND (new group);
 * "/", "," or "or" between keywords = OR (same group). A unit qualifies when every AND-group
 * holds at least one of its keywords. No recognised keyword in the phrase → unconstrained (true).
 * `up` = vocab keywords, uppercase, longest-first.
 */
function matchKeywordExpr(phrase: string, kws: Set<string>, up: string[]): boolean {
  const taken = new Array(phrase.length).fill(false);
  const hits: { kw: string; start: number; end: number }[] = [];
  for (const v of up) {
    for (let i = phrase.indexOf(v); i !== -1; i = phrase.indexOf(v, i + 1)) {
      if (taken.slice(i, i + v.length).some(Boolean)) continue;
      hits.push({ kw: v, start: i, end: i + v.length });
      for (let j = i; j < i + v.length; j++) taken[j] = true;
    }
  }
  if (!hits.length) return true;
  hits.sort((a, b) => a.start - b.start);
  const groups: string[][] = [[hits[0].kw]];
  for (let k = 1; k < hits.length; k++) {
    const gap = phrase.slice(hits[k - 1].end, hits[k].start);
    if (/[/,]|(^|\W)OR(\W|$)/.test(gap)) groups[groups.length - 1].push(hits[k].kw);
    else groups.push([hits[k].kw]);
  }
  return groups.every((g) => g.some((kw) => kws.has(kw)));
}

/**
 * Many enhancements are restricted to a model type ("GRAVIS model only", "CAPTAIN model only",
 * "Watch Master or Techmarine model only"). Returns whether a unit with `unitKeywords` may take
 * the enhancement. No "… model only" clause, or an unrecognised keyword → allowed (fail-open).
 */
export function enhancementAllowed(
  description: string,
  unitKeywords: string[],
  vocab: string[],
): boolean {
  const text = stripHtml(description).toUpperCase();
  const m = text.match(/(?:^|\.\s*)([A-Z][A-Z0-9 '/\-]*?)\s+MODELS?\s+ONLY/);
  if (!m) return true;
  const kws = new Set(unitKeywords.map((k) => k.toUpperCase()));
  const up = [...new Set(vocab.map((v) => v.toUpperCase()).filter((v) => v.length >= 3))].sort(
    (a, b) => b.length - a.length,
  );
  return matchKeywordExpr(m[1], kws, up);
}

/**
 * A unit's keywords including those a chosen detachment grants it
 * (e.g. Fulguris Task Force gives LAND SPEEDER units the SPEEDER keyword). Returned uppercase.
 */
export function effectiveKeywords(
  unitKeywords: string[],
  chosenDetachments: Detachment[],
): string[] {
  const kws = new Set(unitKeywords.map((k) => k.toUpperCase()));
  for (const det of chosenDetachments) {
    for (const g of det.keyword_grants ?? []) {
      if (g.when.some((w) => kws.has(w.toUpperCase()))) kws.add(g.grant.toUpperCase());
    }
  }
  return [...kws];
}

/**
 * All unit-type keywords relevant for stratagem matching: every keyword on the faction's
 * datasheets plus every keyword any detachment can grant (so e.g. SPEEDER is recognised as a
 * constraint even though no datasheet carries it natively).
 */
export function factionKeywordVocab(fd: FactionData): string[] {
  const set = new Set<string>();
  for (const d of fd.datasheets) {
    for (const k of d.keywords ?? []) if (k.length >= 3) set.add(k);
    for (const k of d.faction_keywords ?? []) if (k.length >= 3) set.add(k);
  }
  for (const det of fd.detachments ?? []) {
    for (const g of det.keyword_grants ?? []) if (g.grant.length >= 3) set.add(g.grant);
  }
  // longest first so multi-word keywords match before their fragments
  return [...set].sort((a, b) => b.length - a.length);
}

/** Human-readable text export of an army list. */
export function exportListText(
  list: ArmyList,
  fd: FactionData,
  detachments: Detachment[],
  battleSizeName: string,
  pointsTotal: number,
  pointsLimit: number,
): string {
  const lines: string[] = [];
  lines.push(`${list.name}`);
  lines.push(
    `${fd.faction.name} — ${battleSizeName} (${pointsTotal}/${pointsLimit} pts)`,
  );
  const dets = detachments.filter((d) => list.detachmentIds.includes(d.id));
  if (dets.length) lines.push(`Detachments: ${dets.map((d) => d.name).join(', ')}`);
  lines.push('');

  const warlord = list.units.find((u) => u.warlord);
  for (const u of list.units) {
    const tags: string[] = [];
    if (u.uid === warlord?.uid) tags.push('WARLORD');
    if (u.isAlly) tags.push('ALLY');
    if (u.enhancementName)
      tags.push(`+${u.enhancementName} (${u.enhancementCost ?? 0})`);
    for (const w of u.wargearCosts ?? [])
      if (w.qty > 0) tags.push(`${w.qty}x ${w.name} (${intOf(w.cost) * w.qty})`);
    const cost = unitTotal(u);
    lines.push(
      `• ${u.name} [${u.pointsLabel}] — ${cost} pts${
        tags.length ? '  {' + tags.join(', ') + '}' : ''
      }`,
    );
  }
  lines.push('');
  lines.push(`Total: ${pointsTotal} / ${pointsLimit} pts`);
  lines.push('');
  lines.push('Built with New40k List Builder by Alhazred.sh — Powered by Wahapedia (unofficial).');
  return lines.join('\n');
}

export function download(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
