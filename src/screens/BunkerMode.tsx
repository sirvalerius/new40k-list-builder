import type { ArmyList, FactionData, Rules } from '../lib/types';
import { DatasheetCard } from '../components/DatasheetCard';
import { Collapsible } from '../components/Collapsible';
import {
  datasheetMap,
  displayName,
  effectiveKeywords,
  factionKeywordVocab,
  stratagemAppliesTo,
  stripHtml,
} from '../lib/helpers';

// In-game ("bunker") reference: one ready-to-use card per fielded unit, with a Leader/Support
// and its bodyguard merged into the same card, plus the stratagems that apply to that unit.
export function BunkerMode({
  list,
  fd,
  rules,
}: {
  list: ArmyList;
  fd: FactionData;
  rules: Rules;
}) {
  const dsById = datasheetMap(fd);
  const vocab = factionKeywordVocab(fd);
  const chosenDet = fd.detachments.filter((d) => list.detachmentIds.includes(d.id));
  // core stratagems (rulebook, every army) + the chosen detachments' stratagems
  const strats = [
    ...(rules.core_stratagems ?? []).map((s) => ({ ...s, detach: 'Core Stratagem' })),
    ...chosenDet.flatMap((d) => d.stratagems.map((s) => ({ ...s, detach: d.name }))),
  ];

  if (!list.units.length)
    return <div className="empty">Add units to use the in-game reference.</div>;

  // A "primary" unit is one not attached to another; its joined leaders share the card.
  const primaries = list.units.filter((u) => !u.attachedToUid);

  return (
    <div>
      <div className="mb muted small">
        In-game reference — one ready card per fielded unit. Leaders and Support share their
        bodyguard's card, with the stratagems that apply.
      </div>

      {primaries.map((u) => {
        const joined = list.units.filter((x) => x.attachedToUid === u.uid);
        const members = [...joined, u]; // leaders/supports first, bodyguard last
        const baseKws = new Set<string>();
        for (const m of members) {
          const ds = dsById.get(m.datasheetId);
          ds?.keywords.forEach((k) => baseKws.add(k));
          ds?.faction_keywords.forEach((k) => baseKws.add(k));
        }
        // include keywords the chosen detachments grant this unit (e.g. SPEEDER)
        const kws = effectiveKeywords([...baseKws], chosenDet);
        const applicable = strats.filter((s) =>
          stratagemAppliesTo(s.description, kws, vocab),
        );
        const title = members.map((m) => displayName(m)).join(' + ');

        return (
          <div className="card bunker" key={u.uid}>
            <div className="bunker-title">{title}</div>

            {members.map((m) => {
              const ds = dsById.get(m.datasheetId);
              if (!ds) return null;
              const tags = [
                m.warlord ? 'Warlord' : '',
                m.enhancementName ? `+${m.enhancementName}` : '',
              ].filter(Boolean);
              return (
                <div key={m.uid} className="bunker-member">
                  <div className="bunker-member-name">
                    {displayName(m)}
                    {tags.length ? <span className="muted small"> · {tags.join(' · ')}</span> : null}
                  </div>
                  <DatasheetCard ds={ds} selected={m.wargearCosts ?? []} subFaction={list.subFaction ?? ''} />
                </div>
              );
            })}

            <div className="bunker-strats">
              <Collapsible title={`Applicable stratagems (${applicable.length})`}>
                <div className="col" style={{ gap: 10 }}>
                  {applicable.map((s, i) => (
                    <div key={i} className="strat small">
                      <div className="row" style={{ gap: 6, alignItems: 'baseline' }}>
                        <b style={{ flex: 1 }}>{s.name}</b>
                        <span className="badge">{s.cp_cost} CP</span>
                      </div>
                      <div className="muted tiny">{s.detach}</div>
                      <div className="desc">{stripHtml(s.description)}</div>
                    </div>
                  ))}
                  {!applicable.length && (
                    <div className="muted small">
                      No applicable stratagems from the chosen detachments.
                    </div>
                  )}
                </div>
              </Collapsible>
            </div>
          </div>
        );
      })}
    </div>
  );
}
