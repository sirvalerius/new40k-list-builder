import type { ArmyList, FactionData, Rules } from '../lib/types';
import { DatasheetCard } from '../components/DatasheetCard';
import { Collapsible } from '../components/Collapsible';
import { DISPOSITIONS, DispositionIcon } from '../components/DispositionIcon';
import { MissionCard } from '../components/MissionCard';
import {
  datasheetMap,
  displayName,
  effectiveKeywords,
  factionKeywordVocab,
  mergedUnitGroups,
  missionMatchup,
  stratagemAppliesTo,
  stripHtml,
} from '../lib/helpers';

// In-game ("bunker") reference: your disposition + the mission pairing against the
// opponent's, the detachment rules in play, then one ready-to-use card per fielded unit
// (a Leader/Support and its bodyguard merged into the same card), with the stratagems
// that apply to that unit.
export function BunkerMode({
  list,
  fd,
  rules,
  onSetVsDisposition,
}: {
  list: ArmyList;
  fd: FactionData;
  rules: Rules;
  onSetVsDisposition: (disposition: string) => void;
}) {
  const dsById = datasheetMap(fd);
  const vocab = factionKeywordVocab(fd);
  const chosenDet = fd.detachments.filter((d) => list.detachmentIds.includes(d.id));
  // core stratagems (rulebook, every army) + the chosen detachments' stratagems
  const strats = [
    ...(rules.core_stratagems ?? []).map((s) => ({ ...s, detach: 'Core Stratagem' })),
    ...chosenDet.flatMap((d) => d.stratagems.map((s) => ({ ...s, detach: d.name }))),
  ];
  // special rules unlocked by the chosen detachments only (not core rules)
  const detachmentRules = chosenDet.flatMap((d) =>
    d.rules.map((r) => ({ ...r, detach: d.name })),
  );

  const byMissionName = (n: string) => (rules.missions ?? []).find((m) => m.name === n);
  const matchup =
    list.disposition && list.vsDisposition
      ? missionMatchup(rules, list.disposition, list.vsDisposition)
      : null;

  const groups = mergedUnitGroups(list);

  return (
    <div>
      <div className="card">
        <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
          <span className="muted small">Your disposition:</span>
          {list.disposition ? (
            <DispositionIcon name={list.disposition} />
          ) : (
            <span className="muted small">set it in the Roster tab</span>
          )}
        </div>
        <div className="row wrap mt" style={{ gap: 6, alignItems: 'center' }}>
          <span className="muted small">Opponent:</span>
          {Object.keys(DISPOSITIONS).map((n) => (
            <button
              key={n}
              className={list.vsDisposition === n ? 'primary small' : 'ghost small'}
              onClick={() => onSetVsDisposition(list.vsDisposition === n ? '' : n)}
              title={n}
            >
              <DispositionIcon name={n} iconOnly />
            </button>
          ))}
        </div>

        {list.disposition && list.vsDisposition && (
          matchup ? (
            <div className="row wrap mt" style={{ gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <Collapsible title={<>You play: <b>{matchup.my}</b></>} defaultOpen>
                  {byMissionName(matchup.my) ? (
                    <MissionCard m={byMissionName(matchup.my)!} />
                  ) : (
                    <span className="muted small">{matchup.my}</span>
                  )}
                </Collapsible>
              </div>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <Collapsible title={<>Opponent plays: <b>{matchup.their}</b></>} defaultOpen>
                  {byMissionName(matchup.their) ? (
                    <MissionCard m={byMissionName(matchup.their)!} />
                  ) : (
                    <span className="muted small">{matchup.their}</span>
                  )}
                </Collapsible>
              </div>
            </div>
          ) : (
            <div className="muted small mt">No mission pairing found for this matchup.</div>
          )
        )}
      </div>

      {detachmentRules.length > 0 && (
        <div className="card">
          <Collapsible title={`Detachment rules (${detachmentRules.length})`} defaultOpen>
            <div className="col" style={{ gap: 8 }}>
              {detachmentRules.map((r, i) => (
                <div key={i} className="small">
                  {r.name && <b>{r.name}</b>}
                  <span className="muted tiny"> — {r.detach}</span>
                  <div className="desc">{stripHtml(r.description)}</div>
                </div>
              ))}
            </div>
          </Collapsible>
        </div>
      )}

      {!list.units.length ? (
        <div className="empty">Add units to use the in-game reference.</div>
      ) : (
        groups.map(({ anchor, members, title }) => {
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

          return (
            <div className="card bunker" key={anchor.uid}>
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
        })
      )}
    </div>
  );
}
