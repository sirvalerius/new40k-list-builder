import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  // Render at <body> so the fixed-position backdrop is relative to the viewport.
  // (A `backdrop-filter` ancestor — e.g. the topbar — would otherwise become the
  // containing block and push the modal off-centre / above the page.)
  return createPortal(
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
    </div>,
    document.body,
  );
}
