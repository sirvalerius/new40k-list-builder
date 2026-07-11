import { Fragment } from 'react';
import type { Mission } from '../lib/types';

// **bold** spans in card text → <b>
function md(text: string) {
  return text.split(/\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));
}

/** Full primary-mission card: scoring sections + the reverse-side Objective Action, if any. */
export function MissionCard({ m }: { m: Mission }) {
  const a = m.action;
  return (
    <div className="col" style={{ gap: 8 }}>
      {m.note && (
        <div className="small muted" style={{ borderLeft: '3px solid var(--border)', paddingLeft: 8 }}>
          {md(m.note)}
        </div>
      )}
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
      {a && (
        <div className="small" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          <div style={{ fontWeight: 700 }}>Objective Action — {a.name}</div>
          <div><b className="muted tiny">STARTS </b>{a.starts}</div>
          <div><b className="muted tiny">UNITS </b>{md(a.units)}</div>
          <div><b className="muted tiny">USE LIMIT </b>{a.useLimit}</div>
          <div><b className="muted tiny">COMPLETES </b>{a.completes}</div>
          <div><b className="muted tiny">EFFECT </b>{md(a.effect)}</div>
          {a.restriction && <div><b className="muted tiny">RESTRICTION </b>{a.restriction}</div>}
        </div>
      )}
    </div>
  );
}
