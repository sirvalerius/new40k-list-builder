import { useMemo, useState } from 'react';
import type {
  ArmyList,
  BattleSize,
  ChosenWargear,
  Datasheet,
  FactionData,
  PointsOption,
  Weapon,
  WeaponOption,
} from '../lib/types';
import { DatasheetCard } from '../components/DatasheetCard';
import { Modal } from '../components/Modal';
import {
  GROUP_LABEL,
  GROUP_ORDER,
  attachedLeaders,
  bracketForCount,
  copiesOf,
  eligibleBodyguards,
  getFavorites,
  intOf,
  optionMax,
  stripHtml,
  tierForPick,
  toggleFavorite,
  unitGroup,
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
  onAttach,
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
  onAttach: (uid: string, toUid: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const [adding, setAdding] = useState<Datasheet | null>(null);
  const [hideLegends, setHideLegends] = useState(true); // Legends hidden by default
  const [favs, setFavs] = useState<string[]>(() => getFavorites('ds'));

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
        if (hideLegends && d.is_legends) return false;
        if (!subFaction) return true;
        if (d.chapter && d.chapter !== subFaction) return false;
        if (
          subFaction === 'Black Templars' &&
          (d.keywords ?? []).some((k) => k.toUpperCase() === 'PSYKER')
        )
          return false;
        return true;
      }),
    [fd, subFaction, hideLegends],
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

  const renderUnitCard = (u: typeof list.units[number]) => {
    const ds = dsById.get(u.datasheetId);
    const leaders = attachedLeaders(u.uid, list);
    const eligible = ds?.is_leader ? eligibleBodyguards(ds, list, dsById) : [];
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
            {/* leaders/supports joined to this (bodyguard) unit */}
            {leaders.length > 0 && (
              <div className="row wrap mt" style={{ gap: 4, alignItems: 'center' }}>
                <span className="muted tiny">Joined:</span>
                {leaders.map((l) => (
                  <span key={l.uid} className="badge char">
                    {l.name}
                  </span>
                ))}
              </div>
            )}
            {/* attach this Character to a bodyguard unit it can lead */}
            {ds?.is_leader && (
              <div className="row mt" style={{ gap: 8, alignItems: 'center' }}>
                <span className="muted tiny">Attach to:</span>
                {eligible.length > 0 || u.attachedToUid ? (
                  <select
                    className="small"
                    value={u.attachedToUid ?? ''}
                    onChange={(e) => onAttach(u.uid, e.target.value || null)}
                  >
                    <option value="">— not attached —</option>
                    {eligible.map((b) => (
                      <option key={b.uid} value={b.uid}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="muted tiny">no eligible unit in roster</span>
                )}
              </div>
            )}
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
          <button className="small danger" onClick={() => onRemove(u.uid)}>
            Remove
          </button>
        </div>
        {ds && (ds.weapon_options?.length ?? 0) > 0 && (
          <WeaponOptionsEditor
            options={ds.weapon_options!}
            weapons={ds.weapons ?? []}
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
  };

  return (
    <div>
      <div className="mb muted small">
        {list.units.length} unit{list.units.length === 1 ? '' : 's'} in roster
      </div>

      {list.units.length === 0 && (
        <div className="empty">No units yet. Tap the + button.</div>
      )}

      {/* units grouped by sub-type: Epic Heroes / Leaders & Supports / Battleline / Other */}
      {GROUP_ORDER.map((g) => {
        const inGroup = list.units.filter((u) => !u.isAlly && unitGroup(u) === g);
        if (!inGroup.length) return null;
        return (
          <div key={g} className="mb">
            <h3 className="group-head muted">{GROUP_LABEL[g]} ({inGroup.length})</h3>
            {inGroup.map(renderUnitCard)}
          </div>
        );
      })}
      {/* allies kept at the bottom (managed in the Allies tab) */}
      {list.units.some((u) => u.isAlly) && (
        <div className="mb">
          <h3 className="group-head muted">Allies</h3>
          {list.units.filter((u) => u.isAlly).map(renderUnitCard)}
        </div>
      )}

      {/* floating action button — always within thumb reach */}
      <button className="fab" aria-label="Add unit" onClick={() => setBrowsing(true)}>
        ＋
      </button>

      {browsing && (
        <Modal title="Add a unit" onClose={() => setBrowsing(false)}>
          <input
            placeholder="Search datasheet…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb"
          />
          <label className="row mb" style={{ gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="opt-check"
              checked={hideLegends}
              onChange={(e) => setHideLegends(e.target.checked)}
            />
            <span className="small">Nascondi unità Legends</span>
          </label>
          {(() => {
            const favSet = new Set(favs);
            const renderRow = (d: Datasheet) => {
              const have = copiesOf(list, d.id);
              const lim = d.is_battleline ? blLimit : unitLimit;
              const atLimit = lim > 0 && have >= lim;
              const heroBlocked = d.is_epic_hero && have >= 1;
              const fav = favSet.has(d.id);
              return (
                <div key={d.id} className="row" style={{ gap: 6, alignItems: 'stretch' }}>
                  <button
                    className="ghost iconbtn star"
                    aria-label="Preferito"
                    onClick={() => setFavs(toggleFavorite('ds', d.id))}
                  >
                    {fav ? '★' : '☆'}
                  </button>
                  <button
                    className="card tappable ghost list-tile"
                    style={{ textAlign: 'left', height: 'auto', padding: 10, flex: 1 }}
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
                </div>
              );
            };
            const favRows = filtered.filter((d) => favSet.has(d.id));
            return (
              <>
                {favRows.length > 0 && (
                  <div className="mb">
                    <h3 className="muted">★ Preferiti</h3>
                    <div className="col" style={{ gap: 6 }}>{favRows.map(renderRow)}</div>
                  </div>
                )}
                {ROLE_ORDER.map((bucket) => {
                  const inBucket = filtered.filter((d) => {
                    if (bucket === 'Epic Hero') return d.is_epic_hero;
                    if (bucket === 'Character') return d.is_character && !d.is_epic_hero;
                    if (bucket === 'Battleline') return d.is_battleline && !d.is_character;
                    if (bucket === 'Infantry')
                      return !d.is_character && !d.is_battleline && d.keywords.includes('Infantry');
                    return !d.is_character && !d.is_battleline && !d.keywords.includes('Infantry');
                  });
                  if (!inBucket.length) return null;
                  return (
                    <div key={bucket} className="mb">
                      <h3 className="muted">{bucket}</h3>
                      <div className="col" style={{ gap: 6 }}>
                        {inBucket.map(renderRow)}
                </div>
              </div>
            );
                })}
              </>
            );
          })()}
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
  weapons,
  chosen,
  modelCount,
  onChange,
}: {
  options: WeaponOption[];
  weapons: Weapon[];
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
  // (display only — shown as "base · X: N left")
  const basePool = new Map<string, number>();
  const baseUsed = new Map<string, number>();
  // Cap pool: options that replace the same base, OR are split from one "one of the following"
  // list (same `group`), share an aggregate cap. Group takes precedence so a split list's cap
  // (e.g. up to 4) is independent of other same-base single options.
  const capPool = new Map<string, number>();
  const capUsed = new Map<string, number>();
  const capKey = (o: WeaponOption) => o.group || o.base || '';
  for (const o of options) {
    if (o.base) {
      basePool.set(o.base, Math.max(basePool.get(o.base) ?? 0, optionMax(o.limit, modelCount) ?? 0));
      baseUsed.set(o.base, (baseUsed.get(o.base) ?? 0) + qtyOf(o.text));
    }
    const key = capKey(o);
    if (key) {
      capPool.set(key, Math.max(capPool.get(key) ?? 0, optionMax(o.limit, modelCount) ?? 0));
      capUsed.set(key, (capUsed.get(key) ?? 0) + qtyOf(o.text));
    }
  }

  // Sub-model provider counts: an option that pertains to an optional sub-model (e.g. the
  // Invader ATV's gun) can only be taken as many times as that model is actually in the unit.
  const providerQty = new Map<string, number>();
  for (const o of options)
    if (o.type === 'model' && o.model) providerQty.set(o.model, qtyOf(o.text));
  const titleCase = (s: string) =>
    s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  // Stat profile of the weapon(s) an option adds, so the player sees what they'd gain.
  const fmtWeapon = (w: Weapon) => {
    const num = /^\d+$/.test(String(w.BS_WS).trim());
    const sk = `${w.type === 'Ranged' ? 'BS' : 'WS'} ${num ? `${w.BS_WS}+` : w.BS_WS}`;
    const rng = w.range && w.range !== 'Melee' ? `${w.range}"` : 'Melee';
    return `${rng} · A${w.A} · ${sk} · S${w.S} · AP${w.AP} · D${w.D}`;
  };
  const grantedProfiles = (o: WeaponOption): Weapon[] => {
    const out: Weapon[] = [];
    for (const g of o.grants ?? []) {
      const gn = g.toLowerCase().trim();
      for (const w of weapons) {
        const wn = w.name.toLowerCase();
        // exact, or a multi-profile weapon ("grenade launcher – frag/krak")
        if ((wn === gn || wn.startsWith(gn + ' ')) && !out.includes(w)) out.push(w);
      }
    }
    return out;
  };

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
          // share the cap pool across sibling options (same base, or same split-list group)
          const key = capKey(o);
          let max =
            key && rawMax != null
              ? Math.min(rawMax, (capPool.get(key) ?? rawMax) - ((capUsed.get(key) ?? 0) - qtyOf(o.text)))
              : rawMax;
          // cap by the count of the optional sub-model this option pertains to
          const provModel = o.type !== 'model' ? o.model : '';
          const provCap = provModel && providerQty.has(provModel) ? providerQty.get(provModel)! : null;
          if (provCap != null) max = Math.min(max ?? Infinity, provCap);
          const needsModel = provCap === 0 ? titleCase(provModel!) : '';
          const q = Math.min(qtyOf(o.text), max ?? Infinity);
          // Render as a checkbox when the option is intrinsically single-pick (its own limit
          // is 1), regardless of how the shared pool has shrunk its current allowance — so a
          // checkbox stays a checkbox (greyed) instead of becoming a "− 0 +" stepper.
          const isCheckbox = rawMax === 1;
          // Unavailable = nothing chosen and no remaining allowance (pool/sub-model used up).
          const unavailable = q === 0 && (max ?? Infinity) <= 0;
          const limLabel = needsModel
            ? `richiede ${needsModel}`
            : o.limit?.kind === 'per_n'
              ? `max ${max} (1 / ${o.limit.n})`
              : o.limit?.kind === 'slots'
                ? `up to ${o.limit.slots}/model`
                : max != null
                  ? `max ${max}`
                  : '';
          return (
            <li
              className="row"
              key={i}
              style={{ gap: 8, alignItems: 'flex-start', opacity: unavailable ? 0.45 : 1 }}
            >
              <div style={{ flex: 1 }} className="small">
                {stripHtml(o.text)}{' '}
                {o.cost > 0 ? (
                  <span className="badge">+{o.cost} pt{o.type === 'model' ? '' : ' each'}</span>
                ) : (
                  <span className="muted tiny">free</span>
                )}
                {limLabel ? <span className="muted tiny"> · {limLabel}</span> : ''}
                {grantedProfiles(o).map((w, j) => (
                  <div key={j} className="muted tiny wpn-profile">
                    ⮡ <b>{w.name}</b> — {fmtWeapon(w)}
                    {w.description ? ` · ${stripHtml(w.description)}` : ''}
                  </div>
                ))}
              </div>
              {isCheckbox ? (
                <input
                  type="checkbox"
                  className="opt-check"
                  checked={q === 1}
                  disabled={unavailable}
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
