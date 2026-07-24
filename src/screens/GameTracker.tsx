import { useEffect, useRef, useState } from 'react';
import type { FactionIndexEntry, Rules } from '../lib/types';
import { FactionIcon } from '../components/FactionIcon';
import { Collapsible } from '../components/Collapsible';
import { uid } from '../lib/helpers';

const STORAGE_KEY = 'new40k-tracker-v2';
const SECONDARY_CAP = 40; // core rule: secondary VP total is capped at 40, regardless of edition
const COLORS = ['#5b8fd9', '#d05050', '#57b45f', '#e0c23f', '#a05bd9', '#e05b8f', '#3fc1b0', '#d9853f'];

type LogEntry = { id: string; ts: number; text: string };
type SecondaryCard = { id: string; cardName: string; vp: number };
type PlayerState = {
  name: string;
  factionId: string;
  color: string;
  cp: number;
  primaryVp: number;
  secondaries: SecondaryCard[];
};
type TrackerState = {
  phase: 'setup' | 'live';
  round: number;
  active: 0 | 1;
  startedAt: number;
  log: LogEntry[];
  players: [PlayerState, PlayerState];
};

function emptyPlayer(name: string, color: string): PlayerState {
  return { name, factionId: '', color, cp: 0, primaryVp: 0, secondaries: [] };
}
function emptyState(): TrackerState {
  return {
    phase: 'setup',
    round: 1,
    active: 0,
    startedAt: Date.now(),
    log: [],
    players: [emptyPlayer('Player 1', COLORS[0]), emptyPlayer('Player 2', COLORS[1])],
  };
}
function loadState(): TrackerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.players?.length === 2) return parsed as TrackerState;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return emptyState();
}

function secondaryVp(p: PlayerState) {
  return p.secondaries.reduce((s, c) => s + c.vp, 0);
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// TV-browser scoreboard, modeled on the user's old BattleForge Tracker: pregame player/
// faction/colour setup, then a live round-and-turn tracker with CP, Primary VP (uncapped —
// there's no universal per-mission ceiling, unlike the old app's flat "/45") and Secondary
// VP (capped at 40 total, the one number that actually is a fixed rule), plus a running
// game log. Secondary "cards" are picked from the real Chapter Approved Defender deck
// (rules.secondaries) when the data's loaded, so the name/VP tiers shown are genuine card text.
export function GameTracker({ rules, factions }: { rules: Rules; factions: FactionIndexEntry[] }) {
  const [state, setState] = useState<TrackerState>(loadState);
  const prevRef = useRef<TrackerState | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.phase !== 'live') return;
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [state.phase]);

  function commit(next: TrackerState | ((s: TrackerState) => TrackerState), logText?: string) {
    setState((prev) => {
      prevRef.current = prev;
      const n = typeof next === 'function' ? next(prev) : next;
      return logText ? { ...n, log: [...n.log, { id: uid(), ts: Date.now(), text: logText }] } : n;
    });
  }

  function undo() {
    if (prevRef.current) {
      setState(prevRef.current);
      prevRef.current = null;
    }
  }

  function startGame() {
    commit(
      (s) => ({ ...s, phase: 'live', round: 1, active: 0, startedAt: Date.now() }),
      `Game started — Round 1, ${state.players[0].name}'s turn.`,
    );
  }

  function nextTurn() {
    setState((prev) => {
      prevRef.current = prev;
      const wrapping = prev.active === 1;
      const round = wrapping ? Math.min(5, prev.round + 1) : prev.round;
      const active: 0 | 1 = wrapping ? 0 : 1;
      const players = [...prev.players] as [PlayerState, PlayerState];
      players[active] = { ...players[active], cp: players[active].cp + 1 };
      const text = wrapping
        ? `Round ${round} — ${players[active].name}'s turn begins. ${players[active].name} gains +1 CP.`
        : `${players[active].name}'s turn begins. ${players[active].name} gains +1 CP.`;
      return { ...prev, round, active, players, log: [...prev.log, { id: uid(), ts: Date.now(), text }] };
    });
  }

  function resetGame() {
    if (!confirm('Start a new game? This clears the board for both players.')) return;
    setState(emptyState());
    prevRef.current = null;
  }

  function updatePlayer(i: 0 | 1, mut: (p: PlayerState) => PlayerState, logText?: string) {
    commit((s) => {
      const players = [...s.players] as [PlayerState, PlayerState];
      players[i] = mut(players[i]);
      return { ...s, players };
    }, logText);
  }

  if (state.phase === 'setup') {
    return (
      <SetupScreen
        state={state}
        factions={factions}
        onChange={setState}
        onStart={startGame}
      />
    );
  }

  return (
    <div className="tracker">
      <div className="tracker-topbar">
        <div className="tracker-rounds">
          {[1, 2, 3, 4, 5].map((r) => (
            <span key={r} className={`tracker-roundchip ${r === state.round ? 'active' : ''}`}>
              {r}
            </span>
          ))}
          <span className="muted tiny">RND</span>
        </div>
        <div className="tracker-clock">
          <span className="muted small">{formatElapsed(Date.now() - state.startedAt)}</span>
          <span className="tracker-activebadge" style={{ background: state.players[state.active].color }}>
            {state.players[state.active].name}
          </span>
        </div>
      </div>

      <div className="row" style={{ gap: 8 }}>
        <button className="ghost" onClick={resetGame} title="Reset game">
          ⟲
        </button>
        <button className="ghost" onClick={undo} disabled={!prevRef.current} title="Undo last action">
          ↶
        </button>
        <button className="primary tracker-nextturn" onClick={nextTurn}>
          Next Turn ›
        </button>
      </div>

      <Collapsible title={`Game Log (${state.log.length})`}>
        <div className="tracker-log">
          {[...state.log].reverse().map((e) => (
            <div key={e.id} className="tracker-logrow">
              <span className="muted tiny">{new Date(e.ts).toLocaleTimeString()}</span> {e.text}
            </div>
          ))}
          {!state.log.length && <div className="muted small">No events yet.</div>}
        </div>
      </Collapsible>

      <div className="tracker-players">
        {([0, 1] as const).map((i) => (
          <PlayerPanel
            key={i}
            player={state.players[i]}
            rules={rules}
            onChange={(mut, logText) => updatePlayer(i, mut, logText)}
          />
        ))}
      </div>
    </div>
  );
}

function SetupScreen({
  state,
  factions,
  onChange,
  onStart,
}: {
  state: TrackerState;
  factions: FactionIndexEntry[];
  onChange: (s: TrackerState) => void;
  onStart: () => void;
}) {
  function updatePlayer(i: 0 | 1, mut: (p: PlayerState) => PlayerState) {
    const players = [...state.players] as [PlayerState, PlayerState];
    players[i] = mut(players[i]);
    onChange({ ...state, players });
  }

  return (
    <div className="tracker">
      <h3 className="muted">Game Tracker — Setup</h3>
      <div className="tracker-players">
        {([0, 1] as const).map((i) => (
          <div className="card tracker-setup-player" key={i}>
            <div className="row wrap" style={{ gap: 6 }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  className="tracker-swatch"
                  aria-label={c}
                  style={{
                    background: c,
                    outline: state.players[i].color === c ? '2px solid var(--text)' : 'none',
                  }}
                  onClick={() => updatePlayer(i, (p) => ({ ...p, color: c }))}
                />
              ))}
            </div>
            <input
              className="tracker-name"
              value={state.players[i].name}
              onChange={(e) => updatePlayer(i, (p) => ({ ...p, name: e.target.value }))}
            />
            <select
              value={state.players[i].factionId}
              onChange={(e) => updatePlayer(i, (p) => ({ ...p, factionId: e.target.value }))}
            >
              <option value="">— Select Faction —</option>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {state.players[i].factionId && (
              <FactionIcon
                id={state.players[i].factionId}
                name={factions.find((f) => f.id === state.players[i].factionId)?.name}
              />
            )}
          </div>
        ))}
      </div>
      <button className="primary" style={{ width: '100%' }} onClick={onStart}>
        Deploy Forces
      </button>
    </div>
  );
}

function PlayerPanel({
  player,
  rules,
  onChange,
}: {
  player: PlayerState;
  rules: Rules;
  onChange: (mut: (p: PlayerState) => PlayerState, logText?: string) => void;
}) {
  const secVp = Math.min(SECONDARY_CAP, secondaryVp(player));
  const rawSecVp = secondaryVp(player);
  const total = player.primaryVp + secVp;
  const secondaryCatalog = rules.secondaries ?? [];

  function addSecondary() {
    const first = secondaryCatalog[0]?.name ?? 'Secondary';
    onChange(
      (p) => ({ ...p, secondaries: [...p.secondaries, { id: uid(), cardName: first, vp: 0 }] }),
      `${player.name} draws a secondary: ${first}.`,
    );
  }
  function updateSecondary(id: string, mut: (c: SecondaryCard) => SecondaryCard) {
    onChange((p) => ({
      ...p,
      secondaries: p.secondaries.map((c) => (c.id === id ? mut(c) : c)),
    }));
  }
  function removeSecondary(id: string) {
    onChange((p) => ({ ...p, secondaries: p.secondaries.filter((c) => c.id !== id) }));
  }

  return (
    <div className="card tracker-player" style={{ borderColor: player.color }}>
      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        <span className="tracker-swatch-sm" style={{ background: player.color }} />
        <span className="tracker-playername">{player.name}</span>
        {player.factionId && <FactionIcon id={player.factionId} iconOnly />}
      </div>

      <div className="tracker-total">
        {total} <span className="tracker-total-label">VP</span>
      </div>

      <div className="tracker-stat">
        <span className="tracker-stat-label">Command Points</span>
        <Stepper
          value={player.cp}
          onChange={(v, d) => onChange((p) => ({ ...p, cp: Math.max(0, v) }), `${player.name}: CP ${d > 0 ? '+' : ''}${d}.`)}
        />
      </div>

      <div className="tracker-stat">
        <span className="tracker-stat-label">Primary VP</span>
        <Stepper
          value={player.primaryVp}
          onChange={(v, d) =>
            onChange((p) => ({ ...p, primaryVp: Math.max(0, v) }), `${player.name}: Primary VP ${d > 0 ? '+' : ''}${d}.`)
          }
        />
      </div>

      <div className="tracker-secondaries">
        <div className="tracker-stat-label">
          Secondary missions{' '}
          <span className="muted">
            ({rawSecVp}{rawSecVp > SECONDARY_CAP ? ` → capped ${SECONDARY_CAP}` : ` / ${SECONDARY_CAP}`})
          </span>
        </div>
        {player.secondaries.map((c) => {
          const card = secondaryCatalog.find((sc) => sc.name === c.cardName);
          return (
            <div className="tracker-card" key={c.id}>
              <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                {secondaryCatalog.length ? (
                  <select
                    className="tracker-card-name"
                    value={c.cardName}
                    onChange={(e) => updateSecondary(c.id, (card) => ({ ...card, cardName: e.target.value }))}
                  >
                    {secondaryCatalog.map((sc) => (
                      <option key={sc.name} value={sc.name}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="tracker-card-name"
                    value={c.cardName}
                    onChange={(e) => updateSecondary(c.id, (card) => ({ ...card, cardName: e.target.value }))}
                  />
                )}
                <input
                  className="tracker-card-points"
                  type="number"
                  inputMode="numeric"
                  value={c.vp}
                  onChange={(e) => updateSecondary(c.id, (card) => ({ ...card, vp: Number(e.target.value) || 0 }))}
                />
                <button className="ghost small danger iconbtn" aria-label="Remove" onClick={() => removeSecondary(c.id)}>
                  🗑
                </button>
              </div>
              {card && (
                <Collapsible title={<span className="tiny muted">{card.kindLabel}</span>}>
                  <SecondaryCardText card={card} />
                </Collapsible>
              )}
            </div>
          );
        })}
        <button className="ghost small" onClick={addSecondary}>
          + Add secondary
        </button>
      </div>
    </div>
  );
}

function md(text: string) {
  return text.split(/\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>));
}

function SecondaryCardText({ card }: { card: NonNullable<Rules['secondaries']>[number] }) {
  return (
    <div className="col small" style={{ gap: 6 }}>
      {card.whenDrawn && <div className="muted">{md(card.whenDrawn)}</div>}
      {card.sections.map((s, i) => (
        <div key={i}>
          <div style={{ fontWeight: 700 }}>
            {s.when} <span className="muted tiny">· {s.chip}</span>
          </div>
          <div className="muted tiny mb">{s.trigger}</div>
          {s.tiers.map((t, j) => (
            <div key={j} className="row" style={{ gap: 8, alignItems: 'baseline' }}>
              <b style={{ whiteSpace: 'nowrap' }}>{t.vp} VP</b>
              <span>{md(t.text)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number, delta: number) => void }) {
  return (
    <div className="tracker-stepper">
      <button className="ghost tracker-stepbtn" onClick={() => onChange(value - 1, -1)}>
        −
      </button>
      <span className="tracker-stepval">{value}</span>
      <button className="ghost tracker-stepbtn" onClick={() => onChange(value + 1, 1)}>
        +
      </button>
    </div>
  );
}
