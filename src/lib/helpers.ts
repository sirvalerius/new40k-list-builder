// Misc pure helpers used across the UI.
import type {
  Ability,
  ArmyList,
  ChosenWargear,
  Datasheet,
  Detachment,
  Enhancement,
  FactionData,
  ListUnit,
  PointsOption,
  Rules,
  Weapon,
} from './types';

export const normName = (s: string): string =>
  (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Weapon profiles a unit actually fields, given its chosen loadout (`selected`).
 * Hides: upgrade weapons whose option wasn't taken; weapons that belong only to an
 * optional sub-model (e.g. an Invader ATV) that wasn't purchased; a base weapon that
 * EVERY model carrying it has swapped away. A squad-wide "up to N models may replace X"
 * option (e.g. Pathfinders' pulse carbine, max 3 of 10) only removes the base once the
 * chosen quantity reaches the model count — until then most models still carry it, so it
 * stays listed alongside the swapped-in weapon. `modelCount` defaults to the datasheet max.
 * When `selected` is undefined (browsing), every weapon is shown.
 *
 * "Is this weapon shown by default" is decided from `ds.stock_weapons` — the datasheet's own
 * "<Role> is equipped with: ..." text, parsed once at build time — NOT from whether some
 * option's `grants` mentions it. A weapon can be simultaneously one role's default (a Chimera
 * hull heavy bolter, a Crusader Squad Sword Brother's heavy bolt pistol) and a different
 * slot/role's optional swap-in target (the Chimera turret's heavy bolter option, an Initiate's
 * bolt-rifle swap); inferring "default" from absence-in-grants collapses that distinction and
 * hides the default copy the instant ANY option can also grant that name.
 */
export function equippedWeapons(ds: Datasheet, selected?: ChosenWargear[], modelCount?: number): Weapon[] {
  const weapons = (ds.weapons ?? []).filter((w) => w.name);
  const opts = ds.weapon_options ?? [];
  if (selected == null || !opts.length) return weapons;

  const chosenQty = new Map(selected.filter((s) => s.qty > 0).map((s) => [s.name, s.qty]));
  const chosen = new Set(chosenQty.keys());
  const count = modelCount ?? ds.model_max ?? 1;
  const addonModels = new Set(
    opts.filter((o) => o.type === 'model' && o.model).map((o) => o.model as string),
  );
  const addonTaken = new Set(
    opts.filter((o) => o.type === 'model' && o.model && chosen.has(o.text)).map((o) => o.model as string),
  );

  const grantedAll = new Set<string>();        // a weapon some option can add (fallback only, see below)
  const grantedNow = new Set<string>();        // a weapon a CHOSEN option adds
  const replacedNow = new Set<string>();       // base swapped away by every model that carried it
  const addonForWeapon = new Map<string, string>(); // weapon -> the sub-model it belongs to
  const swappedByBase = new Map<string, number>();  // base -> total models swapped off it (squad-wide options)
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
      // A combo base ("combi-bolter and accursed weapon" -> 1 paired accursed weapons") names
      // more than one weapon; treat each as its own base so a chosen swap hides all of them,
      // not just a phrase that never matches any single weapon's name.
      const bases = o.base.split(/\s*(?:,|&|\band\b)\s*/i).map(normName).filter(Boolean);
      const onAddon = !!o.model && addonModels.has(o.model);
      if (onAddon) {
        for (const b of bases) addonForWeapon.set(b, o.model as string);
        // a named sub-model's own weapon is unique to it, so a chosen swap removes it outright
        if (chosen.has(o.text)) for (const b of bases) replacedNow.add(b);
      } else if (o.limit?.kind === 'fixed' && chosen.has(o.text)) {
        const qty = chosenQty.get(o.text) ?? 0;
        for (const b of bases) swappedByBase.set(b, (swappedByBase.get(b) ?? 0) + qty);
      }
    }
  }
  for (const [base, qty] of swappedByBase) {
    if (qty >= count) replacedNow.add(base); // only every model swapping hides the base
  }

  // Authoritative default-loadout set. A handful of datasheets have no parseable "equipped
  // with" text (e.g. Kill Team Cassius) — fall back to the old inference (never mentioned in
  // any option's grants = stock) so those aren't left with an empty default loadout.
  const stockFromLoadout = new Set((ds.stock_weapons ?? []).map(normName));
  const stockWeapons = stockFromLoadout.size
    ? stockFromLoadout
    : new Set(weapons.map((w) => normName(w.name)).filter((n) => !grantedAll.has(n)));

  // "Heavy plasma cannon – standard/– supercharge" are firing modes of one weapon; a swap names
  // the weapon without the mode, so match the mode-stripped name too.
  const modeBase = (name: string) => normName(name.split(/\s+[–-]\s+/)[0]);
  return weapons.filter((w) => {
    const n = normName(w.name);
    const requiresAddon = addonForWeapon.get(n);
    if (requiresAddon && !addonTaken.has(requiresAddon)) return grantedNow.has(n);
    if (replacedNow.has(n) || replacedNow.has(modeBase(w.name))) return false; // replaced base
    if (stockWeapons.has(n)) return true;              // authoritative default loadout
    return grantedNow.has(n);                          // pure upgrade: shown only once chosen
  });
}

/**
 * Abilities a unit's card should list, given its chosen loadout (`selected`).
 * - Faction-type (the army-wide rule, e.g. Oath of Moment) is excluded: shown once, army-wide,
 *   in the bunker view's Army rules card — repeating it on every unit's card is just clutter.
 * - "Wargear profile"-type entries are glossary text for a weapon keyword (e.g. Seeker missile's
 *   "one shot") that's already shown inline under that weapon's row; excluded as a duplicate.
 * - Wargear-type entries (e.g. a Homing Beacon or drone accessory) describe what a specific
 *   piece of wargear does, so only show while that option is actually taken — matched loosely
 *   (substring, either direction) against the chosen option's text, since options are often a
 *   full sentence ("...can be equipped with 1 homing beacon") rather than just the item's name.
 * - Everything else (Core rules like Stealth/Infiltrators, and the unit's own Datasheet-type
 *   special rules) is innate and always shown. When `selected` is undefined (browsing), every
 *   Wargear-type entry is shown too, same as `equippedWeapons`.
 */
export function unitAbilities(ds: Datasheet, selected?: ChosenWargear[]): Ability[] {
  const chosenNames = (selected ?? [])
    .filter((s) => s.qty > 0)
    .map((s) => normName(s.name));
  return (ds.abilities ?? []).filter((a) => {
    if (!a.name && !a.description) return false;
    if (a.type === 'Faction' || a.type === 'Wargear profile') return false;
    if (a.type === 'Wargear') {
      if (selected == null) return true;
      const an = normName(a.name);
      return chosenNames.some((cn) => cn.includes(an) || an.includes(cn));
    }
    return true;
  });
}

/** The Enhancement object for a unit's `enhancementName` — enhancements are detachment-scoped,
 *  not datasheet-scoped, so this is resolved against the list's chosen detachments. */
export function enhancementFor(detachments: Detachment[], name?: string): Enhancement | undefined {
  if (!name) return undefined;
  for (const d of detachments) {
    const e = d.enhancements.find((e) => e.name === name);
    if (e) return e;
  }
  return undefined;
}

/** Core rules (Deep Strike, Stealth, ...) an enhancement's own text grants/references, resolved
 * against the Core abilities already present somewhere in this faction's datasheets — the
 * canonical source for their full wording, since an enhancement's text just names the rule
 * rather than repeating its glossary entry. `already` (the unit's own abilities) is excluded so
 * a rule the unit already has innately isn't listed a second time. */
export function enhancementCoreRules(
  description: string,
  fd: FactionData,
  already: Ability[] = [],
): Ability[] {
  const known = new Map<string, Ability>();
  for (const ds of fd.datasheets) {
    for (const a of ds.abilities ?? []) {
      if (a.type === 'Core' && a.name && !known.has(a.name)) known.set(a.name, a);
    }
  }
  const seen = new Set(already.filter((a) => a.type === 'Core').map((a) => a.name));
  const text = ` ${normName(stripHtml(description))} `;
  return [...known.values()].filter(
    (a) => !seen.has(a.name) && text.includes(` ${normName(a.name)} `),
  );
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

/** Reconcile a unit's mandatory stock-weapon costs (`ds.default_wargear`) to its current
 *  model count: added at qty 0, kept in sync as the count changes. Not a player choice —
 *  just points the MFM attaches to a weapon the unit always fields (e.g. Tau Crisis suits'
 *  standard Missile pod), so they must always be present alongside the paid options. */
function withDefaultWargear(wargear: ChosenWargear[], ds: Datasheet, count: number): ChosenWargear[] {
  let out = wargear;
  for (const d of ds.default_wargear ?? []) {
    const i = out.findIndex((w) => w.name === d.name);
    if (i === -1) out = [...out, { name: d.name, cost: d.cost, qty: count }];
    else if (out[i].qty !== count) out = out.map((w, j) => (j === i ? { ...w, qty: count } : w));
  }
  return out;
}

/** Clamp a unit's chosen weapon-option quantities to their per-option limits
 *  for the unit's current model count (used when the model count changes). */
export function clampLoadout(unit: ListUnit, ds: Datasheet): ChosenWargear[] {
  const count = unit.modelCount ?? ds.model_max ?? 1;
  const opts = ds.weapon_options ?? [];
  const limitOf = new Map(opts.map((o) => [o.text, o.limit]));
  let wargear = withDefaultWargear(unit.wargearCosts ?? [], ds, count).map((w) => {
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
  // Per-weapon caps from "cannot be equipped with more than N <weapon>" — span option groups,
  // so a weapon offered in two lists (Defiler Electroscourge, Hive Tyrant heavy venom cannon)
  // can't exceed N in total.
  const nrm = (s: string) => stripHtml(s).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const WORDNUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };
  const wCap = new Map<string, number>();
  for (const o of opts) {
    const m = stripHtml(o.text).match(
      /cannot be equipped with more than (one|two|three|four|\d+)\s+([a-z][a-z '-]+)/i,
    );
    if (m) wCap.set(nrm(m[2]), WORDNUM[m[1].toLowerCase()] ?? parseInt(m[1], 10));
  }
  if (wCap.size) {
    const remaining = new Map(wCap);
    wargear = wargear.map((w) => {
      const o = opts.find((op) => op.text === w.name);
      let q = w.qty;
      for (const g of o?.grants ?? []) {
        const cap = remaining.get(nrm(g));
        if (cap != null) {
          q = Math.min(q, Math.max(0, cap));
          remaining.set(nrm(g), cap - q);
        }
      }
      return q !== w.qty ? { ...w, qty: q } : w;
    });
  }
  // group_max: mixed-unit sub-types (Kill Teams) share a slot pool — total ≤ group_max.
  const groupBudget = new Map<string, number>();
  for (const o of opts) if (o.group && o.group_max != null) groupBudget.set(o.group, o.group_max);
  if (groupBudget.size) {
    const used = new Map<string, number>();
    wargear = wargear.map((w) => {
      const o = opts.find((op) => op.text === w.name);
      if (o?.group && groupBudget.has(o.group)) {
        const u = used.get(o.group) ?? 0;
        const q = Math.min(w.qty, Math.max(0, groupBudget.get(o.group)! - u));
        used.set(o.group, u + q);
        return q !== w.qty ? { ...w, qty: q } : w;
      }
      return w;
    });
  }
  return wargear.filter((w) => w.qty > 0);
}

/** Max copies of a weapon option allowed for a unit of `modelCount` models.
 *  per_n = 1 per N (floor); all/slots/fixed per the limit; null = unbounded. */
export function optionMax(
  limit:
    | { kind: string; n?: number; per?: number; slots?: number; max?: number; counts?: Record<string, number> }
    | undefined,
  modelCount: number,
): number | null {
  if (!limit) return null;
  switch (limit.kind) {
    case 'per_n':
      return limit.n ? (limit.per ?? 1) * Math.floor(modelCount / limit.n) : modelCount;
    case 'slots':
      return modelCount * (limit.slots ?? 1); // aggregate per-model slots (Crisis)
    case 'subpop': // capped by a named sub-population's size at this model count (Crusader)
      return limit.counts
        ? limit.counts[String(modelCount)] ?? Math.max(...Object.values(limit.counts))
        : modelCount;
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
  const mc = modelCount ?? tier.models ?? undefined;
  const defaults = (ds.default_wargear ?? []).map((d) => ({
    name: d.name,
    cost: d.cost,
    qty: mc ?? ds.model_max ?? 1,
  }));
  return {
    uid: uid(),
    datasheetId: ds.id,
    name: ds.name,
    pointsCost: intOf(tier.cost),
    pointsLabel: tier.description,
    variantKey: tier.variant ?? tier.description,
    modelCount: mc,
    requiresDetachment: ds.requires_detachment || undefined,
    isEpicHero: ds.is_epic_hero,
    isBattleline: ds.is_battleline,
    isCharacter: ds.is_character,
    isAlly: false,
    warlord: false,
    wargearCosts: defaults.length ? defaults : undefined,
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

/** Deep-clones a saved list under a new id, "<name> (copy)", ready to save and open. Unit
 *  uids are regenerated too (not just the list id), with attachedToUid remapped to match —
 *  keeps Leader/Bodyguard attachments intact while guaranteeing the copy shares no id with
 *  the original at any level. */
export function duplicateList(list: ArmyList): ArmyList {
  const now = Date.now();
  const idMap = new Map(list.units.map((u) => [u.uid, uid()]));
  const units = list.units.map((u) => ({
    ...u,
    uid: idMap.get(u.uid)!,
    attachedToUid: u.attachedToUid ? idMap.get(u.attachedToUid) : undefined,
    wargearCosts: u.wargearCosts?.map((w) => ({ ...w })),
  }));
  return { ...list, id: uid(), name: `${list.name} (copy)`, units, createdAt: now, updatedAt: now };
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

/** The army-wide rule(s) (e.g. Oath of Moment, For the Greater Good) in play, read off the
 *  fielded units' own datasheets rather than hardcoded per faction — a Chapter-specific
 *  override (Black Templars' Templar Vows replacing Oath of Moment) is just a different
 *  Faction-type ability on that unit's datasheet, so it surfaces correctly with no special
 *  casing. Deduped by name, since normally every fielded unit shares the same one. */
export function armyRules(list: ArmyList, dsById: Map<string, Datasheet>): Ability[] {
  const seen = new Map<string, Ability>();
  for (const u of list.units) {
    const ds = dsById.get(u.datasheetId);
    for (const a of ds?.abilities ?? []) {
      if (a.type === 'Faction' && a.name && !seen.has(a.name)) seen.set(a.name, a);
    }
  }
  return [...seen.values()];
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

/** Name to show for a unit: the user's custom name if set, else the datasheet name. */
export function displayName(u: ListUnit): string {
  return u.customName?.trim() || u.name;
}

export interface MergedUnitGroup { anchor: ListUnit; members: ListUnit[]; title: string; }
/**
 * Fielded units merged for a reference card: a Leader/Support and its bodyguard share one
 * card (used by both the in-game "bunker" view and the print sheet). Unattached units get
 * a group of one.
 */
export function mergedUnitGroups(list: ArmyList): MergedUnitGroup[] {
  const primaries = list.units.filter((u) => !u.attachedToUid);
  return primaries.map((u) => {
    const joined = list.units.filter((x) => x.attachedToUid === u.uid);
    const members = [...joined, u]; // leaders/supports first, bodyguard last
    return { anchor: u, members, title: members.map((m) => displayName(m)).join(' + ') };
  });
}

/** The mission pair for a Force Disposition matchup, from your side's perspective
 *  (matchup rows are stored one-way in the data, so flip when `mine` is on the "b" side). */
export function missionMatchup(
  rules: Rules,
  mine: string,
  opponent: string,
): { my: string; their: string } | null {
  const m = (rules.disposition_matchups ?? []).find(
    (x) => (x.a === mine && x.b === opponent) || (x.a === opponent && x.b === mine),
  );
  if (!m) return null;
  return m.a === mine
    ? { my: m.mission_a, their: m.mission_b }
    : { my: m.mission_b, their: m.mission_a };
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
// Uppercase + fold the various apostrophes to a straight one, so "Emperor's Children" matches
// regardless of whether the source used ’ ‘ ` or '.
const kwNorm = (s: string) => (s || '').toUpperCase().replace(/[’‘`´]/g, "'");

export function stratagemAppliesTo(
  description: string,
  unitKeywords: string[],
  vocab: string[],
): boolean {
  const text = kwNorm(stripHtml(description));
  const kws = new Set(unitKeywords.map(kwNorm));
  // vocab keywords, longest-first so multi-word ones ("ADEPTUS ASTARTES") match before fragments
  const up = [...new Set(vocab.map(kwNorm).filter((v) => v.length >= 3))].sort(
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
  // The target unit's keywords come before "from your army"; everything after is a condition or
  // location ("embarked within a TRANSPORT", "that disembarked from a TRANSPORT") or a second
  // target — keywords there must NOT be read as requirements on this unit.
  target = target.split('FROM YOUR ARMY')[0];
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
  // Drop parentheticals ("(excluding Damned models)") so they don't break the requirement.
  const text = kwNorm(stripHtml(description)).replace(/\([^)]*\)/g, ' ');
  // The opening restriction: "<KEYWORDS> [model|unit] only" — the word model/unit is optional
  // (some read just "Biologus Putrifier only"). Anchored to a sentence start.
  // anchored to the start — the keyword restriction is always the opening clause, so we never
  // mistake an "only" deeper in the effect text for a requirement.
  const m = text.match(/^\s*([A-Z][A-Z0-9 ,'/\-]*?)\s+(?:MODELS?\s+|UNITS?\s+)?ONLY(?:[.\s]|$)/);
  if (!m) return true;
  const kws = new Set(unitKeywords.map(kwNorm));
  const up = [...new Set(vocab.map(kwNorm).filter((v) => v.length >= 3))].sort(
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
  if (list.disposition) lines.push(`Force Disposition: ${list.disposition}`);
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
      `• ${displayName(u)} [${u.pointsLabel}] — ${cost} pts${
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

/** Today's date as YYYYMMDD (no separators), for filenames. */
export function dateStamp(d = new Date()): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/** True if an ISO date (YYYY-MM-DD) is within the last `days` days (default 30). */
export function isRecentChange(dateIso: string | undefined, days = 30): boolean {
  if (!dateIso) return false;
  const then = new Date(dateIso).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= days * 24 * 60 * 60 * 1000;
}

/** Battle size whose preset points are closest to `points` — auto-picks a battle size when
 *  the user free-types a "max points" target (NewListWizard, Builder's list-settings edit). */
export function closestBattleSize(rules: Rules, points: number): string {
  return [...rules.battle_sizes].sort(
    (a, b) => Math.abs(intOf(a.points) - points) - Math.abs(intOf(b.points) - points),
  )[0]?.id ?? '';
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
