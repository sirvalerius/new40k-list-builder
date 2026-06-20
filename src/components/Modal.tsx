import type { ReactNode } from 'react';

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row mb">
          <h2 style={{ flex: 1, margin: 0 }}>{title}</h2>
          <button className="ghost iconbtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
        {footer && <div className="mt">{footer}</div>}
      </div>
    </div>
  );
}
