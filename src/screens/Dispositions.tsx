import { useEffect, useState } from 'react';
import type { FactionData, FactionIndexEntry } from '../lib/types';
import { loadFaction } from '../lib/data';
import { DispositionIcon } from '../components/DispositionIcon';
import { SkeletonList } from '../components/Skeleton';

// Per-faction detachment overview: every detachment with its DP cost and Force
// Disposition. Clicking the disposition opens the mission viewer pre-set to it.
export function Dispositions({
  factions,
  onOpenMissions,
}: {
  factions: FactionIndexEntry[];
  onOpenMissions: (disposition: string) => void;
}) {
  const sorted = [...factions].sort((a, b) => a.name.localeCompare(b.name));
  const [slug, setSlug] = useState(sorted[0]?.slug ?? '');
  const [sub, setSub] = useState(''); // Chapter filter ('' = any)
  const [fd, setFd] = useState<FactionData | null>(null);

  useEffect(() => {
    let alive = true;
    setFd(null);
    setSub('');
    if (slug) loadFaction(slug).then((d) => alive && setFd(d));
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <div>
      <div className="row mb" style={{ gap: 8, alignItems: 'center' }}>
        <span className="muted small">Faction:</span>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} style={{ flex: 1 }}>
          {sorted.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {fd && (fd.faction.sub_factions?.length ?? 0) > 0 && (
        <div className="row mb" style={{ gap: 8, alignItems: 'center' }}>
          <span className="muted small">Chapter:</span>
          <select value={sub} onChange={(e) => setSub(e.target.value)}>
            <option value="">Any / Codex</option>
            {fd.faction.sub_factions!.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {!fd ? (
        <SkeletonList count={4} label="Loading faction…" />
      ) : (
        <div className="wpn-scroll">
          <table className="wpn-table">
            <thead>
              <tr>
                <th className="wname">Detachment</th>
                <th>DP</th>
                <th>Disposition</th>
              </tr>
            </thead>
            <tbody>
              {fd.detachments
                // same Chapter rule as the builder: hide detachments bound to another Chapter
                .filter((d) => !d.boarding_actions && (!sub || !d.restricted_chapter || d.restricted_chapter === sub))
                .map((d) => (
                  <tr key={d.id}>
                    <td className="wname">{d.name}</td>
                    <td>{d.dp_cost || '?'}</td>
                    <td>
                      <button
                        className="ghost small"
                        onClick={() => onOpenMissions(d.force_disposition)}
                        title="Show missions for this disposition"
                      >
                        <DispositionIcon name={d.force_disposition} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
