import type { Datasheet } from '../lib/types';
import { StatLine } from './StatLine';
import { Collapsible } from './Collapsible';
import { stripHtml } from '../lib/helpers';

export function DatasheetCard({ ds }: { ds: Datasheet }) {
  const tags: string[] = [];
  if (ds.is_character) tags.push('Character');
  if (ds.is_battleline) tags.push('Battleline');
  if (ds.is_epic_hero) tags.push('Epic Hero');
  if (ds.is_dedicated_transport) tags.push('Transport');

  const weapons = ds.weapons.filter((w) => w.name);
  const abilities = ds.abilities.filter((a) => a.name || a.description);
  const options = (ds.options || []).filter(Boolean);

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
            {weapons.map((w, i) => (
              <div key={i} className="small">
                <b>{w.name}</b>{' '}
                <span className="muted">
                  [{w.type}
                  {w.range && w.range !== 'Melee' ? ` ${w.range}"` : ''}] A{w.A} ·
                  {w.BS_WS}
                  {w.type === 'Ranged' ? ' BS' : ' WS'} · S{w.S} · AP{w.AP} · D{w.D}
                </span>
                {w.description && (
                  <span className="muted"> — {stripHtml(w.description)}</span>
                )}
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {options.length > 0 && (
        <Collapsible title={`Wargear options (${options.length})`}>
          <ul className="col" style={{ gap: 4, margin: 0, paddingLeft: 18 }}>
            {options.map((o, i) => (
              <li key={i} className="small muted">
                {stripHtml(o)}
              </li>
            ))}
          </ul>
          <div className="muted tiny mt">
            Wargear is free in points (cost depends only on model count).
          </div>
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
