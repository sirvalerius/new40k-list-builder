import { useState } from 'react';
import type { FactionIndexEntry } from '../lib/types';
import type { Rules } from '../lib/types';
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
  const [step, setStep] = useState<1 | 2>(1);
  const [battleSizeId, setBattleSizeId] = useState<string>('');
  const [query, setQuery] = useState('');

  const sorted = [...factions].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase().trim()),
  );

  if (step === 1) {
    return (
      <div>
        <h2>Choose a battle size</h2>
        <div className="col">
          {rules.battle_sizes.map((b) => (
            <button
              key={b.id}
              className={`card tappable ${
                battleSizeId === b.id ? 'primary' : 'ghost'
              }`}
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
          <button className="ghost" onClick={onCancel}>
            Cancel
          </button>
          <div className="spacer" />
          <button
            className="primary"
            disabled={!battleSizeId}
            onClick={() => setStep(2)}
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

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
            className="card tappable ghost list-tile"
            style={{ textAlign: 'left', height: 'auto', padding: 12 }}
            onClick={() => onCreate(f.id, battleSizeId, `${f.name} list`)}
          >
            <div className="meta">
              <div className="name">{f.name}</div>
              <div className="muted small">
                {f.super_keywords.join(' · ')} · {f.unit_count} units ·{' '}
                {f.detachment_count} detachments
              </div>
            </div>
            <span aria-hidden>→</span>
          </button>
        ))}
        {filtered.length === 0 && <div className="empty">No match.</div>}
      </div>
      <div className="row mt">
        <button className="ghost" onClick={() => setStep(1)}>
          ← Back
        </button>
      </div>
    </div>
  );
}
