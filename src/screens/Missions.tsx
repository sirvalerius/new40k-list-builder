import { useState } from 'react';
import type { Rules } from '../lib/types';
import { DISPOSITIONS, DispositionIcon } from '../components/DispositionIcon';

// Mission viewer: pick YOUR Force Disposition and see, for every opponent disposition,
// the mission you play next to the mission the opponent plays in that matchup.
// ponytail: mission names + matchups only — the full mission rules live on the physical
// card deck, not in any PDF we have; add texts here if a source appears.
export function Missions({ rules, initial }: { rules: Rules; initial?: string }) {
  const [mine, setMine] = useState(initial ?? 'TAKE AND HOLD');
  const matchups = rules.disposition_matchups ?? [];
  const names = Object.keys(DISPOSITIONS);

  // matchup rows are stored one-way; flip when my disposition is on the "b" side
  const rowFor = (opp: string) => {
    const m = matchups.find(
      (x) => (x.a === mine && x.b === opp) || (x.a === opp && x.b === mine),
    );
    if (!m) return null;
    return m.a === mine
      ? { my: m.mission_a, their: m.mission_b }
      : { my: m.mission_b, their: m.mission_a };
  };

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
              <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
                <div style={{ flex: 1 }}>
                  <div className="muted tiny">You play</div>
                  <b>{r.my}</b>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="muted tiny">Opponent plays</div>
                  <b>{r.their}</b>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="muted tiny mt">
        Each matchup is played on battlefield layout A, B or C (Event Companion). Full
        mission rules are on the mission cards.
      </div>
    </div>
  );
}
