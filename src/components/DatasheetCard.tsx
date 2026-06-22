import { Fragment } from 'react';
import type { ChosenWargear, Datasheet } from '../lib/types';
import { StatLine } from './StatLine';
import { Collapsible } from './Collapsible';
import { equippedWeapons, stripHtml } from '../lib/helpers';

// When `selected` is given (a unit in the list), only the chosen weapon options are shown;
// otherwise (browsing) every option is listed.
export function DatasheetCard({ ds, selected }: { ds: Datasheet; selected?: ChosenWargear[] }) {
  const tags: string[] = [];
  if (ds.is_character) tags.push('Character');
  if (ds.is_battleline) tags.push('Battleline');
  if (ds.is_epic_hero) tags.push('Epic Hero');
  if (ds.is_dedicated_transport) tags.push('Transport');

  const weapons = equippedWeapons(ds, selected);
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
          <div className="wpn-scroll">
            <table className="wpn-table">
              <thead>
                <tr>
                  <th className="wname">Weapon</th>
                  <th>Range</th>
                  <th>A</th>
                  <th>BS/WS</th>
                  <th>S</th>
                  <th>AP</th>
                  <th>D</th>
                </tr>
              </thead>
              <tbody>
                {weapons.map((w, i) => {
                  const num = /^\d+$/.test(String(w.BS_WS).trim());
                  const sk = num ? `${w.BS_WS}+` : w.BS_WS;
                  const range = w.range && w.range !== 'Melee' ? `${w.range}"` : 'Melee';
                  const desc = w.description ? stripHtml(w.description) : '';
                  return (
                    <Fragment key={i}>
                      <tr>
                        <td className="wname">{w.name}</td>
                        <td>{range}</td>
                        <td>{w.A}</td>
                        <td>{sk}</td>
                        <td>{w.S}</td>
                        <td>{w.AP}</td>
                        <td>{w.D}</td>
                      </tr>
                      {desc && (
                        <tr className="wpn-desc">
                          <td colSpan={7}>{desc}</td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
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

      {/* Leader: bodyguard units this Character can attach to. (Support is a separate slot in
          11e but the source data doesn't distinguish it yet, so that section stays hidden.) */}
      {(ds.can_lead_names?.length ?? 0) > 0 && (
        <Collapsible title={`Leader — can join (${ds.can_lead_names!.length})`}>
          <ul className="col" style={{ gap: 2, margin: 0, paddingLeft: 18 }}>
            {ds.can_lead_names!.map((n) => (
              <li key={n} className="small">
                {n}
              </li>
            ))}
          </ul>
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
