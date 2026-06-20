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
): ListUnit {
  return {
    uid: uid(),
    datasheetId: ds.id,
    name: ds.name,
    pointsCost: intOf(tier.cost),
    pointsLabel: tier.description,
    isEpicHero: ds.is_epic_hero,
    isBattleline: ds.is_battleline,
    isCharacter: ds.is_character,
    isAlly: false,
    warlord: false,
  };
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
