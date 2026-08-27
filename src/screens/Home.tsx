import { useEffect, useRef, useState } from 'react';
import type { ArmyList, FactionIndexEntry, Rules } from '../lib/types';
import {
  deleteList,
  getAllLists,
  importLists,
} from '../lib/db';
import { loadFactionById } from '../lib/data';
import { download, isRecentChange, recentlyChangedUnits, unitTotal } from '../lib/helpers';
import { md } from '../lib/md';
import { SkeletonList } from '../components/Skeleton';
import { Modal } from '../components/Modal';

export function Home({
  rules,
  factions,
  factionName,
  onNew,
  onOpen,
  onDuplicate,
  onDispositions,
  onMissions,
  onTracker,
}: {
  rules: Rules;
  factions: FactionIndexEntry[];
  factionName: (id: string) => string;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDispositions: () => void;
  onMissions: () => void;
  onTracker: () => void;
}) {
  const [lists, setLists] = useState<ArmyList[] | null>(null);
  // Per-list units matched by a recent (last 30 days) changelog entry, keyed by list id —
  // populated lazily below, only for lists whose faction actually had a recent update.
  const [changed, setChanged] = useState<Map<string, { unit: ArmyList['units'][number]; items: string[] }[]>>(
    new Map(),
  );
  const [changesFor, setChangesFor] = useState<ArmyList | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLists(await getAllLists());
  }
  useEffect(() => {
    refresh();
  }, []);

  // Faction-level changelog_last_update (from the cheap index, already loaded) gates whether
  // it's worth fetching that faction's full changelog at all — most lists' factions won't have
  // changed recently, so this stays a no-op fetch for the common case.
  useEffect(() => {
    if (!lists) return;
    const candidates = lists.filter((l) =>
      isRecentChange(factions.find((f) => f.id === l.factionId)?.changelog_last_update),
    );
    if (candidates.length === 0) {
      setChanged(new Map());
      return;
    }
    let alive = true;
    (async () => {
      const byFaction = new Map<string, ArmyList[]>();
      for (const l of candidates) {
        const arr = byFaction.get(l.factionId) ?? [];
        arr.push(l);
        byFaction.set(l.factionId, arr);
      }
      const next = new Map<string, { unit: ArmyList['units'][number]; items: string[] }[]>();
      for (const [factionId, factionLists] of byFaction) {
        const fd = await loadFactionById(factionId);
        if (!fd) continue;
        for (const l of factionLists) {
          const matches = recentlyChangedUnits(l, fd.faction.changelog);
          if (matches.length) next.set(l.id, matches);
        }
      }
      if (alive) setChanged(next);
    })();
    return () => {
      alive = false;
    };
  }, [lists, factions]);

  function bsName(id: string) {
    return rules.battle_sizes.find((b) => b.id === id)?.name ?? '';
  }
  function bsPoints(id: string) {
    return rules.battle_sizes.find((b) => b.id === id)?.points ?? 0;
  }

  async function onDelete(l: ArmyList) {
    if (!confirm(`Delete "${l.name}"?`)) return;
    await deleteList(l.id);
    refresh();
  }

  async function exportBackup() {
    const all = await getAllLists();
    download(
      `new40k-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ app: 'new40k', version: 1, lists: all }, null, 2),
    );
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming: ArmyList[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.lists)
        ? parsed.lists
        : [];
      if (!incoming.length) {
        alert('No lists found in that file.');
      } else {
        const n = await importLists(incoming);
        alert(`Imported ${n} list(s).`);
        refresh();
      }
    } catch {
      alert('Could not read that backup file.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <button className="primary" style={{ width: '100%' }} onClick={onNew}>
        + New list
      </button>

      <div className="row mt">
        <button className="ghost small" onClick={onDispositions}>
          ⚔ Detachments &amp; Dispositions
        </button>
        <button className="ghost small" onClick={onMissions}>
          🗺 Missions
        </button>
        <button className="ghost small" onClick={onTracker}>
          📺 Game Tracker
        </button>
      </div>

      <div className="row mt mb">
        <button className="ghost small" onClick={exportBackup}>
          ⤓ Export backup
        </button>
        <button
          className="ghost small"
          onClick={() => fileRef.current?.click()}
        >
          ⤒ Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onImportFile}
        />
      </div>

      {lists === null && <SkeletonList count={3} label="Loading saved lists…" />}
      {lists && lists.length === 0 && (
        <div className="empty">
          No armies muster in the archives yet.
          <br />
          Tap <b>+ New list</b> to begin the crusade.
        </div>
      )}
      {lists &&
        lists.map((l) => (
          <div className="card list-tile" key={l.id}>
            <div
              className="meta tappable"
              onClick={() => onOpen(l.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="name">{l.name}</div>
              <div className="muted small">
                {factionName(l.factionId)} · {bsName(l.battleSizeId)}
              </div>
              <div className="muted small">
                <b>{l.units.reduce((s, u) => s + unitTotal(u), 0)}</b>
                /{bsPoints(l.battleSizeId)} pts · {l.units.length} unit
                {l.units.length === 1 ? '' : 's'} · {l.detachmentIds.length} detach
                {l.detachmentIds.length === 1 ? '' : 's'}
              </div>
            </div>
            {changed.has(l.id) && (
              <button
                className="ghost small iconbtn"
                onClick={() => setChangesFor(l)}
                aria-label={`Recent changes affecting "${l.name}"`}
                title={`${changed.get(l.id)!.length} unit(s) in this list changed recently`}
              >
                🆕
              </button>
            )}
            <button className="ghost small" onClick={() => onOpen(l.id)}>
              Open
            </button>
            <button
              className="ghost small iconbtn"
              onClick={() => onDuplicate(l.id)}
              aria-label="Duplicate"
              title="Duplicate"
            >
              ⧉
            </button>
            <button
              className="ghost small danger iconbtn"
              onClick={() => onDelete(l)}
              aria-label="Delete"
            >
              🗑
            </button>
          </div>
        ))}

      {changesFor && (
        <Modal title={`${changesFor.name} — recent changes`} onClose={() => setChangesFor(null)}>
          {changed.get(changesFor.id)?.map(({ unit, items }) => (
            <div key={unit.uid} className="mb">
              <div className="muted small" style={{ fontWeight: 600 }}>
                {unit.customName ? `${unit.customName} (${unit.name})` : unit.name}
              </div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                {items.map((item, i) => (
                  <li key={i}>{md(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}
