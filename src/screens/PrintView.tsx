import type { ArmyList, Detachment, FactionData } from '../lib/types';
import { PrintCard } from '../components/PrintCard';
import { datasheetMap, mergedUnitGroups } from '../lib/helpers';

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
          <PrintCard key={anchor.uid} title={title} members={members} dsById={dsById} />
        ))}
      </div>
    </div>
  );
}
