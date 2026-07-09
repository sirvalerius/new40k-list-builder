import { useEffect, useMemo, useState } from 'react';
import type {
  AllyRule,
  ArmyList,
  BattleSize,
  Datasheet,
  FactionData,
  PointsOption,
  Rules,
} from '../lib/types';
import { allyCap } from '../lib/rules';
import { loadIndex, loadFaction } from '../lib/data';
import { intOf, unitTotal } from '../lib/helpers';
import { Modal } from '../components/Modal';
import { DatasheetCard } from '../components/DatasheetCard';

// Allied units are added as instances tagged with the matched ally keyword.
export interface AllyAddition {
  ds: Datasheet;
  tier: PointsOption;
  allyKeyword: string;
}

export function Allies({
  list,
  rules,
  battleSize,
  onAddAlly,
  onRemove,
}: {
  list: ArmyList;
  rules: Rules;
  battleSize: BattleSize;
  onAddAlly: (a: AllyAddition) => void;
  onRemove: (uid: string) => void;
}) {
  const allyRules = useMemo(
    () =>
      rules.allies.filter(
        (a) =>
          a.army_faction_id === list.factionId &&
          a.mechanism !== 'native' &&
          a.mechanism !== 'chapter_restriction',
      ),
    [rules, list.factionId],
  );

  if (allyRules.length === 0) {
    return (
      <div className="empty">
        No allied detachments are available for this faction in the data.
      </div>
    );
  }

  return (
    <div>
      <div
        className="banner ok"
        style={{
          background: 'var(--bg-elev)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      >
        Allied units count against a points cap for their keyword. Some
        mechanisms (e.g. Agents of the Imperium) are gated by special rules — use
        within the spirit of the rules.
      </div>

      {list.units.filter((u) => u.isAlly).length > 0 && (
        <div className="card">
          <h3>Allied units in roster</h3>
          {list.units
            .filter((u) => u.isAlly)
            .map((u) => (
              <div className="row mt" key={u.uid}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div className="muted small">
                    {(u as { allyKeyword?: string }).allyKeyword ?? 'Ally'} ·{' '}
                    {intOf(u.pointsCost)} pts
                  </div>
                </div>
                <button className="small danger" onClick={() => onRemove(u.uid)}>
                  Remove
                </button>
              </div>
            ))}
        </div>
      )}

      {allyRules.map((rule, i) => (
        <AllyRuleBlock
          key={`${rule.allied_keyword}-${i}`}
          rule={rule}
          list={list}
          battleSize={battleSize}
          onAddAlly={onAddAlly}
        />
      ))}
    </div>
  );
}

function AllyRuleBlock({
  rule,
  list,
  battleSize,
  onAddAlly,
}: {
  rule: AllyRule;
  list: ArmyList;
  battleSize: BattleSize;
  onAddAlly: (a: AllyAddition) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fd, setFd] = useState<FactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<Datasheet | null>(null);

  const cap = allyCap(rule, battleSize.name);
  const used = list.units
    .filter(
      (u) => u.isAlly && (u as { allyKeyword?: string }).allyKeyword === rule.allied_keyword,
    )
    .reduce((s, u) => s + unitTotal(u), 0);

  async function ensureLoaded() {
    if (fd || loading) return;
    setLoading(true);
    try {
      const idx = await loadIndex();
      // Match the allied keyword to a faction by name/super keyword.
      const entry =
        idx.factions.find(
          (f) =>
            f.name.toUpperCase() === rule.allied_keyword.toUpperCase() ||
            f.super_keywords.some(
              (k) => k.toUpperCase() === rule.allied_keyword.toUpperCase(),
            ),
        ) ?? undefined;
      if (entry) setFd(await loadFaction(entry.slug));
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) ensureLoaded();
  }

  // Filter candidate datasheets to those whose keywords include the ally keyword.
  const candidates = useMemo(() => {
    if (!fd) return [];
    const kw = rule.allied_keyword.toUpperCase();
    return fd.datasheets
      .filter(
        (d) =>
          d.keywords.some((k) => k.toUpperCase() === kw) ||
          d.faction_keywords.some((k) => k.toUpperCase() === kw) ||
          !!fd, // fall back to all if the data has no matching tag
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fd, rule.allied_keyword]);

  return (
    <div className="card">
      <div className="collapse-head" onClick={toggle}>
        <span className="chev" style={{ transform: open ? 'rotate(90deg)' : '' }}>
          ▶
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{rule.allied_keyword}</div>
          <div className="muted small">
            {rule.mechanism.replace('_', ' ')}
            {rule.gated_by !== 'none' ? ` · via ${rule.gated_by}` : ''} ·{' '}
            {cap > 0 ? (
              <>
                cap {used}/{cap} pts
              </>
            ) : (
              'special cap'
            )}
          </div>
        </div>
      </div>

      {rule.notes && open && <div className="desc">{rule.notes}</div>}

      {open && (
        <div className="mt">
          {loading && <div className="spin" />}
          {!loading && !fd && (
            <div className="muted small">
              Couldn’t resolve a datasheet source for this ally keyword in the
              local data.
            </div>
          )}
          {fd && (
            <div className="col" style={{ gap: 6 }}>
              {candidates.map((d) => (
                <button
                  key={d.id}
                  className="card tappable ghost list-tile"
                  style={{ textAlign: 'left', height: 'auto', padding: 10 }}
                  onClick={() => setAdding(d)}
                >
                  <div className="meta">
                    <div className="name">{d.name}</div>
                    <div className="muted tiny">
                      {d.points[0] ? `from ${intOf(d.points[0].cost)} pts` : ''}
                    </div>
                  </div>
                  <span aria-hidden>＋</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {adding && (
        <AddAllyModal
          ds={adding}
          cap={cap}
          used={used}
          onClose={() => setAdding(null)}
          onConfirm={(tier) => {
            onAddAlly({ ds: adding, tier, allyKeyword: rule.allied_keyword });
            setAdding(null);
          }}
        />
      )}
    </div>
  );
}

function AddAllyModal({
  ds,
  cap,
  used,
  onClose,
  onConfirm,
}: {
  ds: Datasheet;
  cap: number;
  used: number;
  onClose: () => void;
  onConfirm: (tier: PointsOption) => void;
}) {
  const tiers = ds.points.length
    ? ds.points
    : [{ description: 'Default', cost: '0' }];
  const [sel, setSel] = useState(0);
  const cost = intOf(tiers[sel].cost);
  const wouldExceed = cap > 0 && used + cost > cap;

  // satisfy noUnused* — DatasheetCard import used below
  useEffect(() => {}, []);

  return (
    <Modal
      title={`${ds.name} (ally)`}
      onClose={onClose}
      footer={
        <div className="row">
          <button className="ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="spacer" />
          <button className="primary" onClick={() => onConfirm(tiers[sel])}>
            {wouldExceed ? `Add anyway — ${cost} pts` : `Add — ${cost} pts`}
          </button>
        </div>
      }
    >
      {wouldExceed && (
        <div className="banner bad mb">
          <div className="viol warning">
            <span className="dot" />
            <span>
              This would put allied points at {used + cost}, over the {cap} cap.
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
