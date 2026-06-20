import { useEffect, useMemo, useState } from 'react';
import type {
  ArmyList,
  Datasheet,
  Enhancement,
  FactionData,
  PointsOption,
  Rules,
} from '../lib/types';
import { getBattleSize, validateList } from '../lib/rules';
import {
  buildListUnit,
  datasheetMap,
  download,
  exportListText,
  intOf,
  reconcileTiers,
} from '../lib/helpers';
import { loadFactionById } from '../lib/data';
import { SummaryBar } from '../components/SummaryBar';
import { ValidationBanner } from '../components/ValidationBanner';
import { DetachmentPicker } from './DetachmentPicker';
import { Roster } from './Roster';
import { Enhancements } from './Enhancements';
import { Allies, type AllyAddition } from './Allies';

type Tab = 'detach' | 'roster' | 'enh' | 'allies';

export function Builder({
  initial,
  rules,
  onChange,
}: {
  initial: ArmyList;
  rules: Rules;
  onChange: (l: ArmyList) => void;
}) {
  const [list, setList] = useState<ArmyList>(initial);
  const [fd, setFd] = useState<FactionData | null>(null);
  const [tab, setTab] = useState<Tab>('detach');

  // Load the faction's full data (lazy, cached).
  useEffect(() => {
    let alive = true;
    loadFactionById(initial.factionId).then((d) => {
      if (alive && d) setFd(d);
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

  const result = useMemo(
    () => validateList(list, rules, detachments),
    [list, rules, detachments],
  );

  if (!fd || !battleSize) {
    return <div className="spin" />;
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
      return { ...l, detachmentIds, units };
    });
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
    update((l) => ({ ...l, units: l.units.filter((u) => u.uid !== uid) }));
  }

  function setWarlord(uid: string) {
    update((l) => ({
      ...l,
      units: l.units.map((u) => ({ ...u, warlord: u.uid === uid })),
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
      `${list.name.replace(/[^\w-]+/g, '_')}.txt`,
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
      <ValidationBanner result={result} />

      <div className="row mb">
        <button className="ghost small" onClick={exportText}>
          ⤓ Export as text
        </button>
      </div>

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
      </div>

      {tab === 'detach' && (
        <DetachmentPicker
          list={list}
          detachments={detachments}
          dpBudget={intOf(battleSize.detachment_points)}
          onToggle={toggleDetachment}
        />
      )}
      {tab === 'roster' && (
        <Roster
          list={list}
          fd={fd}
          battleSize={battleSize}
          onAdd={addUnit}
          onRemove={removeUnit}
          onSetWarlord={setWarlord}
        />
      )}
      {tab === 'enh' && (
        <Enhancements
          list={list}
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

      <SummaryBar result={result} />
    </div>
  );
}
