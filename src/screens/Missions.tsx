import { Fragment, useState } from 'react';
import type { Mission, Rules } from '../lib/types';
import { Collapsible } from '../components/Collapsible';
import { DISPOSITIONS, DispositionIcon } from '../components/DispositionIcon';

// **bold** spans in card text → <b>
function md(text: string) {
  return text.split(/\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));
}

function MissionCard({ m }: { m: Mission }) {
  return (
    <div className="col" style={{ gap: 8 }}>
      {m.sections.map((s, i) => (
        <div key={i} className="small">
          <div style={{ fontWeight: 700 }}>{s.when}</div>
          <div className="muted tiny mb">{s.trigger}</div>
          {s.tiers.map((t, j) => (
            <div key={j} className="row" style={{ gap: 8, alignItems: 'baseline' }}>
              <b style={{ whiteSpace: 'nowrap' }}>
                {t.cumulative ? '+' : ''}{t.vp} VP{t.perUnit ? ' each' : ''}
              </b>
              <span>{md(t.text)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Mission viewer: pick YOUR Force Disposition and see, for every opponent disposition,
// the mission you play next to the mission the opponent plays in that matchup.
// ponytail: mission names + matchups only — the full mission rules live on the physical
// card deck, not in any PDF we have; add texts here if a source appears.
export function Missions({ rules, initial }: { rules: Rules; initial?: string }) {
  const [mine, setMine] = useState(initial ?? 'TAKE AND HOLD');
  const matchups = rules.disposition_matchups ?? [];
  const names = Object.keys(DISPOSITIONS);
  const byName = (n: string) => (rules.missions ?? []).find((m) => m.name === n);

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
