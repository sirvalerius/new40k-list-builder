import { useState } from 'react';

/** A/B/C battlefield layout tabs for a Force Disposition matchup (images from the Event
 *  Companion PDF, see `layoutImages` in helpers.ts). */
export function LayoutPicker({ images }: { images: string[] }) {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <div className="row" style={{ gap: 6 }}>
        {images.map((_, i) => (
          <button
            key={i}
            className={tab === i ? 'primary small' : 'ghost small'}
            onClick={() => setTab(i)}
          >
            Layout {String.fromCharCode(65 + i)}
          </button>
        ))}
      </div>
      <img
        src={images[tab]}
        alt={`Layout ${String.fromCharCode(65 + tab)}`}
        style={{ width: '100%', maxWidth: 480, marginTop: 6, borderRadius: 4 }}
        loading="lazy"
      />
    </div>
  );
}
