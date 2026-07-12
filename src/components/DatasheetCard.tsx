import { Fragment, useState } from 'react';
import type { Ability, ChosenWargear, Datasheet, Enhancement, Weapon } from '../lib/types';
import { StatLine } from './StatLine';
import { Collapsible } from './Collapsible';
import { equippedWeapons, stripHtml, unitAbilities } from '../lib/helpers';

export function WeaponTable({ weapons }: { weapons: Weapon[] }) {
  return (
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
  );
}

// When `selected` is given (a unit in the list), only the chosen weapon options are shown;
// otherwise (browsing) every option is listed.
export function DatasheetCard({
  ds,
  selected,
  subFaction,
  modelCount,
  enhancement,
  enhancementCoreRules,
}: {
  ds: Datasheet;
  selected?: ChosenWargear[];
  subFaction?: string;
  modelCount?: number;
  enhancement?: Enhancement;
  // Core rules (Deep Strike, Stealth, ...) the enhancement's own text grants/references —
  // resolved by the caller (helpers.enhancementCoreRules) against the wider faction data, since
  // this component only sees one datasheet and the enhancement's text just names them rather
  // than repeating the glossary entry.
  enhancementCoreRules?: Ability[];
}) {
  // "can join" units, chapter-filtered: a Chapter-specific bodyguard only shows when that Chapter
  // is the selected sub-faction. A generic Space Marines army (no Chapter chosen) can't field
  // Blood Angels / Dark Angels / … units, so they're hidden until that Chapter is picked.
  const canJoin = (ds.can_lead_entries ?? [])
    .filter((e) => !e.chapter || e.chapter === subFaction)
    .map((e) => e.name);
  const tags: string[] = [];
  if (ds.is_character) tags.push('Character');
  if (ds.is_battleline) tags.push('Battleline');
  if (ds.is_epic_hero) tags.push('Epic Hero');
  if (ds.is_dedicated_transport) tags.push('Transport');

  const weapons = equippedWeapons(ds, selected, modelCount);
  const ranged = weapons.filter((w) => w.type === 'Ranged');
  const melee = weapons.filter((w) => w.type !== 'Ranged');
  const defaultWpnTab = ranged.length ? 'ranged' : 'melee';
  const [wpnTabPick, setWpnTabPick] = useState<'ranged' | 'melee'>(defaultWpnTab);
  // fall back if the loadout no longer has any weapon of the picked type
  const wpnTab =
    (wpnTabPick === 'ranged' && ranged.length) || (wpnTabPick === 'melee' && melee.length)
      ? wpnTabPick
      : defaultWpnTab;
  // The unit's own abilities, plus (if it has one) its enhancement — shown in full like a
  // unit-specific rule — and any Core rules that enhancement grants but the datasheet doesn't
  // already list (so a rule like Stealth isn't shown twice when the unit has it innately too).
  const abilities: Ability[] = [
    ...(enhancement
      ? [{ name: enhancement.name, type: 'Enhancement', parameter: `(+${enhancement.cost} pts)`, description: enhancement.description }]
      : []),
    ...unitAbilities(ds, selected),
    ...(enhancementCoreRules ?? []),
  ];
  const selQty = selected
    ? new Map(selected.filter((s) => s.qty > 0).map((s) => [s.name, s.qty]))
    : null;
  const options = (ds.weapon_options || []).filter((o) =>
    selQty ? selQty.has(o.text) : true,
  );

  return (
    <div className="col" style={{ gap: 8, position: 'relative' }}>
      {ds.icon && (
        <img
          src={`${import.meta.env.BASE_URL}data/${ds.icon}`}
          alt=""
          width={56}
          height={56}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            borderRadius: '50%',
            border: '2px solid var(--border)',
            background: 'var(--bg-elev)',
          }}
        />
      )}
      <div className="row wrap" style={{ gap: 6, paddingRight: ds.icon ? 64 : 0 }}>
        {ds.role && <span className="badge role">{ds.role}</span>}
        {tags.map((t) => (
          <span className="badge" key={t}>
            {t}
          </span>
        ))}
      </div>

      {ds.stats[0] && <StatLine stat={ds.stats[0]} />}

      {ds.transport && ds.transport.trim() && (
        <div className="banner ok" style={{ background: 'var(--bg-elev)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <b>🚛 Transport: </b>
          <span className="small">{stripHtml(ds.transport)}</span>
        </div>
      )}

      {weapons.length > 0 && (
        <Collapsible title={`Weapons (${weapons.length})`}>
          {ranged.length > 0 && melee.length > 0 && (
            <div className="subtabs mb">
              <button
                className={wpnTab === 'ranged' ? 'active' : ''}
                onClick={() => setWpnTabPick('ranged')}
              >
                Ranged ({ranged.length})
              </button>
              <button
                className={wpnTab === 'melee' ? 'active' : ''}
                onClick={() => setWpnTabPick('melee')}
              >
                Melee ({melee.length})
              </button>
            </div>
          )}
          <WeaponTable weapons={wpnTab === 'ranged' ? ranged : melee} />
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
            {abilities.map((a, i) =>
              // Core rules (Stealth, Infiltrators, Scouts, ...) are the long glossary text every
              // player already knows by name — collapsed to just the name by default, arrow to
              // expand. Unit-specific rules stay expanded since there's usually only one or two.
              a.type === 'Core' ? (
                <Collapsible key={i} title={<b>{a.name}{a.parameter ? ` ${a.parameter}` : ''}</b>}>
                  <span className="desc small" style={{ display: 'inline' }}>
                    {stripHtml(a.description)}
                  </span>
                </Collapsible>
              ) : (
                <div key={i} className="small">
                  {a.name && <b>{a.name}{a.parameter ? ` ${a.parameter}` : ''}: </b>}
                  <span className="desc" style={{ display: 'inline' }}>
                    {stripHtml(a.description)}
                  </span>
                </div>
              ),
            )}
          </div>
        </Collapsible>
      )}

      {/* Bodyguard units this Character can attach to, labelled by its 11e attach type
          (Leader vs Support, from the faction-pack errata) and chapter-filtered. */}
      {canJoin.length > 0 && (
        <Collapsible
          title={`${ds.attach_type === 'support' ? 'Support' : 'Leader'} — can join (${canJoin.length})`}
        >
          <ul className="col" style={{ gap: 2, margin: 0, paddingLeft: 18 }}>
            {canJoin.map((n) => (
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
