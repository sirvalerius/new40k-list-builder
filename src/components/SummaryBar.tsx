import { useState } from 'react';
import type { ValidationResult } from '../lib/rules';

export function SummaryBar({ result }: { result: ValidationResult }) {
  const t = result.totals;
  const ptsBad = t.pointsLimit > 0 && t.points > t.pointsLimit;
  const dpBad = t.dpUsed > t.dpBudget;
  const enhBad = t.enhancementLimit > 0 && t.enhancementsUsed > t.enhancementLimit;
  // Tap the points metric to flip it to "points left to spend" — red stays tied to
  // actually being over budget (ptsBad), not to the displayed number's sign.
  const [showRemaining, setShowRemaining] = useState(false);
  return (
    <div className="summary">
      <div className="grid">
        <div
          className="metric tappable"
          onClick={() => setShowRemaining((v) => !v)}
          role="button"
          aria-label={showRemaining ? 'Show points spent / limit' : 'Show points remaining'}
          style={{ cursor: 'pointer' }}
        >
          <div className={`v ${ptsBad ? 'bad' : ''}`}>
            {showRemaining ? (t.pointsLimit ? t.pointsLimit - t.points : '—') : (
              <>{t.points}/{t.pointsLimit || '—'}</>
            )}
          </div>
          <div className="l">{showRemaining ? 'Remaining' : 'Points'}</div>
        </div>
        <div className="metric">
          <div className={`v ${dpBad ? 'bad' : ''}`}>
            {t.dpUsed}/{t.dpBudget}
          </div>
          <div className="l">Det. Pts</div>
        </div>
        <div className="metric">
          <div className={`v ${enhBad ? 'bad' : result.ok ? 'ok' : ''}`}>
            {result.ok ? '✓' : '!'} {t.enhancementsUsed}/{t.enhancementLimit}
          </div>
          <div className="l">{result.ok ? 'Legal · Enh' : 'Issues · Enh'}</div>
        </div>
      </div>
    </div>
  );
}
