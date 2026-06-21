import { useState } from 'react';
import type { FactionIndexEntry, Rules } from '../lib/types';
import { intOf } from '../lib/helpers';

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
  // Battle size whose points are closest to a given max-points target.
  const closestBs = (pts: number) =>
    [...rules.battle_sizes].sort(
      (a, b) => Math.abs(intOf(a.points) - pts) - Math.abs(intOf(b.points) - pts),
    )[0]?.id ?? '';

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [maxPoints, setMaxPoints] = useState(2000);
  const [battleSizeId, setBattleSizeId] = useState<string>(() => closestBs(2000));
  const [query, setQuery] = useState('');
  const [factionId, setFactionId] = useState('');

  // Editing max points pre-selects the matching battle size (the user can still override).
  function onMaxPoints(v: number) {
    setMaxPoints(v);
    setBattleSizeId(closestBs(v));
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

        <label className="field-label">Max points</label>
        <input
          type="number"
          inputMode="numeric"
          min={250}
          max={5000}
          step={50}
          value={maxPoints}
          onChange={(e) => onMaxPoints(intOf(e.target.value))}
          className="mb"
        />

        <h3 className="muted">Battle size</h3>
        <div className="col">
          {rules.battle_sizes.map((b) => (
            <button
              key={b.id}
              className={`card tappable ${battleSizeId === b.id ? 'primary' : 'ghost'}`}
              style={{ textAlign: 'left', display: 'block', height: 'auto', padding: 14 }}
              onClick={() => {
                setBattleSizeId(b.id);
                setMaxPoints(intOf(b.points));
              }}
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
          <button
            key={f.id}
            className={`card tappable list-tile ${factionId === f.id ? 'det-selected' : 'ghost'}`}
            style={{ textAlign: 'left', height: 'auto', padding: 12 }}
            onClick={() => setFactionId(f.id)}
          >
            <div className="meta">
              <div className="name">{f.name}</div>
              <div className="muted small">
                {f.super_keywords.join(' · ')} · {f.unit_count} units ·{' '}
                {f.detachment_count} detachments
              </div>
            </div>
            <span aria-hidden>{factionId === f.id ? '✓' : '→'}</span>
          </button>
        ))}
        {filtered.length === 0 && <div className="empty">No match.</div>}
      </div>
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
