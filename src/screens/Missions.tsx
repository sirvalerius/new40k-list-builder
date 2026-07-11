import { useState } from 'react';
import type { Rules } from '../lib/types';
import { Collapsible } from '../components/Collapsible';
import { DISPOSITIONS, DispositionIcon } from '../components/DispositionIcon';
import { MissionCard } from '../components/MissionCard';
import { missionMatchup } from '../lib/helpers';

// Mission viewer: pick YOUR Force Disposition and see, for every opponent disposition,
// the mission you play next to the mission the opponent plays in that matchup.
export function Missions({ rules, initial }: { rules: Rules; initial?: string }) {
  const [mine, setMine] = useState(initial ?? 'TAKE AND HOLD');
  const names = Object.keys(DISPOSITIONS);
  const byName = (n: string) => (rules.missions ?? []).find((m) => m.name === n);
  const rowFor = (opp: string) => missionMatchup(rules, mine, opp);

  return (
    <div>
      <h3 className="muted">Your Force Disposition</h3>
      <div className="row wrap mb" style={{ gap: 6 }}>
        {names.map((n) => (
          <button
            key={n}
            className={mine === n ? 'primary small' : 'ghost small'}
            onClick={() => setMine(n)}
          >
            <DispositionIcon name={n} />
          </button>
        ))}
      </div>

      <div className="muted small mb">{DISPOSITIONS[mine]?.tagline}</div>

      <div className="col" style={{ gap: 8 }}>
        {names.map((opp) => {
          const r = rowFor(opp);
          if (!r) return null;
          return (
            <div className="card" key={opp}>
              <div className="muted tiny">Opponent</div>
              <div className="mb" style={{ fontWeight: 600 }}>
                <DispositionIcon name={opp} />
              </div>
              <div className="col" style={{ gap: 6 }}>
                <Collapsible title={<>You play: <b>{r.my}</b></>} defaultOpen>
                  {byName(r.my) ? <MissionCard m={byName(r.my)!} /> : <span className="muted small">{r.my}</span>}
                </Collapsible>
                <Collapsible title={<>Opponent plays: <b>{r.their}</b></>}>
                  {byName(r.their) ? <MissionCard m={byName(r.their)!} /> : <span className="muted small">{r.their}</span>}
                </Collapsible>
              </div>
            </div>
          );
        })}
      </div>
      <div className="muted tiny mt">
        Each matchup is played on battlefield layout A, B or C (Event Companion). Card
        texts via gdmissions.app.
      </div>
    </div>
  );
}
