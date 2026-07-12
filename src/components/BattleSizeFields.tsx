import type { Rules } from '../lib/types';
import { intOf } from '../lib/helpers';

// "Max points" (free-typed, snaps to the closest preset) + the battle-size picker — shared
// between NewListWizard (creation) and Builder's list-settings edit modal, so the two can't
// drift out of sync with each other (e.g. one offering the points field, the other not).
export function BattleSizeFields({
  rules,
  maxPoints,
  battleSizeId,
  onMaxPoints,
  onBattleSize,
}: {
  rules: Rules;
  maxPoints: number;
  battleSizeId: string;
  onMaxPoints: (points: number) => void;
  onBattleSize: (id: string) => void;
}) {
  return (
    <>
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
            onClick={() => onBattleSize(b.id)}
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
    </>
  );
}
