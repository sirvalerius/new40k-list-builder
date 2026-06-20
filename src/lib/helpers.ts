// Misc pure helpers used across the UI.
import type {
  ArmyList,
  Datasheet,
  Detachment,
  FactionData,
  ListUnit,
  PointsOption,
} from './types';

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

/** Count current copies of a datasheet (for Rule-of-Three UI affordances). */
export function copiesOf(list: ArmyList, datasheetId: string): number {
  return list.units.filter((u) => u.datasheetId === datasheetId).length;
}

/** Datasheets indexed by id, for fast lookup from saved ListUnits. */
export function datasheetMap(fd: FactionData): Map<string, Datasheet> {
  return new Map(fd.datasheets.map((d) => [d.id, d]));
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
    const cost = intOf(u.pointsCost) + intOf(u.enhancementCost);
    lines.push(
      `• ${u.name} [${u.pointsLabel}] — ${cost} pts${
        tags.length ? '  {' + tags.join(', ') + '}' : ''
      }`,
    );
  }
  lines.push('');
  lines.push(`Total: ${pointsTotal} / ${pointsLimit} pts`);
  lines.push('');
  lines.push('Built with New40k List Builder — Powered by Wahapedia (unofficial).');
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
