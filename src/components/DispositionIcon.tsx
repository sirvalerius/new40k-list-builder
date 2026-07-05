// Force Disposition badge: icon + text in the official card colors
// (green / red / blue / turquoise / yellow), tuned to stay legible on the dark theme.
export const DISPOSITIONS: Record<string, { icon: string; color: string; tagline: string }> = {
  'TAKE AND HOLD': { icon: '⚑', color: '#57b45f', tagline: 'Hold the most objective markers across the battlefield.' },
  'PURGE THE FOE': { icon: '☠', color: '#d05050', tagline: 'Destroy the enemy and dominate the battlefield through force.' },
  'DISRUPTION': { icon: '⚡', color: '#5b8fd9', tagline: 'Disrupt the enemy battle plan and deny them the field.' },
  'RECONNAISSANCE': { icon: '◉', color: '#3fc1b0', tagline: 'Scout the battlefield and seize key intelligence positions.' },
  'PRIORITY ASSETS': { icon: '◆', color: '#e0c23f', tagline: 'Capture and hold the high value assets scattered across the field.' },
};

export function DispositionIcon({ name, iconOnly }: { name: string; iconOnly?: boolean }) {
  const d = DISPOSITIONS[name.toUpperCase()];
  if (!d) return name ? <span>{name}</span> : null;
  return (
    <span className="disp" style={{ color: d.color }} title={name}>
      <span aria-hidden>{d.icon}</span>
      {!iconOnly && <span className="disp-name">{name}</span>}
    </span>
  );
}
