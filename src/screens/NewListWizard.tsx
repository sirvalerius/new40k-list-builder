import { Fragment, useState } from 'react';
import type { ChangelogEntry, FactionIndexEntry, Rules } from '../lib/types';
import { closestBattleSize, intOf, isRecentChange } from '../lib/helpers';
import { BattleSizeFields } from '../components/BattleSizeFields';
import { Modal } from '../components/Modal';
import { loadFaction } from '../lib/data';

// **bold** spans in changelog text → <b> (same convention as MissionCard's `md`).
function md(text: string) {
  return text.split(/\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));
}

export function NewListWizard({
  rules,
  factions,
  onCreate,
  onCancel,
}: {
  rules: Rules;
  factions: FactionIndexEntry[];
  onCreate: (factionId: string, battleSizeId: string, name: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [maxPoints, setMaxPoints] = useState(2000);
  const [battleSizeId, setBattleSizeId] = useState<string>(() => closestBattleSize(rules, 2000));
  const [query, setQuery] = useState('');
  const [factionId, setFactionId] = useState('');
  const [changelogFor, setChangelogFor] = useState<FactionIndexEntry | null>(null);
  const [changelog, setChangelog] = useState<ChangelogEntry[] | null>(null);

  function openChangelog(f: FactionIndexEntry) {
    setChangelogFor(f);
    setChangelog(null);
    loadFaction(f.slug).then((fd) => setChangelog(fd.faction.changelog ?? []));
  }

  // Editing max points pre-selects the matching battle size (the user can still override).
  function onMaxPoints(v: number) {
    setMaxPoints(v);
    setBattleSizeId(closestBattleSize(rules, v));
  }
  // Picking a battle size directly sets max points to match, so the field never contradicts it.
  function onBattleSize(id: string) {
    setBattleSizeId(id);
    const b = rules.battle_sizes.find((x) => x.id === id);
    if (b) setMaxPoints(intOf(b.points));
  }

  const sorted = [...factions].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase().trim()),
  );

  if (step === 1) {
    return (
      <div>
        <h2>New list</h2>

        <label className="field-label">List name</label>
        <input
          placeholder="e.g. Crusade of the Emperor's Wrath"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb"
        />

        <BattleSizeFields
          rules={rules}
          maxPoints={maxPoints}
          battleSizeId={battleSizeId}
          onMaxPoints={onMaxPoints}
          onBattleSize={onBattleSize}
        />

        <div className="row mt">
          <button className="ghost" onClick={onCancel}>
            Cancel
          </button>
          <div className="spacer" />
          <button className="primary" disabled={!battleSizeId} onClick={() => setStep(2)}>
            Next →
          </button>
        </div>
      </div>
    );
  }

  const create = () => {
    if (!factionId) return;
    const fname = factions.find((f) => f.id === factionId)?.name ?? 'New';
    onCreate(factionId, battleSizeId, name.trim() || `${fname} list`);
  };

  return (
    <div>
      <h2>Choose a faction</h2>
      <input
        placeholder="Search faction…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb"
      />
      <div className="col" style={{ gap: 8 }}>
        {filtered.map((f) => (
          <div
            key={f.id}
            className={`card list-tile ${factionId === f.id ? 'det-selected' : 'ghost'}`}
            style={{ padding: 12 }}
          >
            <div
              className="meta tappable"
              style={{ cursor: 'pointer' }}
              onClick={() => setFactionId(f.id)}
            >
              <div className="name">{f.name}</div>
              <div className="muted small">
                {f.super_keywords.join(' · ')} · {f.unit_count} units ·{' '}
                {f.detachment_count} detachments
                {f.changelog_last_update && ` · updated ${f.changelog_last_update}`}
              </div>
            </div>
            {isRecentChange(f.changelog_last_update) && (
              <button
                className="ghost small iconbtn"
                onClick={() => openChangelog(f)}
                aria-label={`Recent changes for ${f.name}`}
                title="Recent changes (last 30 days)"
              >
                🆕
              </button>
            )}
            <span aria-hidden onClick={() => setFactionId(f.id)} style={{ cursor: 'pointer' }}>
              {factionId === f.id ? '✓' : '→'}
            </span>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty">No match.</div>}
      </div>

      {changelogFor && (
        <Modal title={`${changelogFor.name} — recent changes`} onClose={() => setChangelogFor(null)}>
          {changelog === null && <div className="muted">Loading…</div>}
          {changelog && changelog.length === 0 && (
            <div className="muted">No changelog recorded for this faction.</div>
          )}
          {changelog?.map((entry) => (
            <div key={entry.date} className="mb">
              <div className="muted small" style={{ fontWeight: 600 }}>
                {entry.date}
              </div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                {entry.items.map((item, i) => (
                  <li key={i}>{md(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </Modal>
      )}
      <div className="row mt">
        <button className="ghost" onClick={() => setStep(1)}>
          ← Back
        </button>
        <div className="spacer" />
        <button className="primary" disabled={!factionId} onClick={create}>
          Create
        </button>
      </div>
    </div>
  );
}
