import { useMemo, useState } from 'react';
import type { ArmyList, Detachment } from '../lib/types';
import { Collapsible } from '../components/Collapsible';
import { getFavorites, stripHtml, toggleFavorite } from '../lib/helpers';

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
  const [query, setQuery] = useState('');
  const [favs, setFavs] = useState<string[]>(() => getFavorites('det'));
  const favSet = new Set(favs);

  const chosen = detachments.filter((d) => list.detachmentIds.includes(d.id));
  const dpUsed = chosen.reduce((s, d) => s + (d.dp_cost || 0), 0);

  // Order: selected first, then favourites, then the rest — each group sorted by name and
  // filtered by the search box. Boarding Actions detachments are excluded entirely.
  const ordered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const rank = (d: Detachment) =>
      list.detachmentIds.includes(d.id) ? 0 : favSet.has(d.id) ? 1 : 2;
    return detachments
      .filter((d) => !d.boarding_actions && d.name.toLowerCase().includes(q))
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }, [detachments, query, list.detachmentIds, favs]);

  return (
    <div>
      <div className="banner ok" style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', color: 'var(--text)' }}>
        Detachment Points: <b>{dpUsed}</b> / {dpBudget} used. Pick any
        combination whose cost fits the budget.
      </div>

      <input
        placeholder="Cerca detachment…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb"
      />

      {detachments.length === 0 && (
        <div className="empty">This faction has no detachments in the data.</div>
      )}

      {ordered.map((d) => {
        const selected = list.detachmentIds.includes(d.id);
        const fav = favSet.has(d.id);
        const wouldExceed = !selected && dpUsed + (d.dp_cost || 0) > dpBudget;
        return (
          <div className={`card${selected ? ' det-selected' : ''}`} key={d.id}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <button
                className="ghost iconbtn star"
                aria-label={fav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                title="Preferito"
                onClick={() => setFavs(toggleFavorite('det', d.id))}
              >
                {fav ? '★' : '☆'}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{d.name}</div>
                <div className="muted small">
                  {d.dp_cost} DP
                  {d.force_disposition ? ` · ${d.force_disposition}` : ''}
                  {d.exclusive_tag ? ` · ${d.exclusive_tag}` : ''}
                  {d.restricted_chapter ? ` · ${d.restricted_chapter}` : ''}
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

            {d.enhancements.length > 0 && (
              <div className="mt">
                <Collapsible title={`Enhancements sbloccati (${d.enhancements.length})`}>
                  {d.enhancements.map((e, i) => (
                    <div key={i} className="small mb">
                      <b>{e.name}</b>{' '}
                      {e.cost ? <span className="muted">({e.cost} pt)</span> : null}
                      {e.is_upgrade ? <span className="badge">Upgrade</span> : null}
                      {e.description ? (
                        <div className="desc">{stripHtml(e.description)}</div>
                      ) : null}
                    </div>
                  ))}
                </Collapsible>
              </div>
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
