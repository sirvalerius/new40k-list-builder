import type { ValidationResult } from '../lib/rules';

export function ValidationBanner({ result }: { result: ValidationResult }) {
  if (result.violations.length === 0) {
    return <div className="banner ok">✓ List is legal for this battle size.</div>;
  }
  return (
    <div className="banner bad">
      {result.violations.map((v, i) => (
        <div className={`viol ${v.level}`} key={i}>
          <span className="dot" />
          <span>{v.message}</span>
        </div>
      ))}
    </div>
  );
}
