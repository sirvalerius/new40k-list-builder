import { useMemo, useState } from 'react';
import type {
  ArmyList,
  BattleSize,
  ChosenWargear,
  Datasheet,
  FactionData,
  PointsOption,
  WeaponOption,
} from '../lib/types';
import { DatasheetCard } from '../components/DatasheetCard';
import { Modal } from '../components/Modal';
import {
  bracketForCount,
  copiesOf,
  intOf,
  optionMax,
  stripHtml,
  tierForPick,
  unitTotal,
  unitVariants,
} from '../lib/helpers';

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
  subFaction,
  onAdd,
  onRemove,
  onDuplicate,
  onSetWarlord,
  onSetWargear,
  onSetModelCount,
}: {
  list: ArmyList;
  fd: FactionData;
  battleSize: BattleSize;
  subFaction: string;
  onAdd: (ds: Datasheet, tier: PointsOption, modelCount?: number) => void;
  onRemove: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onSetWarlord: (uid: string) => void;
  onSetWargear: (uid: string, wargear: ChosenWargear[]) => void;
  onSetModelCount: (uid: string, count: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const [adding, setAdding] = useState<Datasheet | null>(null);

  const dsById = useMemo(
    () => new Map(fd.datasheets.map((d) => [d.id, d])),
    [fd],
  );
  const chosenDetNames = useMemo(
    () =>
      new Set(
        fd.detachments
          .filter((d) => list.detachmentIds.includes(d.id))
          .map((d) => d.name),
      ),
    [fd, list.detachmentIds],
  );

  // Filter datasheets by the selected sub-faction (Chapter): hide other Chapters'
  // units, and apply Chapter exclusions (Black Templars cannot take PSYKERs).
  const visible = useMemo(
    () =>
      fd.datasheets.filter((d) => {
        if (!subFaction) return true;
        if (d.chapter && d.chapter !== subFaction) return false;
        if (
          subFaction === 'Black Templars' &&
          (d.keywords ?? []).some((k) => k.toUpperCase() === 'PSYKER')
        )
          return false;
        return true;
      }),
    [fd, subFaction],
  );

  const sorted = useMemo(() => {
    const score = (d: Datasheet) => {
      if (d.is_epic_hero) return 0;
      if (d.is_character) return 1;
      if (d.is_battleline) return 2;
      return 3;
    };
    return [...visible].sort(
      (a, b) => score(a) - score(b) || a.name.localeCompare(b.name),
    );
  }, [visible]);

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
                  {u.pointsLabel} — <b>{unitTotal(u)} pts</b>
                  {intOf(u.pointsCost) !== unitTotal(u) ? ` (base ${intOf(u.pointsCost)})` : ''}
                  {u.enhancementName
                    ? ` · +${u.enhancementName} (${u.enhancementCost})`
                    : ''}
                </div>
                {ds?.countable && (ds.model_min ?? 1) !== (ds.model_max ?? 1) && (
                  <div className="row mt" style={{ gap: 8, alignItems: 'center' }}>
                    <span className="muted tiny">Models:</span>
                    <button
                      className="ghost stepper sm"
                      disabled={(u.modelCount ?? ds.model_min!) <= (ds.model_min ?? 1)}
                      onClick={() => onSetModelCount(u.uid, (u.modelCount ?? ds.model_min!) - 1)}
                    >
                      −
                    </button>
                    <b style={{ minWidth: 22, textAlign: 'center' }}>{u.modelCount ?? ds.model_min}</b>
                    <button
                      className="ghost stepper sm"
                      disabled={(u.modelCount ?? ds.model_min!) >= (ds.model_max ?? 1)}
                      onClick={() => onSetModelCount(u.uid, (u.modelCount ?? ds.model_min!) + 1)}
                    >
                      ＋
                    </button>
                  </div>
                )}
                <div className="row wrap mt" style={{ gap: 4 }}>
                  {u.warlord && <span className="badge warlord">Warlord</span>}
                  {u.isCharacter && <span className="badge char">Character</span>}
                  {u.isBattleline && <span className="badge">Battleline</span>}
                  {u.isEpicHero && <span className="badge">Epic Hero</span>}
                  {u.isAlly && <span className="badge ally">Ally</span>}
                  {u.requiresDetachment && !chosenDetNames.has(u.requiresDetachment) && (
                    <span className="badge bad">needs {u.requiresDetachment}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="row wrap mt" style={{ gap: 6 }}>
              {u.isCharacter && !u.warlord && (
                <button className="small" onClick={() => onSetWarlord(u.uid)}>
                  Make Warlord
                </button>
              )}
              <button className="small" onClick={() => onDuplicate(u.uid)}>
                Duplicate
              </button>
              <div className="spacer" />
              <button
                className="small danger"
                onClick={() => onRemove(u.uid)}
              >
                Remove
              </button>
            </div>
            {ds && (ds.weapon_options?.length ?? 0) > 0 && (
              <WeaponOptionsEditor
                options={ds.weapon_options!}
                chosen={u.wargearCosts ?? []}
                modelCount={u.modelCount ?? ds.model_max ?? 1}
                onChange={(wc) => onSetWargear(u.uid, wc)}
              />
            )}
            {ds && (
              <details style={{ marginTop: 8 }}>
                <summary className="muted small">Datasheet</summary>
                <div className="mt">
                  <DatasheetCard ds={ds} selected={u.wargearCosts ?? []} />
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
          onConfirm={(tier, mc) => {
            onAdd(adding, tier, mc);
            setAdding(null);
          }}
        />
      )}
    </div>
  );
}

function WeaponOptionsEditor({
  options,
  chosen,
  modelCount,
  onChange,
}: {
  options: WeaponOption[];
  chosen: ChosenWargear[];
  modelCount: number;
  onChange: (wc: ChosenWargear[]) => void;
}) {
  const qtyOf = (text: string) => chosen.find((c) => c.name === text)?.qty ?? 0;
  const setQty = (o: WeaponOption, qty: number) => {
    const next = chosen.filter((c) => c.name !== o.text);
    if (qty > 0) next.push({ name: o.text, cost: o.cost, qty });
    onChange(next);
  };
  const total = chosen.reduce((s, c) => s + intOf(c.cost) * c.qty, 0);

  // Base weapons auto-scale: pool = max models that carry the base; remaining = pool - replacements.
  const basePool = new Map<string, number>();
  const baseUsed = new Map<string, number>();
  for (const o of options) {
    if (!o.base) continue;
    basePool.set(o.base, Math.max(basePool.get(o.base) ?? 0, optionMax(o.limit, modelCount) ?? 0));
    baseUsed.set(o.base, (baseUsed.get(o.base) ?? 0) + qtyOf(o.text));
  }

  return (
    <details style={{ marginTop: 8 }}>
      <summary className="muted small">
        Weapon options ({options.length}){total > 0 ? ` · +${total} pts` : ''}
      </summary>
      {basePool.size > 0 && (
        <div className="muted tiny" style={{ marginTop: 6 }}>
          {[...basePool.keys()].map((b) => (
            <div key={b}>
              base · {b}: <b>{Math.max(0, (basePool.get(b) ?? 0) - (baseUsed.get(b) ?? 0))}</b> left
            </div>
          ))}
        </div>
      )}
      <ul className="col" style={{ gap: 8, marginTop: 6, listStyle: 'none', padding: 0 }}>
        {options.map((o, i) => {
          // Constraint notes ("* no duplicates", "** max 3 ranged") are shown, not editable.
          if (o.limit?.kind === 'note') {
            return (
              <li key={i} className="muted tiny">
                {stripHtml(o.text)}
              </li>
            );
          }
          const rawMax = optionMax(o.limit, modelCount);
          // share the base-weapon pool across sibling options replacing the same base
          const max =
            o.base && rawMax != null
              ? Math.min(rawMax, (basePool.get(o.base) ?? rawMax) - ((baseUsed.get(o.base) ?? 0) - qtyOf(o.text)))
              : rawMax;
          const q = Math.min(qtyOf(o.text), max ?? Infinity);
          const limLabel =
            o.limit?.kind === 'per_n'
              ? `max ${max} (1 / ${o.limit.n})`
              : o.limit?.kind === 'slots'
                ? `up to ${o.limit.slots}/model`
                : max != null
                  ? `max ${max}`
                  : '';
          return (
            <li className="row" key={i} style={{ gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }} className="small">
                {stripHtml(o.text)}{' '}
                {o.cost > 0 ? (
                  <span className="badge">+{o.cost} pt{o.type === 'model' ? '' : ' each'}</span>
                ) : (
                  <span className="muted tiny">free</span>
                )}
                {limLabel ? <span className="muted tiny"> · {limLabel}</span> : ''}
              </div>
              {max === 1 ? (
                <input
                  type="checkbox"
                  className="opt-check"
                  checked={q === 1}
                  onChange={(e) => setQty(o, e.target.checked ? 1 : 0)}
                />
              ) : (
                <>
                  <button
                    className="ghost stepper sm"
                    disabled={q <= 0}
                    onClick={() => setQty(o, q - 1)}
                  >
                    −
                  </button>
                  <b style={{ minWidth: 20, textAlign: 'center' }}>{q}</b>
                  <button
                    className="ghost stepper sm"
                    disabled={max != null && q >= max}
                    onClick={() => setQty(o, Math.min(q + 1, max ?? Infinity))}
                  >
                    ＋
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </details>
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
  onConfirm: (tier: PointsOption, modelCount?: number) => void;
}) {
  const have = copiesOf(list, ds.id);
  const nextPick = have + 1; // this unit will be the Nth copy
  const lim = ds.is_battleline ? blLimit : unitLimit;
  const atLimit = lim > 0 && have >= lim;
  const heroBlocked = ds.is_epic_hero && have >= 1;
  const blocked = atLimit || heroBlocked;

  // Countable units: choose the model count; price = smallest bracket that contains it.
  const countable = !!ds.countable && ds.model_min != null && ds.model_max != null;
  const lo = ds.model_min ?? 1;
  const hi = ds.model_max ?? 1;
  const [count, setCount] = useState(lo);

  // Non-countable units: pick a points variant (usually just one).
  const variants = unitVariants(ds);
  const [sel, setSel] = useState(0);

  const chosenVariant = countable
    ? bracketForCount(ds, count)
    : variants[sel]?.variant ?? variants[sel]?.description ?? '';
  const opt =
    tierForPick(ds, chosenVariant, nextPick) ??
    (countable ? ds.points[0] : variants[sel]) ?? { description: 'Default', cost: '0' };
  const resolvedCost = intOf(opt.cost);

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
            onClick={() => onConfirm(opt, countable ? count : opt.models ?? undefined)}
          >
            {blocked ? 'At limit' : `Add — ${resolvedCost} pts`}
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

      {countable ? (
        <>
          <h3 className="muted">Number of models ({lo}–{hi})</h3>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <button
              className="ghost stepper"
              disabled={count <= lo}
              onClick={() => setCount((c) => Math.max(lo, c - 1))}
            >
              −
            </button>
            <b style={{ fontSize: 22, minWidth: 36, textAlign: 'center' }}>{count}</b>
            <button
              className="ghost stepper"
              disabled={count >= hi}
              onClick={() => setCount((c) => Math.min(hi, c + 1))}
            >
              ＋
            </button>
            <div className="spacer" />
            <div className="muted tiny" style={{ textAlign: 'right' }}>
              bracket: {chosenVariant}
              <br />
              {resolvedCost} pts
            </div>
          </div>
          <div className="muted tiny mt">
            Prezzo allo scaglione minimo che contiene {count} modelli
            {ds.has_order_tiers ? ` · ${nextPick}º esemplare (sale per 2º+/3º+)` : ''}.
            Si ricalcola se aggiungi o rimuovi copie.
          </div>
        </>
      ) : (
        <>
          <h3 className="muted">Points option</h3>
          <div className="col" style={{ gap: 6 }}>
            {variants.map((t, i) => {
              const vKey = t.variant ?? t.description;
              const o = tierForPick(ds, vKey, nextPick) ?? t;
              return (
                <button
                  key={i}
                  className={`pill-pts ${sel === i ? 'sel' : ''}`}
                  onClick={() => setSel(i)}
                >
                  <b>{intOf(o.cost)} pts</b> — {ds.has_order_tiers ? vKey : t.description}
                </button>
              );
            })}
          </div>
          {ds.has_order_tiers && (
            <div className="muted tiny mt">
              Costo automatico per il {nextPick}º esemplare (sale per 2º+/3º+).
            </div>
          )}
        </>
      )}

      <div className="mt">
        <DatasheetCard ds={ds} />
      </div>
    </Modal>
  );
}
