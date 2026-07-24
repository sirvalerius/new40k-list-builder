import { useEffect, useRef, useState } from 'react';
import type { FactionIndexEntry, Rules } from '../lib/types';
import { FactionIcon } from '../components/FactionIcon';
import { Collapsible } from '../components/Collapsible';
import { uid } from '../lib/helpers';

const STORAGE_KEY = 'new40k-tracker-v3';
const SECONDARY_CAP = 40; // core rule: secondary VP total is capped at 40, regardless of edition
const COLORS = ['#5b8fd9', '#d05050', '#57b45f', '#e0c23f', '#a05bd9', '#e05b8f', '#3fc1b0', '#d9853f'];

type LogEntry = { id: string; ts: number; text: string };
type SecondaryStatus = 'hand' | 'completed' | 'discarded';
type SecondaryCard = { id: string; cardName: string; status: SecondaryStatus; vp: number; drawnRound: number };
type PlayerState = {
  name: string;
  factionId: string;
  color: string;
  cp: number;
  primaryVp: number;
  deck: string[]; // shuffled remaining draw pool for this player's secondary deck
  secondaries: SecondaryCard[]; // every card ever drawn (hand / completed / discarded)
  discardedForCpRound: number; // last battle round this player used the discard-for-CP bonus (0 = never)
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
  return {
    name,
    factionId: '',
    color,
    cp: 0,
    primaryVp: 0,
    deck: [],
    secondaries: [],
    discardedForCpRound: 0,
  };
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

function shuffled(names: string[]): string[] {
  const a = [...names];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draws back up to a 2-card hand from this player's own shuffled deck (no reshuffle of
// completed/discarded cards — a deliberate simplification of the real reshuffle-on-discard
// rule, fine for a casual tracker since 18 cards comfortably covers a 5-round game).
function drawUpTo(p: PlayerState, round: number): { player: PlayerState; drawn: string[] } {
  const handCount = p.secondaries.filter((c) => c.status === 'hand').length;
  const need = Math.max(0, 2 - handCount);
  const names = p.deck.slice(0, need);
  const deck = p.deck.slice(need);
  const newCards: SecondaryCard[] = names.map((cardName) => ({
    id: uid(),
    cardName,
    status: 'hand',
    vp: 0,
    drawnRound: round,
  }));
  return { player: { ...p, deck, secondaries: [...p.secondaries, ...newCards] }, drawn: names };
}

function secondaryVp(p: PlayerState) {
  return p.secondaries.filter((c) => c.status === 'completed').reduce((s, c) => s + c.vp, 0);
}

function stripMd(text: string) {
  return text.replace(/\*\*/g, '');
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// TV-browser scoreboard, modeled on the user's old BattleForge Tracker: pregame player/
// faction/colour setup, then a live round-and-turn tracker with CP, Primary VP (uncapped —
// there's no universal per-mission ceiling, unlike the old app's flat "/45") and Secondary
// VP (capped at 40 total, the one number that actually is a fixed rule), plus a running
// game log. Each player draws their own Secondary Mission hand from the real Chapter Approved
// Defender deck (rules.secondaries, scraped from gdmissions.app) — 2 cards at game start, then
// auto-topped-up to 2 at the start of that player's own turn. A hand card can be discarded for
// +1 CP (Event Companion "Generating Command Points" rule — capped at once per battle round)
// or marked completed by picking which scoring tier was satisfied, which credits that tier's VP.
export function GameTracker({ rules, factions }: { rules: Rules; factions: FactionIndexEntry[] }) {
  const [state, setState] = useState<TrackerState>(loadState);
  const prevRef = useRef<TrackerState | null>(null);
  const [, forceTick] = useState(0);
  const catalog = rules.secondaries ?? [];

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
    const names = catalog.map((c) => c.name);
    setState((prev) => {
      prevRef.current = prev;
      const drawLogs: string[] = [];
      const players = prev.players.map((p) => {
        const { player, drawn } = drawUpTo({ ...p, deck: shuffled(names) }, 1);
        if (drawn.length) drawLogs.push(`${player.name} draws: ${drawn.join(', ')}.`);
        return player;
      }) as [PlayerState, PlayerState];
      const text = [`Game started — Round 1, ${players[0].name}'s turn.`, ...drawLogs].join(' ');
      return {
        ...prev,
        phase: 'live',
        round: 1,
        active: 0,
        startedAt: Date.now(),
        players,
        log: [...prev.log, { id: uid(), ts: Date.now(), text }],
      };
    });
  }

  function nextTurn() {
    setState((prev) => {
      prevRef.current = prev;
      const wrapping = prev.active === 1;
      const round = wrapping ? Math.min(5, prev.round + 1) : prev.round;
      const active: 0 | 1 = wrapping ? 0 : 1;
      const players = [...prev.players] as [PlayerState, PlayerState];
      const { player: drawnPlayer, drawn } = drawUpTo(
        { ...players[active], cp: players[active].cp + 1 },
        round,
      );
      players[active] = drawnPlayer;
      const parts = [
        wrapping
          ? `Round ${round} — ${drawnPlayer.name}'s turn begins.`
          : `${drawnPlayer.name}'s turn begins.`,
        `${drawnPlayer.name} gains +1 CP.`,
      ];
      if (drawn.length) parts.push(`${drawnPlayer.name} draws: ${drawn.join(', ')}.`);
      return {
        ...prev,
        round,
        active,
        players,
        log: [...prev.log, { id: uid(), ts: Date.now(), text: parts.join(' ') }],
      };
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
    return <SetupScreen state={state} factions={factions} onChange={setState} onStart={startGame} />;
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
            round={state.round}
            catalog={catalog}
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
  round,
  catalog,
  onChange,
}: {
  player: PlayerState;
  round: number;
  catalog: NonNullable<Rules['secondaries']>;
  onChange: (mut: (p: PlayerState) => PlayerState, logText?: string) => void;
}) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const rawSecVp = secondaryVp(player);
  const secVp = Math.min(SECONDARY_CAP, rawSecVp);
  const total = player.primaryVp + secVp;
  const hand = player.secondaries.filter((c) => c.status === 'hand');
  const history = [...player.secondaries.filter((c) => c.status !== 'hand')].reverse();
  const canDiscardForCp = player.discardedForCpRound !== round;

  function drawExtra() {
    const remaining = catalog.map((c) => c.name).filter((n) => !player.secondaries.some((c) => c.cardName === n));
    const name = remaining[Math.floor(Math.random() * remaining.length)];
    if (!name) return;
    onChange(
      (p) => ({
        ...p,
        deck: p.deck.filter((n) => n !== name),
        secondaries: [...p.secondaries, { id: uid(), cardName: name, status: 'hand', vp: 0, drawnRound: round }],
      }),
      `${player.name} draws an extra secondary: ${name}.`,
    );
  }

  function discardForCp(card: SecondaryCard) {
    onChange(
      (p) => ({
        ...p,
        cp: p.cp + 1,
        discardedForCpRound: round,
        secondaries: p.secondaries.map((c) => (c.id === card.id ? { ...c, status: 'discarded' } : c)),
      }),
      `${player.name} discards ${card.cardName} for +1 CP.`,
    );
  }

  function completeCard(card: SecondaryCard, vp: number, tierText: string) {
    onChange(
      (p) => ({
        ...p,
        secondaries: p.secondaries.map((c) => (c.id === card.id ? { ...c, status: 'completed', vp } : c)),
      }),
      `${player.name} completes ${card.cardName}: +${vp} VP (${stripMd(tierText)}).`,
    );
    setCompletingId(null);
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

        {hand.map((c) => {
          const card = catalog.find((sc) => sc.name === c.cardName);
          const allTiers = card?.sections.flatMap((s) => s.tiers.map((t) => ({ ...t, section: s }))) ?? [];
          return (
            <div className="tracker-card" key={c.id}>
              <div className="tracker-card-head">
                <span className="tracker-card-title">{c.cardName}</span>
                <span className="tiny muted">{card?.kindLabel}</span>
              </div>
              {card && (
                <Collapsible title={<span className="tiny muted">View full text</span>}>
                  <SecondaryCardText card={card} />
                </Collapsible>
              )}
              <div className="row wrap" style={{ gap: 6 }}>
                <button className="ghost small" onClick={() => setCompletingId(completingId === c.id ? null : c.id)}>
                  ✓ Mark completed
                </button>
                <button
                  className="ghost small"
                  disabled={!canDiscardForCp}
                  title={canDiscardForCp ? 'Discard this card to gain 1 CP' : 'Already used this round'}
                  onClick={() => discardForCp(c)}
                >
                  🗑 Discard (+1 CP)
                </button>
              </div>
              {completingId === c.id && (
                <div className="col tracker-tierpicker" style={{ gap: 4 }}>
                  <span className="tiny muted">Which was satisfied?</span>
                  {allTiers.map((t, i) => (
                    <button key={i} className="ghost small tracker-tierbtn" onClick={() => completeCard(c, t.vp, t.text)}>
                      <b>{t.vp} VP</b> — {stripMd(t.text)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {!!history.length && (
          <Collapsible title={<span className="tiny muted">History ({history.length})</span>}>
            <div className="col" style={{ gap: 4 }}>
              {history.map((c) => (
                <div key={c.id} className="tiny muted">
                  {c.status === 'completed' ? `✓ ${c.cardName} — +${c.vp} VP` : `🗑 ${c.cardName} — discarded`}
                </div>
              ))}
            </div>
          </Collapsible>
        )}

        <button className="ghost small" onClick={drawExtra}>
          + Draw extra secondary
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
