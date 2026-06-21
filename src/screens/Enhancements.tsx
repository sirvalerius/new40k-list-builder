import type { ArmyList, Detachment, Enhancement, FactionData } from '../lib/types';
import {
  datasheetMap,
  enhancementAllowed,
  factionKeywordVocab,
  intOf,
  stripHtml,
} from '../lib/helpers';

export function Enhancements({
  list,
  fd,
  detachments,
  enhancementLimit,
  enhancementsUsed,
  onAssign,
  onClear,
}: {
  list: ArmyList;
  fd: FactionData;
  detachments: Detachment[];
  enhancementLimit: number;
  enhancementsUsed: number;
  onAssign: (uid: string, enh: Enhancement) => void;
  onClear: (uid: string) => void;
}) {
  const chosen = detachments.filter((d) => list.detachmentIds.includes(d.id));
  // keep each enhancement's source detachment so we can show where it comes from
  const available = chosen.flatMap((d) =>
    d.enhancements.map((e) => ({ enh: e, detach: d.name })),
  );
  const dsById = datasheetMap(fd);
  const vocab = factionKeywordVocab(fd);
  const keywordsOf = (datasheetId: string) => {
    const ds = dsById.get(datasheetId);
    return ds ? [...(ds.keywords ?? []), ...(ds.faction_keywords ?? [])] : [];
  };
  const sourceOf = (name?: string) =>
    available.find((a) => a.enh.name === name)?.detach ?? '';

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

  const eligible = list.units.filter((u) => u.isCharacter && !u.isEpicHero);

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
        const unitKw = keywordsOf(u.datasheetId);
        // Epic Heroes can never take Enhancements. Characters take standard enhancements;
        // non-Character units only "(Upgrade)" ones. Each enhancement also honours its own
        // "<KEYWORD> model only" restriction (e.g. GRAVIS / CAPTAIN model only).
        const offer = u.isEpicHero
          ? []
          : available.filter(
              ({ enh }) =>
                (u.isCharacter ? !enh.is_upgrade : enh.is_upgrade) &&
                enhancementAllowed(enh.description, unitKw, vocab),
            );
        // keep a currently-assigned but now-ineligible enhancement visible (flagged)
        const assigned = available.find((a) => a.enh.name === u.enhancementName);
        const assignedIneligible =
          assigned && !offer.some((o) => o.enh.name === assigned.enh.name);
        const optionPairs = assignedIneligible ? [assigned, ...offer] : offer;

        return (
          <div className="card" key={u.uid}>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div className="muted small">
                  {u.isEpicHero
                    ? 'Epic Hero — no enhancements'
                    : u.isCharacter
                      ? 'Character'
                      : 'Non-character'}
                  {u.enhancementName
                    ? ` · ${u.enhancementName} (+${u.enhancementCost})${
                        sourceOf(u.enhancementName) ? ` · ${sourceOf(u.enhancementName)}` : ''
                      }`
                    : ''}
                </div>
              </div>
              {u.enhancementName && (
                <button className="small danger" onClick={() => onClear(u.uid)}>
                  Clear
                </button>
              )}
            </div>

            {!u.isEpicHero && (
              <div className="mt">
                <select
                  value={u.enhancementName ?? ''}
                  onChange={(e) => {
                    const enh = available.find((x) => x.enh.name === e.target.value)?.enh;
                    if (enh) onAssign(u.uid, enh);
                    else onClear(u.uid);
                  }}
                >
                  <option value="">— No enhancement —</option>
                  {optionPairs.map(({ enh, detach }) => (
                    <option key={enh.name} value={enh.name} title={stripHtml(enh.description)}>
                      {enh.is_upgrade ? '(Upgrade) ' : ''}
                      {enh.name} (+{intOf(enh.cost)}) · {detach}
                    </option>
                  ))}
                </select>
                {offer.length === 0 && !u.isEpicHero && (
                  <div className="muted tiny mt">
                    No enhancement fits this unit's keywords from the chosen detachments.
                  </div>
                )}
              </div>
            )}

            {assignedIneligible && (
              <div className="banner bad mt">
                <div className="viol error">
                  <span className="dot" />
                  <span>
                    {u.name} doesn't meet the keyword requirement for “{u.enhancementName}”.
                  </span>
                </div>
              </div>
            )}

            {u.enhancementName && assigned && (
              <div className="desc">{stripHtml(assigned.enh.description)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
