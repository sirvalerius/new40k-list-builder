import { useMemo, useState } from 'react';
import type {
  ArmyList,
  BattleSize,
  Datasheet,
  FactionData,
  PointsOption,
} from '../lib/types';
import { DatasheetCard } from '../components/DatasheetCard';
import { Modal } from '../components/Modal';
import { copiesOf, intOf } from '../lib/helpers';

const ROLE_ORDER = [
  'Epic Hero',
  'Character',
  'Battleline',
  'Infantry',
  'Other',
];

export function Roster({
  list,
  fd,
  battleSize,
  onAdd,
  onRemove,
  onSetWarlord,
}: {
  list: ArmyList;
  fd: FactionData;
  battleSize: BattleSize;
  onAdd: (ds: Datasheet, tier: PointsOption) => void;
  onRemove: (uid: string) => void;
  onSetWarlord: (uid: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const [adding, setAdding] = useState<Datasheet | null>(null);

  const dsById = useMemo(
    () => new Map(fd.datasheets.map((d) => [d.id, d])),
    [fd],
  );

  const sorted = useMemo(() => {
    const score = (d: Datasheet) => {
      if (d.is_epic_hero) return 0;
      if (d.is_character) return 1;
      if (d.is_battleline) return 2;
      return 3;
    };
    return [...fd.datasheets].sort(
      (a, b) => score(a) - score(b) || a.name.localeCompare(b.name),
    );
  }, [fd]);

  const filtered = sorted.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase().trim()),
  );

  const unitLimit = intOf(battleSize.unit_limit);
  const blLimit = intOf(battleSize.battleline_limit);

  return (
    <div>
      <button
        className="primary"
        style={{ width: '100%' }}
        onClick={() => setBrowsing(true)}
      >
        + Add unit
      </button>

      <div className="mt mb muted small">
        {list.units.length} unit{list.units.length === 1 ? '' : 's'} in roster
      </div>

      {list.units.length === 0 && (
        <div className="empty">No units yet. Tap “Add unit”.</div>
      )}

      {list.units.map((u) => {
        const ds = dsById.get(u.datasheetId);
        return (
          <div className="card" key={u.uid}>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div className="muted small">
                  {u.pointsLabel} — {intOf(u.pointsCost)} pts
                  {u.enhancementName
                    ? ` · +${u.enhancementName} (${u.enhancementCost})`
                    : ''}
                </div>
                <div className="row wrap mt" style={{ gap: 4 }}>
                  {u.warlord && <span className="badge warlord">Warlord</span>}
                  {u.isCharacter && <span className="badge char">Character</span>}
                  {u.isBattleline && <span className="badge">Battleline</span>}
                  {u.isEpicHero && <span className="badge">Epic Hero</span>}
                  {u.isAlly && <span className="badge ally">Ally</span>}
                </div>
              </div>
            </div>
            <div className="row wrap mt" style={{ gap: 6 }}>
              {u.isCharacter && !u.warlord && (
                <button className="small" onClick={() => onSetWarlord(u.uid)}>
                  Make Warlord
                </button>
              )}
              <div className="spacer" />
              <button
                className="small danger"
                onClick={() => onRemove(u.uid)}
              >
                Remove
              </button>
            </div>
            {ds && (
              <details style={{ marginTop: 8 }}>
                <summary className="muted small">Datasheet</summary>
                <div className="mt">
                  <DatasheetCard ds={ds} />
                </div>
              </details>
            )}
          </div>
        );
      })}

      {browsing && (
        <Modal title="Add a unit" onClose={() => setBrowsing(false)}>
          <input
            placeholder="Search datasheet…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb"
          />
          {ROLE_ORDER.map((bucket) => {
            const inBucket = filtered.filter((d) => {
              if (bucket === 'Epic Hero') return d.is_epic_hero;
              if (bucket === 'Character') return d.is_character && !d.is_epic_hero;
              if (bucket === 'Battleline')
                return d.is_battleline && !d.is_character;
              if (bucket === 'Infantry')
                return (
                  !d.is_character &&
                  !d.is_battleline &&
                  d.keywords.includes('Infantry')
                );
              return (
                !d.is_character &&
                !d.is_battleline &&
                !d.keywords.includes('Infantry')
              );
            });
            if (!inBucket.length) return null;
            return (
              <div key={bucket} className="mb">
                <h3 className="muted">{bucket}</h3>
                <div className="col" style={{ gap: 6 }}>
                  {inBucket.map((d) => {
                    const have = copiesOf(list, d.id);
                    const lim = d.is_battleline ? blLimit : unitLimit;
                    const atLimit = lim > 0 && have >= lim;
                    const heroBlocked = d.is_epic_hero && have >= 1;
                    return (
                      <button
                        key={d.id}
                        className="card tappable ghost list-tile"
                        style={{ textAlign: 'left', height: 'auto', padding: 10 }}
                        onClick={() => {
                          setAdding(d);
                          setBrowsing(false);
                        }}
                      >
                        <div className="meta">
                          <div className="name">{d.name}</div>
                          <div className="muted tiny">
                            {d.points[0]
                              ? `from ${intOf(d.points[0].cost)} pts`
                              : 'no points'}
                            {have > 0 ? ` · ${have} in list` : ''}
                            {atLimit || heroBlocked ? ' · at limit' : ''}
                          </div>
                        </div>
                        <span aria-hidden>＋</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="empty">No match.</div>}
        </Modal>
      )}

      {adding && (
        <AddUnitModal
          ds={adding}
          list={list}
          unitLimit={unitLimit}
          blLimit={blLimit}
          onClose={() => setAdding(null)}
          onConfirm={(tier) => {
            onAdd(adding, tier);
            setAdding(null);
          }}
        />
      )}
    </div>
  );
}

function AddUnitModal({
  ds,
  list,
  unitLimit,
  blLimit,
  onClose,
  onConfirm,
}: {
  ds: Datasheet;
  list: ArmyList;
  unitLimit: number;
  blLimit: number;
  onClose: () => void;
  onConfirm: (tier: PointsOption) => void;
}) {
  const tiers = ds.points.length
    ? ds.points
    : [{ description: 'Default', cost: '0' }];
  const [sel, setSel] = useState(0);

  const have = copiesOf(list, ds.id);
  const lim = ds.is_battleline ? blLimit : unitLimit;
  const atLimit = lim > 0 && have >= lim;
  const heroBlocked = ds.is_epic_hero && have >= 1;
  const blocked = atLimit || heroBlocked;

  return (
    <Modal
      title={ds.name}
      onClose={onClose}
      footer={
        <div className="row">
          <button className="ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="spacer" />
          <button
            className="primary"
            disabled={blocked}
            onClick={() => onConfirm(tiers[sel])}
          >
            {blocked ? 'At limit' : `Add — ${intOf(tiers[sel].cost)} pts`}
          </button>
        </div>
      }
    >
      {blocked && (
        <div className="banner bad mb">
          <div className="viol error">
            <span className="dot" />
            <span>
              {heroBlocked
                ? 'Epic Heroes are unique — already in your list.'
                : `Already at the Rule-of-Three limit (${lim}).`}
            </span>
          </div>
        </div>
      )}
      <h3 className="muted">Points option</h3>
      <div className="col" style={{ gap: 6 }}>
        {tiers.map((t, i) => (
          <button
            key={i}
            className={`pill-pts ${sel === i ? 'sel' : ''}`}
            onClick={() => setSel(i)}
          >
            <b>{intOf(t.cost)} pts</b> — {t.description}
          </button>
        ))}
      </div>
      <div className="mt">
        <DatasheetCard ds={ds} />
      </div>
    </Modal>
  );
}
