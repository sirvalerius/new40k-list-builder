import { useEffect, useRef, useState } from 'react';
import type { ArmyList, Rules } from '../lib/types';
import {
  deleteList,
  getAllLists,
  importLists,
} from '../lib/db';
import { download, unitTotal } from '../lib/helpers';

export function Home({
  rules,
  factionName,
  onNew,
  onOpen,
}: {
  rules: Rules;
  factionName: (id: string) => string;
  onNew: () => void;
  onOpen: (id: string) => void;
}) {
  const [lists, setLists] = useState<ArmyList[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLists(await getAllLists());
  }
  useEffect(() => {
    refresh();
  }, []);

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

      {lists === null && <div className="spin" />}
      {lists && lists.length === 0 && (
        <div className="empty">
          No saved lists yet.
          <br />
          Tap <b>New list</b> to start building.
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
            <button className="ghost small" onClick={() => onOpen(l.id)}>
              Open
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
    </div>
  );
}
