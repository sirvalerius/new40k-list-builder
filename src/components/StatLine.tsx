import type { Stat } from '../lib/types';

export function StatLine({ stat }: { stat: Stat }) {
  const cells: Array<[string, string]> = [
    ['M', stat.M],
    ['T', stat.T],
    ['SV', stat.Sv],
    ['W', stat.W],
    ['LD', stat.Ld],
    ['OC', stat.OC],
  ];
  const inv = stat.inv_sv && stat.inv_sv !== '-' ? stat.inv_sv : '';
  return (
    <div className="statline">
      {cells.map(([k, val]) => (
        <span className="stat" key={k}>
          <b>{k}</b> {val || '-'}
        </span>
      ))}
      {inv && (
        <span className="stat">
          <b>INV</b> {inv}
        </span>
      )}
    </div>
  );
}
