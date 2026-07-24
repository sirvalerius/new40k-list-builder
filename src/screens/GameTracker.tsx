import { useEffect, useState } from 'react';
import { uid } from '../lib/helpers';

type SecondaryCard = { id: string; name: string; points: number };
type PlayerState = { name: string; cp: number; primaryVp: number; secondaries: SecondaryCard[] };
type TrackerState = { round: number; players: [PlayerState, PlayerState] };

const STORAGE_KEY = 'new40k-tracker-v1';

function emptyPlayer(name: string): PlayerState {
  return { name, cp: 0, primaryVp: 0, secondaries: [] };
}

function emptyState(): TrackerState {
  return { round: 1, players: [emptyPlayer('Player 1'), emptyPlayer('Player 2')] };
}

function loadState(): TrackerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (parsed?.players?.length === 2) return parsed as TrackerState;
  } catch {
    /* ignore corrupt storage */
  }
  return emptyState();
}

// TV-browser scoreboard: CP, primary VP and a per-player deck of secondary-mission cards
// (name + points, freely added/edited — the app has no official secondary card text/data,
// so this tracks whatever secondaries the players are actually playing that game).
export function GameTracker() {
  const [state, setState] = useState<TrackerState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function updatePlayer(i: 0 | 1, mut: (p: PlayerState) => PlayerState) {
    setState((s) => {
      const players = [...s.players] as [PlayerState, PlayerState];
      players[i] = mut(players[i]);
      return { ...s, players };
    });
  }

  function resetGame() {
    if (!confirm('Start a new game? This clears CP, VP and secondary decks for both players.')) return;
    setState((s) => ({
      round: 1,
      players: [emptyPlayer(s.players[0].name), emptyPlayer(s.players[1].name)],
    }));
  }

  return (
    <div className="tracker">
      <div className="tracker-round">
        <button
          className="ghost tracker-roundbtn"
          onClick={() => setState((s) => ({ ...s, round: Math.max(1, s.round - 1) }))}
        >
          −
        </button>
        <div className="tracker-roundlabel">
          Battle Round <b>{state.round}</b>
        </div>
        <button
          className="ghost tracker-roundbtn"
          onClick={() => setState((s) => ({ ...s, round: Math.min(5, s.round + 1) }))}
        >
          +
        </button>
        <button className="ghost small" onClick={resetGame} style={{ marginLeft: 'auto' }}>
          ⟲ New game
        </button>
      </div>

      <div className="tracker-players">
        {([0, 1] as const).map((i) => (
          <PlayerPanel key={i} player={state.players[i]} onChange={(mut) => updatePlayer(i, mut)} />
        ))}
      </div>
    </div>
  );
}

function PlayerPanel({
  player,
  onChange,
}: {
  player: PlayerState;
  onChange: (mut: (p: PlayerState) => PlayerState) => void;
}) {
  const secondaryVp = player.secondaries.reduce((s, c) => s + c.points, 0);
  const total = player.primaryVp + secondaryVp;

  function addSecondary() {
    onChange((p) => ({
      ...p,
      secondaries: [...p.secondaries, { id: uid(), name: 'New secondary', points: 0 }],
    }));
  }
  function updateSecondary(id: string, mut: (c: SecondaryCard) => SecondaryCard) {
    onChange((p) => ({ ...p, secondaries: p.secondaries.map((c) => (c.id === id ? mut(c) : c)) }));
  }
  function removeSecondary(id: string) {
    onChange((p) => ({ ...p, secondaries: p.secondaries.filter((c) => c.id !== id) }));
  }

  return (
    <div className="card tracker-player">
      <input
        className="tracker-name"
        value={player.name}
        onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))}
      />

      <div className="tracker-total">{total} <span className="tracker-total-label">VP</span></div>

      <div className="tracker-stat">
        <span className="tracker-stat-label">Command Points</span>
        <Stepper
          value={player.cp}
          onChange={(v) => onChange((p) => ({ ...p, cp: Math.max(0, v) }))}
        />
      </div>

      <div className="tracker-stat">
        <span className="tracker-stat-label">Primary VP</span>
        <Stepper
          value={player.primaryVp}
          step={5}
          onChange={(v) => onChange((p) => ({ ...p, primaryVp: Math.max(0, v) }))}
        />
      </div>

      <div className="tracker-secondaries">
        <div className="tracker-stat-label">
          Secondary missions <span className="muted">({secondaryVp} VP)</span>
        </div>
        {player.secondaries.map((c) => (
          <div className="tracker-card" key={c.id}>
            <input
              className="tracker-card-name"
              value={c.name}
              onChange={(e) => updateSecondary(c.id, (card) => ({ ...card, name: e.target.value }))}
            />
            <input
              className="tracker-card-points"
              type="number"
              inputMode="numeric"
              value={c.points}
              onChange={(e) =>
                updateSecondary(c.id, (card) => ({ ...card, points: Number(e.target.value) || 0 }))
              }
            />
            <button
              className="ghost small danger iconbtn"
              aria-label="Remove"
              onClick={() => removeSecondary(c.id)}
            >
              🗑
            </button>
          </div>
        ))}
        <button className="ghost small" onClick={addSecondary}>
          + Add secondary
        </button>
      </div>
    </div>
  );
}

function Stepper({
  value,
  step = 1,
  onChange,
}: {
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="tracker-stepper">
      <button className="ghost tracker-stepbtn" onClick={() => onChange(value - step)}>
        −
      </button>
      <span className="tracker-stepval">{value}</span>
      <button className="ghost tracker-stepbtn" onClick={() => onChange(value + step)}>
        +
      </button>
    </div>
  );
}
