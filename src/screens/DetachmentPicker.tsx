import type { ArmyList, Detachment } from '../lib/types';
import { Collapsible } from '../components/Collapsible';
import { stripHtml } from '../lib/helpers';

export function DetachmentPicker({
  list,
  detachments,
  dpBudget,
  onToggle,
}: {
  list: ArmyList;
  detachments: Detachment[];
  dpBudget: number;
  onToggle: (id: string) => void;
}) {
  const chosen = detachments.filter((d) => list.detachmentIds.includes(d.id));
  const dpUsed = chosen.reduce((s, d) => s + (d.dp_cost || 0), 0);

  return (
    <div>
      <div className="banner ok" style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', color: 'var(--text)' }}>
        Detachment Points: <b>{dpUsed}</b> / {dpBudget} used. Pick any
        combination whose cost fits the budget.
      </div>

      {detachments.length === 0 && (
        <div className="empty">This faction has no detachments in the data.</div>
      )}

      {detachments
        .filter((d) => !d.boarding_actions)
        .map((d) => {
        const selected = list.detachmentIds.includes(d.id);
        const wouldExceed = !selected && dpUsed + (d.dp_cost || 0) > dpBudget;
        return (
          <div className="card" key={d.id}>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{d.name}</div>
                <div className="muted small">
                  {d.dp_cost} DP
                  {d.force_disposition ? ` · ${d.force_disposition}` : ''}
                  {d.exclusive_tag ? ` · ${d.exclusive_tag}` : ''}
                </div>
              </div>
              <button
                className={selected ? 'primary small' : 'small'}
                onClick={() => onToggle(d.id)}
                disabled={wouldExceed}
              >
                {selected ? 'Remove' : wouldExceed ? 'Over budget' : 'Add'}
              </button>
            </div>

            {d.restriction && (
              <div className="desc">⚠ {stripHtml(d.restriction)}</div>
            )}

            {d.rules.length > 0 && (
              <div className="mt">
                <Collapsible title={`Detachment rules (${d.rules.length})`}>
                  {d.rules.map((r, i) => (
                    <div key={i} className="small mb">
                      {r.name && <b>{r.name}: </b>}
                      <span className="desc" style={{ display: 'inline' }}>
                        {stripHtml(r.description)}
                      </span>
                    </div>
                  ))}
                </Collapsible>
              </div>
            )}
            {d.stratagems.length > 0 && (
              <div className="mt">
                <Collapsible title={`Stratagems (${d.stratagems.length})`}>
                  {d.stratagems.map((s, i) => (
                    <div key={i} className="small mb">
                      <b>{s.name}</b>{' '}
                      <span className="muted">({s.cp_cost} CP)</span>
                      <div className="desc">{stripHtml(s.description)}</div>
                    </div>
                  ))}
                </Collapsible>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
