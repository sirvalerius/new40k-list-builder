import type { Ability, ArmyList, Detachment, FactionData } from '../lib/types';
import { PrintCard } from '../components/PrintCard';
import {
  datasheetMap,
  enhancementCoreRules,
  enhancementFor,
  mergedUnitGroups,
  stripHtml,
  unitAbilities,
} from '../lib/helpers';

// Printable reference sheet: every fielded unit (Leader/Support merged with its bodyguard,
// same grouping as the in-game tab) as a compact, always-expanded datacard. Packed via
// CSS multi-column flow (index.css `.print-sheet .print-cards`) so the browser's print
// dialog ("Save as PDF") fills each page densely instead of one card per page.
export function PrintView({
  list,
  fd,
  detachments,
  battleSizeName,
  pointsTotal,
  pointsLimit,
}: {
  list: ArmyList;
  fd: FactionData;
  detachments: Detachment[];
  battleSizeName: string;
  pointsTotal: number;
  pointsLimit: number;
}) {
  const dsById = datasheetMap(fd);
  const chosenDet = detachments.filter((d) => list.detachmentIds.includes(d.id));
  const groups = mergedUnitGroups(list);

  if (!list.units.length) {
    return <div className="empty">Add units to print a reference sheet.</div>;
  }

  // Core rules (Deep Strike, Stealth, ...) are name-only on each unit's card (see PrintCard) —
  // some run long enough to blow up a card's break-inside:avoid block and wreck the page's
  // column packing. Collect the full text once per distinct rule — from the unit's own
  // abilities AND from any enhancement's text that grants one — printed as a single shared
  // block below the cards instead of repeated on every unit that has it.
  const coreRules = new Map<string, Ability>();
  for (const u of list.units) {
    const ds = dsById.get(u.datasheetId);
    if (!ds) continue;
    const own = unitAbilities(ds, u.wargearCosts ?? []);
    for (const a of own) {
      if (a.type === 'Core' && a.name) coreRules.set(a.name, a);
    }
    const enh = enhancementFor(detachments, u.enhancementName);
    if (enh) {
      for (const a of enhancementCoreRules(enh.description, fd, own)) coreRules.set(a.name, a);
    }
  }
  const sortedCoreRules = [...coreRules.values()].sort((a, b) => a.name.localeCompare(b.name));
  // Actual origin + base path, not a hardcoded URL — correct on GitHub Pages, a future custom
  // domain, or a local dev/preview server alike.
  const appUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;

  return (
    <div className="print-sheet">
      <div className="print-toolbar no-print">
        <button className="primary small" onClick={() => window.print()}>
          🖶 Print / Save as PDF
        </button>
      </div>

      <div className="card small mb">
        <b>{list.name}</b> — {fd.faction.name} · {battleSizeName} ({pointsTotal}/{pointsLimit} pts)
        {chosenDet.length > 0 && (
          <div className="muted tiny">{chosenDet.map((d) => d.name).join(', ')}</div>
        )}
        {list.disposition && <div className="muted tiny">Force Disposition: {list.disposition}</div>}
      </div>

      <div className="print-cards">
        {groups.map(({ anchor, members, title }) => (
          <PrintCard
            key={anchor.uid}
            title={title}
            members={members}
            dsById={dsById}
            fd={fd}
            detachments={detachments}
          />
        ))}
      </div>

      {sortedCoreRules.length > 0 && (
        <div className="card small print-core-rules">
          <b>Universal Special Rules</b>
          <div className="col" style={{ gap: 4, marginTop: 4 }}>
            {sortedCoreRules.map((a) => (
              <div key={a.name} className="tiny">
                <b>{a.name}{a.parameter ? ` ${a.parameter}` : ''}: </b>
                {stripHtml(a.description)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tiny muted center mt">
        Generated with New40k List Builder — {appUrl}
      </div>
    </div>
  );
}
