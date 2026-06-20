import type { ValidationResult } from '../lib/rules';

export function SummaryBar({ result }: { result: ValidationResult }) {
  const t = result.totals;
  const ptsBad = t.pointsLimit > 0 && t.points > t.pointsLimit;
  const dpBad = t.dpUsed > t.dpBudget;
  const enhBad = t.enhancementLimit > 0 && t.enhancementsUsed > t.enhancementLimit;
  return (
    <div className="summary">
      <div className="grid">
        <div className="metric">
          <div className={`v ${ptsBad ? 'bad' : ''}`}>
            {t.points}/{t.pointsLimit || '—'}
          </div>
          <div className="l">Points</div>
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
