import type { ArmyList, Detachment, Enhancement } from '../lib/types';
import { intOf, stripHtml } from '../lib/helpers';

export function Enhancements({
  list,
  detachments,
  enhancementLimit,
  enhancementsUsed,
  onAssign,
  onClear,
}: {
  list: ArmyList;
  detachments: Detachment[];
  enhancementLimit: number;
  enhancementsUsed: number;
  onAssign: (uid: string, enh: Enhancement) => void;
  onClear: (uid: string) => void;
}) {
  const chosen = detachments.filter((d) => list.detachmentIds.includes(d.id));
  const available: Enhancement[] = chosen.flatMap((d) => d.enhancements);

  if (chosen.length === 0) {
    return (
      <div className="empty">
        Choose a detachment first — enhancements come from your detachments.
      </div>
    );
  }
  if (available.length === 0) {
    return (
      <div className="empty">
        The selected detachment(s) provide no enhancements.
      </div>
    );
  }

  const eligible = list.units.filter((u) => u.isCharacter);

  return (
    <div>
      <div
        className="banner ok"
        style={{
          background: 'var(--bg-elev)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      >
        Enhancements used: <b>{enhancementsUsed}</b> / {enhancementLimit}.
        Standard enhancements go on CHARACTER units; “(Upgrade)” ones can go on
        up to 3 non-Character units (counting as one choice).
      </div>

      {eligible.length === 0 && (
        <div className="empty">
          No CHARACTER units in the roster yet. Add a character to assign
          enhancements.
        </div>
      )}

      {list.units.map((u) => {
        const canBear = u.isCharacter; // upgrade-on-non-character handled by engine; surfaced below
        return (
          <div className="card" key={u.uid}>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div className="muted small">
                  {u.isCharacter ? 'Character' : 'Non-character'}
                  {u.enhancementName
                    ? ` · ${u.enhancementName} (+${u.enhancementCost})`
                    : ''}
                </div>
              </div>
              {u.enhancementName && (
                <button className="small danger" onClick={() => onClear(u.uid)}>
                  Clear
                </button>
              )}
            </div>

            <div className="mt">
              <select
                value={u.enhancementName ?? ''}
                onChange={(e) => {
                  const enh = available.find((x) => x.name === e.target.value);
                  if (enh) onAssign(u.uid, enh);
                  else onClear(u.uid);
                }}
              >
                <option value="">— No enhancement —</option>
                {available
                  .filter((e) => canBear || e.is_upgrade)
                  .map((e) => (
                    <option key={e.name} value={e.name}>
                      {e.is_upgrade ? '(Upgrade) ' : ''}
                      {e.name} (+{intOf(e.cost)})
                    </option>
                  ))}
              </select>
            </div>

            {u.enhancementName &&
              (() => {
                const enh = available.find((e) => e.name === u.enhancementName);
                return enh ? (
                  <div className="desc">{stripHtml(enh.description)}</div>
                ) : null;
              })()}
          </div>
        );
      })}
    </div>
  );
}
