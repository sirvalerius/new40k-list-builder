import type { ChosenWargear, Datasheet } from '../lib/types';
import { StatLine } from './StatLine';
import { Collapsible } from './Collapsible';
import { stripHtml } from '../lib/helpers';

// When `selected` is given (a unit in the list), only the chosen weapon options are shown;
// otherwise (browsing) every option is listed.
export function DatasheetCard({ ds, selected }: { ds: Datasheet; selected?: ChosenWargear[] }) {
  const tags: string[] = [];
  if (ds.is_character) tags.push('Character');
  if (ds.is_battleline) tags.push('Battleline');
  if (ds.is_epic_hero) tags.push('Epic Hero');
  if (ds.is_dedicated_transport) tags.push('Transport');

  const weapons = ds.weapons.filter((w) => w.name);
  const abilities = ds.abilities.filter((a) => a.name || a.description);
  const selQty = selected
    ? new Map(selected.filter((s) => s.qty > 0).map((s) => [s.name, s.qty]))
    : null;
  const options = (ds.weapon_options || []).filter((o) =>
    selQty ? selQty.has(o.text) : true,
  );

  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row wrap" style={{ gap: 6 }}>
        {ds.role && <span className="badge role">{ds.role}</span>}
        {tags.map((t) => (
          <span className="badge" key={t}>
            {t}
          </span>
        ))}
      </div>

      {ds.stats[0] && <StatLine stat={ds.stats[0]} />}

      {weapons.length > 0 && (
        <Collapsible title={`Weapons (${weapons.length})`}>
          <div className="col" style={{ gap: 6 }}>
            {weapons.map((w, i) => {
              const skill = w.type === 'Ranged' ? 'BS' : 'WS';
              // BS_WS holds a target number (e.g. "3" -> "3+"); "N/A" for torrent/auto-hit.
              const sk = /^\d+$/.test(String(w.BS_WS).trim())
                ? `${skill} ${w.BS_WS}+`
                : `${skill} ${w.BS_WS}`;
              return (
                <div key={i} className="small">
                  <b>{w.name}</b>{' '}
                  <span className="muted">
                    [{w.type}
                    {w.range && w.range !== 'Melee' ? ` ${w.range}"` : ''}] A{w.A} · {sk} ·
                    S{w.S} · AP{w.AP} · D{w.D}
                  </span>
                  {w.description && (
                    <span className="muted"> — {stripHtml(w.description)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </Collapsible>
      )}

      {options.length > 0 && (
        <Collapsible title={`${selQty ? 'Loadout' : 'Weapon options'} (${options.length})`}>
          <ul className="col" style={{ gap: 4, margin: 0, paddingLeft: 18 }}>
            {options.map((o, i) => (
              <li key={i} className="small">
                {selQty ? <b>{selQty.get(o.text)}× </b> : null}
                <span className="muted">{stripHtml(o.text)}</span>{' '}
                {o.cost > 0 ? (
                  <span className="badge">+{o.cost} pt{o.type === 'model' ? '' : ' each'}</span>
                ) : (
                  <span className="muted tiny">free</span>
                )}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {abilities.length > 0 && (
        <Collapsible title={`Abilities (${abilities.length})`}>
          <div className="col" style={{ gap: 8 }}>
            {abilities.map((a, i) => (
              <div key={i} className="small">
                {a.name && <b>{a.name}: </b>}
                <span className="desc" style={{ display: 'inline' }}>
                  {stripHtml(a.description)}
                </span>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {ds.keywords.length > 0 && (
        <div>
          {ds.keywords.map((k) => (
            <span className="kw" key={k}>
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
