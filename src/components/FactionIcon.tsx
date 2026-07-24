// Faction badge: icon + accent color, in the same style as DispositionIcon (simple glyphs,
// not scraped GW/Wahapedia artwork — keeps it license-clean and consistent with the app's
// existing icon set). Keyed by the faction ids in public/data/index.json.
export const FACTIONS: Record<string, { icon: string; color: string }> = {
  AS: { icon: '✚', color: '#d94f4f' },
  AC: { icon: '☉', color: '#d4af37' },
  AdM: { icon: '⚙', color: '#c0392b' },
  TL: { icon: '▲', color: '#8a7a5c' },
  AE: { icon: '✧', color: '#3fa9d9' },
  AM: { icon: '⛨', color: '#6b7d4f' },
  CD: { icon: '☽', color: '#8e44ad' },
  QT: { icon: '♞', color: '#7a1818' },
  CSM: { icon: '✕', color: '#6b1414' },
  DG: { icon: '☣', color: '#6f8f3f' },
  DRU: { icon: '⚔', color: '#4a1f5c' },
  EC: { icon: '❁', color: '#a63d8f' },
  GC: { icon: '✶', color: '#7a2e8e' },
  GK: { icon: '✝', color: '#9aa5b1' },
  AoI: { icon: '◈', color: '#4a4a6a' },
  QI: { icon: '♘', color: '#3a5f8a' },
  LoV: { icon: '⛏', color: '#b5772f' },
  NEC: { icon: '☥', color: '#3fae6a' },
  ORK: { icon: '⚒', color: '#5a8f3f' },
  SM: { icon: '✠', color: '#2a52a0' },
  TS: { icon: '☄', color: '#3a7ca5' },
  TYR: { icon: '✺', color: '#6a1a8a' },
  TAU: { icon: '⊙', color: '#d97b2f' },
  WE: { icon: 'Ⅷ', color: '#8a1414' },
};

export function FactionIcon({
  id,
  name,
  iconOnly,
}: {
  id: string;
  name?: string;
  iconOnly?: boolean;
}) {
  const f = FACTIONS[id];
  if (!f) return name ? <span>{name}</span> : null;
  return (
    <span className="faction-icon" style={{ color: f.color }} title={name ?? id}>
      <span aria-hidden>{f.icon}</span>
      {!iconOnly && name && <span className="faction-icon-name">{name}</span>}
    </span>
  );
}
