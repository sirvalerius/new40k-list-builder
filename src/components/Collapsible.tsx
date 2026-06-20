import { useState, type ReactNode } from 'react';

export function Collapsible({
  title,
  defaultOpen = false,
  right,
  children,
}: {
  title: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div
        className={`collapse-head ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="chev">▶</span>
        <span style={{ flex: 1 }}>{title}</span>
        {right}
      </div>
      {open && <div className="mt">{children}</div>}
    </div>
  );
}
