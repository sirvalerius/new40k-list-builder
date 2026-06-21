// Loading placeholders that mirror the shape of the content they replace (product register
// prefers skeletons over a spinner in the middle of content). Shimmer respects reduced-motion
// via the global rule in index.css.

export function Skeleton({
  h = 14,
  w = '100%',
  r = 8,
}: {
  h?: number | string;
  w?: number | string;
  r?: number;
}) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r }} aria-hidden />;
}

/** A card-shaped placeholder (title + meta line), matching .list-tile / unit cards. */
export function SkeletonCard() {
  return (
    <div className="card" aria-hidden>
      <Skeleton h={17} w="55%" />
      <div style={{ height: 9 }} />
      <Skeleton h={11} w="38%" />
    </div>
  );
}

/** A run of skeleton cards with an accessible "loading" label for screen readers. */
export function SkeletonList({ count = 3, label = 'Loading…' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
