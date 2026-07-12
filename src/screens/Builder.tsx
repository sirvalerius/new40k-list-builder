import { useEffect, useMemo, useState } from 'react';
import type {
  ArmyList,
  ChosenWargear,
  Datasheet,
  Enhancement,
  FactionData,
  PointsOption,
  Rules,
} from '../lib/types';
import { getBattleSize, validateList } from '../lib/rules';
import {
  buildListUnit,
  clampLoadout,
  datasheetMap,
  dateStamp,
  download,
  exportListText,
  intOf,
  reconcileTiers,
  uid as uid_,
} from '../lib/helpers';
import { loadFactionById } from '../lib/data';
import { SummaryBar } from '../components/SummaryBar';
import { ValidationBanner } from '../components/ValidationBanner';
import { Modal } from '../components/Modal';
import { DetachmentPicker } from './DetachmentPicker';
import { Roster } from './Roster';
import { Enhancements } from './Enhancements';
import { Allies, type AllyAddition } from './Allies';
import { BunkerMode } from './BunkerMode';
import { PrintView } from './PrintView';
import { SkeletonList } from '../components/Skeleton';

type Tab = 'detach' | 'roster' | 'enh' | 'allies' | 'bunker' | 'print';

export function Builder({
  initial,
  rules,
  onChange,
  onDuplicate,
}: {
  initial: ArmyList;
  rules: Rules;
  onChange: (l: ArmyList) => void;
  onDuplicate: (l: ArmyList) => void;
}) {
  const [list, setList] = useState<ArmyList>(initial);
  const [fd, setFd] = useState<FactionData | null>(null);
  const [tab, setTab] = useState<Tab>('detach');
  const [editingSettings, setEditingSettings] = useState(false);

  // Load the faction's full data (lazy, cached).
  useEffect(() => {
    let alive = true;
    loadFactionById(initial.factionId).then((d) => {
      if (!alive || !d) return;
      setFd(d);
      // Reconcile mandatory stock-weapon costs (ds.default_wargear) for units already in
      // a saved list: buildListUnit only seeds them at creation, so a unit added before
      // this datasheet got a default_wargear entry (or never touched since) would
      // otherwise keep undercharging for its standard loadout forever.
      const dsMap = datasheetMap(d);
      setList((prev) => {
        let changed = false;
        const units = prev.units.map((u) => {
          const ds = dsMap.get(u.datasheetId);
          if (!ds) return u;
          const wargearCosts = clampLoadout(u, ds);
          const before = JSON.stringify(u.wargearCosts ?? []);
          const after = JSON.stringify(wargearCosts);
          if (before === after) return u;
          changed = true;
          return { ...u, wargearCosts };
        });
        if (!changed) return prev;
        const next = { ...prev, units };
        onChange(next);
        return next;
      });
    });
    return () => {
      alive = false;
    };
  }, [initial.factionId]);

  const battleSize = getBattleSize(rules, list.battleSizeId);

  // Mutate helper: updates timestamp and bubbles up for autosave.
  function update(mut: (l: ArmyList) => ArmyList) {
    setList((prev) => {
      const mutated = mut(prev);
      // Re-apply pick-order pricing (2nd+/3rd+) after every change so escalating
      // unit costs stay correct as copies are added or removed.
      const units = fd ? reconcileTiers(mutated.units, datasheetMap(fd)) : mutated.units;
      const next = { ...mutated, units, updatedAt: Date.now() };
      onChange(next);
      return next;
    });
  }

  const detachments = fd?.detachments ?? [];
  const sub = list.subFaction ?? '';
  // detachments offered in the picker: hide ones bound to a different Chapter
  const visibleDetachments = detachments.filter(
    (d) => !sub || !d.restricted_chapter || d.restricted_chapter === sub,
  );

  const result = useMemo(
    () => validateList(list, rules, detachments, fd ? datasheetMap(fd) : undefined),
    [list, rules, detachments, fd],
  );

  if (!fd || !battleSize) {
    return <SkeletonList count={4} label="Loading faction…" />;
  }
  const faction = fd; // non-null past the guard, for use inside closures
  const bs = battleSize;

  // ---- actions ----
  function toggleDetachment(id: string) {
    update((l) => {
      const has = l.detachmentIds.includes(id);
      const detachmentIds = has
        ? l.detachmentIds.filter((x) => x !== id)
        : [...l.detachmentIds, id];
      // Selecting a Chapter-locked detachment binds the army to that Chapter, so the
      // unit list / other detachments stay coherent (Black Templars psyker exclusion, etc.).
      let subFaction = l.subFaction;
      if (!has) {
        const picked = fd?.detachments.find((d) => d.id === id);
        if (picked?.restricted_chapter && !subFaction) subFaction = picked.restricted_chapter;
      }
      // dropping a detachment clears enhancements it provided
      let units = l.units;
      if (has && fd) {
        const stillAvailable = new Set(
          fd.detachments
            .filter((d) => detachmentIds.includes(d.id))
            .flatMap((d) => d.enhancements.map((e) => e.name)),
        );
        units = l.units.map((u) =>
          u.enhancementName && !stillAvailable.has(u.enhancementName)
            ? { ...u, enhancementName: undefined, enhancementCost: undefined }
            : u,
        );
      }
      // the army disposition must belong to a chosen detachment; unset it if stale
      let disposition = l.disposition;
      if (disposition && fd) {
        const offered = new Set(
          fd.detachments.filter((d) => detachmentIds.includes(d.id)).map((d) => d.force_disposition),
        );
        if (!offered.has(disposition)) disposition = undefined;
      }
      return { ...l, detachmentIds, units, subFaction, disposition };
    });
  }

  // Name + battle size can only be picked once, in NewListWizard, with no way back to them —
  // this is that way back. Doesn't auto-correct anything a smaller battle size now makes
  // illegal (over points/DP/enhancements): same as toggling a detachment, that's left to the
  // validation banner to flag so the user fixes it deliberately.
  function updateListSettings(name: string, battleSizeId: string) {
    update((l) => ({ ...l, name: name.trim() || l.name, battleSizeId }));
  }

  function setDisposition(disposition: string) {
    update((l) => ({ ...l, disposition: disposition || undefined }));
  }

  function setVsDisposition(disposition: string) {
    update((l) => ({ ...l, vsDisposition: disposition || undefined }));
  }

  function addUnit(ds: Datasheet, tier: PointsOption, modelCount?: number) {
    update((l) => ({ ...l, units: [...l.units, buildListUnit(ds, tier, modelCount)] }));
  }

  function addAlly(a: AllyAddition) {
    update((l) => {
      const unit = {
        ...buildListUnit(a.ds, a.tier),
        isAlly: true,
        allyKeyword: a.allyKeyword,
      };
      return { ...l, units: [...l.units, unit] };
    });
  }

  function removeUnit(uid: string) {
    update((l) => ({
      ...l,
      // also detach any leaders that were joined to the removed unit
      units: l.units
        .filter((u) => u.uid !== uid)
        .map((u) => (u.attachedToUid === uid ? { ...u, attachedToUid: undefined } : u)),
    }));
  }

  // Attach a Character (leader/support) to a bodyguard unit, or detach when toUid is null.
  // A bodyguard can hold at most two Characters (one Leader + one Support).
  function attachUnit(uid: string, toUid: string | null) {
    update((l) => {
      if (toUid) {
        const occupants = l.units.filter((x) => x.uid !== uid && x.attachedToUid === toUid).length;
        if (occupants >= 2) return l;
      }
      return {
        ...l,
        units: l.units.map((u) => (u.uid === uid ? { ...u, attachedToUid: toUid ?? undefined } : u)),
      };
    });
  }

  function renameUnit(uid: string, customName: string) {
    update((l) => ({
      ...l,
      units: l.units.map((u) => (u.uid === uid ? { ...u, customName } : u)),
    }));
  }

  function duplicateUnit(uid: string) {
    update((l) => {
      const src = l.units.find((u) => u.uid === uid);
      if (!src) return l;
      // Clone the loadout (model count + paid wargear) but drop the per-army
      // singletons: Warlord and the enhancement (which is limited/unique).
      const copy = {
        ...src,
        uid: uid_(),
        warlord: false,
        enhancementName: undefined,
        enhancementCost: undefined,
        attachedToUid: undefined,
        wargearCosts: src.wargearCosts ? src.wargearCosts.map((w) => ({ ...w })) : undefined,
      };
      const idx = l.units.findIndex((u) => u.uid === uid);
      const units = [...l.units];
      units.splice(idx + 1, 0, copy); // insert right after the original
      return { ...l, units };
      // reconcileTiers (in update) re-prices both for the new pick-order positions.
    });
  }

  function setWarlord(uid: string) {
    update((l) => ({
      ...l,
      units: l.units.map((u) => ({ ...u, warlord: u.uid === uid })),
    }));
  }

  function setWargear(uid: string, wargear: ChosenWargear[]) {
    const dsMap = fd ? datasheetMap(fd) : null;
    update((l) => ({
      ...l,
      units: l.units.map((u) => {
        if (u.uid !== uid) return u;
        const next = { ...u, wargearCosts: wargear };
        const ds = dsMap?.get(u.datasheetId);
        // clampLoadout drops sub-model options when their model is removed (e.g. ATV gun).
        return ds ? { ...next, wargearCosts: clampLoadout(next, ds) } : next;
      }),
    }));
  }

  function setSubFaction(sub: string) {
    update((l) => {
      // drop chosen detachments that are bound to a different Chapter
      const keep = detachments
        .filter((d) => !sub || !d.restricted_chapter || d.restricted_chapter === sub)
        .map((d) => d.id);
      return { ...l, subFaction: sub, detachmentIds: l.detachmentIds.filter((id) => keep.includes(id)) };
    });
  }

  function setModelCount(uid: string, count: number) {
    const dsMap = fd ? datasheetMap(fd) : null;
    update((l) => ({
      ...l,
      units: l.units.map((u) => {
        if (u.uid !== uid) return u;
        const next = { ...u, modelCount: count };
        const ds = dsMap?.get(u.datasheetId);
        return ds ? { ...next, wargearCosts: clampLoadout(next, ds) } : next;
        // reconcileTiers (in update) re-prices to the bracket containing `count`.
      }),
    }));
  }

  function assignEnhancement(uid: string, enh: Enhancement) {
    update((l) => ({
      ...l,
      units: l.units.map((u) =>
        u.uid === uid
          ? {
              ...u,
              enhancementName: enh.name,
              enhancementCost: intOf(enh.cost),
            }
          : u,
      ),
    }));
  }

  function clearEnhancement(uid: string) {
    update((l) => ({
      ...l,
      units: l.units.map((u) =>
        u.uid === uid
          ? { ...u, enhancementName: undefined, enhancementCost: undefined }
          : u,
      ),
    }));
  }

  function exportText() {
    download(
      `${list.name.replace(/[^\w-]+/g, '_')}_${dateStamp()}.txt`,
      exportListText(
        list,
        faction,
        detachments,
        bs.name,
        result.totals.points,
        result.totals.pointsLimit,
      ),
      'text/plain',
    );
  }

  return (
    <div>
      <div className="no-print">
        <ValidationBanner result={result} />

        <div className="row mb" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {(fd.faction.sub_factions?.length ?? 0) > 0 && (
            <>
              <span className="muted small">Chapter:</span>
              <select
                value={list.subFaction ?? ''}
                onChange={(e) => setSubFaction(e.target.value)}
              >
                <option value="">Any / Codex</option>
                {fd.faction.sub_factions!.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="spacer" />
          <button className="ghost small" onClick={() => setEditingSettings(true)}>
            ✎ Edit list
          </button>
          <button className="ghost small" onClick={() => onDuplicate(list)}>
            ⧉ Duplicate list
          </button>
          <button className="ghost small" onClick={exportText}>
            ⤓ Export as text
          </button>
        </div>

        {editingSettings && (
          <ListSettingsModal
            list={list}
            rules={rules}
            onSave={(name, battleSizeId) => {
              updateListSettings(name, battleSizeId);
              setEditingSettings(false);
            }}
            onClose={() => setEditingSettings(false)}
          />
        )}

        <div className="tabs">
          <button
            className={tab === 'detach' ? 'active' : ''}
            onClick={() => setTab('detach')}
          >
            Detachments ({list.detachmentIds.length})
          </button>
          <button
            className={tab === 'roster' ? 'active' : ''}
            onClick={() => setTab('roster')}
          >
            Roster ({list.units.filter((u) => !u.isAlly).length})
          </button>
          <button
            className={tab === 'enh' ? 'active' : ''}
            onClick={() => setTab('enh')}
          >
            Enhancements
          </button>
          <button
            className={tab === 'allies' ? 'active' : ''}
            onClick={() => setTab('allies')}
          >
            Allies ({list.units.filter((u) => u.isAlly).length})
          </button>
          <button
            className={tab === 'bunker' ? 'active' : ''}
            onClick={() => setTab('bunker')}
          >
            🛡 In-game
          </button>
          <button
            className={tab === 'print' ? 'active' : ''}
            onClick={() => setTab('print')}
          >
            🖶 Print
          </button>
        </div>
      </div>

      {tab === 'detach' && (
        <DetachmentPicker
          list={list}
          detachments={visibleDetachments}
          dpBudget={intOf(battleSize.detachment_points)}
          onToggle={toggleDetachment}
        />
      )}
      {tab === 'roster' && (
        <Roster
          list={list}
          fd={fd}
          battleSize={battleSize}
          subFaction={sub}
          onAdd={addUnit}
          onRemove={removeUnit}
          onDuplicate={duplicateUnit}
          onSetWarlord={setWarlord}
          onSetWargear={setWargear}
          onSetModelCount={setModelCount}
          onAttach={attachUnit}
          onRename={renameUnit}
          detachments={detachments}
          onSetDisposition={setDisposition}
        />
      )}
      {tab === 'enh' && (
        <Enhancements
          list={list}
          fd={fd}
          detachments={detachments}
          enhancementLimit={result.totals.enhancementLimit}
          enhancementsUsed={result.totals.enhancementsUsed}
          onAssign={assignEnhancement}
          onClear={clearEnhancement}
        />
      )}
      {tab === 'allies' && (
        <Allies
          list={list}
          rules={rules}
          battleSize={battleSize}
          onAddAlly={addAlly}
          onRemove={removeUnit}
        />
      )}
      {tab === 'bunker' && (
        <BunkerMode list={list} fd={fd} rules={rules} onSetVsDisposition={setVsDisposition} />
      )}
      {tab === 'print' && (
        <PrintView
          list={list}
          fd={fd}
          detachments={detachments}
          battleSizeName={bs.name}
          pointsTotal={result.totals.points}
          pointsLimit={result.totals.pointsLimit}
        />
      )}

      <div className="no-print">
        <SummaryBar result={result} />
      </div>
    </div>
  );
}

// Name + battle size, editable after creation (NewListWizard only offers them once, at
// creation) — same fields, same picker layout, so switching battle size still reads like a
// deliberate choice rather than a generic settings form.
function ListSettingsModal({
  list,
  rules,
  onSave,
  onClose,
}: {
  list: ArmyList;
  rules: Rules;
  onSave: (name: string, battleSizeId: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(list.name);
  const [battleSizeId, setBattleSizeId] = useState(list.battleSizeId);
  return (
    <Modal title="Edit list" onClose={onClose}>
      <label className="field-label">List name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="mb" />

      <label className="field-label">Battle size</label>
      <div className="col" style={{ gap: 8 }}>
        {rules.battle_sizes.map((b) => (
          <button
            key={b.id}
            className={`card tappable ${battleSizeId === b.id ? 'primary' : 'ghost'}`}
            style={{ textAlign: 'left', display: 'block', height: 'auto', padding: 14 }}
            onClick={() => setBattleSizeId(b.id)}
          >
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
              {b.name} — {intOf(b.points)} pts
            </div>
            <div className="small" style={{ opacity: 0.85, marginTop: 4 }}>
              {intOf(b.detachment_points)} Detachment Points ·{' '}
              {intOf(b.enhancement_limit)} enhancements · Rule of{' '}
              {intOf(b.unit_limit)} ({intOf(b.battleline_limit)} battleline)
              {b.confirmed === 'provisional' ? ' · provisional' : ''}
            </div>
          </button>
        ))}
      </div>

      <div className="row mt">
        <button className="ghost" onClick={onClose}>
          Cancel
        </button>
        <div className="spacer" />
        <button className="primary" onClick={() => onSave(name, battleSizeId)}>
          Save
        </button>
      </div>
    </Modal>
  );
}
