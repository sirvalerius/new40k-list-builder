import type { Ability, Datasheet, Detachment, Enhancement, FactionData, ListUnit } from '../lib/types';
import { StatLine } from './StatLine';
import { WeaponTable } from './DatasheetCard';
import {
  displayName,
  enhancementCoreRules,
  enhancementFor,
  equippedWeapons,
  intOf,
  stripHtml,
  unitAbilities,
  unitTotal,
} from '../lib/helpers';

// Compact, always-expanded datacard for the printed reference sheet: no collapsibles or
// sub-tabs (nothing to click on paper), ranged + melee weapons in one table, and only the
// information a player actually checks mid-game — not the browsing aids (keyword chips,
// "can join" list) that matter when building the list, not when playing it.
function PrintMember({
  ds,
  unit,
  enhancement,
  enhancementCoreRules: enhCoreRules,
}: {
  ds: Datasheet;
  unit: ListUnit;
  enhancement?: Enhancement;
  enhancementCoreRules?: Ability[];
}) {
  const weapons = equippedWeapons(ds, unit.wargearCosts ?? [], unit.modelCount);
  // The enhancement's own effect text is shown like a unit-specific rule; its Core-rule mentions
  // (enhCoreRules, resolved by the caller) fold into the same name-only treatment as the unit's
  // own Core rules just below.
  const enhancementAbility: Ability | null = enhancement
    ? { name: enhancement.name, type: 'Enhancement', parameter: `(+${enhancement.cost} pts)`, description: enhancement.description }
    : null;
  const abilities = [...unitAbilities(ds, unit.wargearCosts ?? []), ...(enhCoreRules ?? [])];
  // Core rules (Deep Strike, Stealth, ...) are the long glossary text every player already
  // knows by name; some run long enough to blow up this card's break-inside:avoid block and
  // wreck the page's column packing. Name-only here — PrintView prints the full text once,
  // deduped, in a shared rules block at the end of the sheet.
  const coreNames = abilities
    .filter((a) => a.type === 'Core')
    .map((a) => `${a.name}${a.parameter ? ` ${a.parameter}` : ''}`);
  const otherAbilities = [
    ...(enhancementAbility ? [enhancementAbility] : []),
    ...abilities.filter((a) => a.type !== 'Core'),
  ];
  const loadout = (unit.wargearCosts ?? []).filter((w) => w.qty > 0);
  const tags = [
    unit.warlord ? 'Warlord' : '',
    unit.enhancementName ? `+${unit.enhancementName} (${unit.enhancementCost ?? 0})` : '',
  ].filter(Boolean);

  return (
    <div className="col" style={{ gap: 4 }}>
      {/* The compact "core" (name/stats/weapons/loadout) is its own break-inside:avoid block,
          separate from the ability paragraphs below — a long unit-specific rule (see
          print-ability below) can then flow onto a fresh page/column on its own without
          dragging this always-small block down with it, and without being dragged down itself. */}
      <div className="col print-core" style={{ gap: 4 }}>
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
        {coreNames.length > 0 && (
          <div className="tiny muted">{coreNames.join(' · ')}</div>
        )}
      </div>
      {otherAbilities.map((a, i) => (
        // Each ability is its own break-inside:avoid block (not one shared block) so the page
        // can break BETWEEN abilities instead of either dragging the whole card along or
        // splitting a single ability's text mid-sentence.
        <div key={i} className="tiny print-ability">
          {a.name && <b>{a.name}{a.parameter ? ` ${a.parameter}` : ''}: </b>}
          {stripHtml(a.description)}
        </div>
      ))}
    </div>
  );
}

export function PrintCard({
  title,
  members,
  dsById,
  fd,
  detachments,
}: {
  title: string;
  members: ListUnit[];
  dsById: Map<string, Datasheet>;
  fd: FactionData;
  detachments: Detachment[];
}) {
  return (
    <div className="card bunker print-card">
      <div className="bunker-title">{title}</div>
      {members.map((m) => {
        const ds = dsById.get(m.datasheetId);
        if (!ds) return null;
        const enhancement = enhancementFor(detachments, m.enhancementName);
        return (
          <div key={m.uid} className="bunker-member">
            <PrintMember
              ds={ds}
              unit={m}
              enhancement={enhancement}
              enhancementCoreRules={
                enhancement
                  ? enhancementCoreRules(
                      enhancement.description,
                      fd,
                      unitAbilities(ds, m.wargearCosts ?? []),
                    )
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}
