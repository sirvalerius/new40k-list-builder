import type { ListUnit } from '../lib/types';
import { md } from '../lib/md';
import { Collapsible } from './Collapsible';

/** Pinned banner (same slot as ValidationBanner) flagging units in the open list that a recent
 *  (last 30 days) points/rules changelog entry mentions — see helpers.recentlyChangedUnits. */
export function RecentChangesBanner({
  changes,
}: {
  changes: { unit: ListUnit; items: string[] }[];
}) {
  if (changes.length === 0) return null;
  return (
    <div className="banner info">
      <Collapsible
        defaultOpen
        title={`🆕 ${changes.length} unit${changes.length === 1 ? '' : 's'} in this list changed recently`}
      >
        {changes.map(({ unit, items }) => (
          <div key={unit.uid} className="mb">
            <div className="muted small" style={{ fontWeight: 600 }}>
              {unit.customName ? `${unit.customName} (${unit.name})` : unit.name}
            </div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
              {items.map((item, i) => (
                <li key={i}>{md(item)}</li>
              ))}
            </ul>
          </div>
        ))}
      </Collapsible>
    </div>
  );
}
