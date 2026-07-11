import type { Datasheet, ListUnit } from '../lib/types';
import { StatLine } from './StatLine';
import { WeaponTable } from './DatasheetCard';
import { displayName, equippedWeapons, intOf, stripHtml, unitTotal } from '../lib/helpers';

// Compact, always-expanded datacard for the printed reference sheet: no collapsibles or
// sub-tabs (nothing to click on paper), ranged + melee weapons in one table, and only the
// information a player actually checks mid-game — not the browsing aids (keyword chips,
// "can join" list) that matter when building the list, not when playing it.
function PrintMember({ ds, unit }: { ds: Datasheet; unit: ListUnit }) {
  const weapons = equippedWeapons(ds, unit.wargearCosts ?? []);
  const abilities = ds.abilities.filter((a) => a.name || a.description);
  const loadout = (unit.wargearCosts ?? []).filter((w) => w.qty > 0);
  const tags = [
    unit.warlord ? 'Warlord' : '',
    unit.enhancementName ? `+${unit.enhancementName} (${unit.enhancementCost ?? 0})` : '',
  ].filter(Boolean);

  return (
    <div className="col" style={{ gap: 4 }}>
      <div className="row wrap" style={{ gap: 6, alignItems: 'baseline' }}>
        <b>{displayName(unit)}</b>
        <span className="muted tiny">
          {unit.pointsLabel} · {unitTotal(unit)} pts
          {tags.length ? ` · ${tags.join(' · ')}` : ''}
        </span>
      </div>
      {ds.stats[0] && <StatLine stat={ds.stats[0]} />}
      {ds.transport && ds.transport.trim() && (
        <div className="tiny muted">🚛 {stripHtml(ds.transport)}</div>
      )}
      {weapons.length > 0 && <WeaponTable weapons={weapons} />}
      {loadout.length > 0 && (
        <div className="tiny muted">
          {loadout.map((w) => `${w.qty}× ${w.name}${intOf(w.cost) ? ` (+${intOf(w.cost) * w.qty})` : ''}`).join(' · ')}
        </div>
      )}
      {abilities.length > 0 && (
        <div className="tiny">
          {abilities.map((a, i) => (
            <div key={i}>
              {a.name && <b>{a.name}: </b>}
              {stripHtml(a.description)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PrintCard({
  title,
  members,
  dsById,
}: {
  title: string;
  members: ListUnit[];
  dsById: Map<string, Datasheet>;
}) {
  return (
    <div className="card bunker print-card">
      <div className="bunker-title">{title}</div>
      {members.map((m) => {
        const ds = dsById.get(m.datasheetId);
        if (!ds) return null;
        return (
          <div key={m.uid} className="bunker-member">
            <PrintMember ds={ds} unit={m} />
          </div>
        );
      })}
    </div>
  );
}
