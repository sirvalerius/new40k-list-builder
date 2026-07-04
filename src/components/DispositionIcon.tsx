// Force Disposition badge: color-coded icon + text, used wherever a disposition appears.
// ponytail: colors are our own coding (the official card colors aren't in the PDFs);
// swap the hex values here if someone checks the physical deck.
export const DISPOSITIONS: Record<string, { icon: string; color: string; tagline: string }> = {
  'TAKE AND HOLD': { icon: '⚑', color: '#c9a43a', tagline: 'Hold the most objective markers across the battlefield.' },
  'PURGE THE FOE': { icon: '☠', color: '#c14444', tagline: 'Destroy the enemy and dominate the battlefield through force.' },
  'DISRUPTION': { icon: '⚡', color: '#9d6bce', tagline: 'Disrupt the enemy battle plan and deny them the field.' },
  'RECONNAISSANCE': { icon: '◉', color: '#5aa860', tagline: 'Scout the battlefield and seize key intelligence positions.' },
  'PRIORITY ASSETS': { icon: '◆', color: '#4a90d9', tagline: 'Capture and hold the high value assets scattered across the field.' },
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
