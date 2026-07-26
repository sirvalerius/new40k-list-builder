import { useEffect, useRef, useState } from 'react';
import type { FactionIndexEntry, Mission, MissionTier, Rules, SecondaryMission } from '../lib/types';
import { FactionIcon } from '../components/FactionIcon';
import { DISPOSITIONS, DispositionIcon } from '../components/DispositionIcon';
import { Collapsible } from '../components/Collapsible';
import { MissionCard } from '../components/MissionCard';
import { missionMatchup, uid } from '../lib/helpers';
import {
  GAME_CAP,
  MAX_ROUND,
  emptyState,
  startGame as startGameState,
  nextTurn as nextTurnState,
  addRoundVp,
  totalVp,
  finalScore,
  winner,
  formatElapsed,
  reshuffleEligible,
  reshuffleCard as reshuffleCardState,
  sectionAppliesAtRound,
  type PlayerState,
  type SecondaryCard,
  type TrackerState,
} from '../lib/tracker';

// Bumped whenever PlayerState's shape changes — old-shaped saved data must be discarded
// rather than loaded as-is, since the code no longer matches its fields (e.g. v5 stored a
// flat primaryVp number; v6 replaced it with primaryVpByRound, so loading a v5 save here
// would crash the first time something called .reduce() on the now-missing array).
const STORAGE_KEY = 'new40k-tracker-v6';
const COLORS = ['#5b8fd9', '#d05050', '#57b45f', '#e0c23f', '#a05bd9', '#e05b8f', '#3fc1b0', '#d9853f'];

// Bumping STORAGE_KEY on every shape change is easy to forget (it was, once already) — this
// checks the fields that actually matter so a stale/mismatched save falls back to a fresh
// game instead of crashing the app the first time something reads a missing array.
function isValidPlayer(p: unknown): p is PlayerState {
  const player = p as Partial<PlayerState> | null;
  return (
    !!player &&
    Array.isArray(player.primaryVpByRound) &&
    Array.isArray(player.secondaryVpByRound) &&
    Array.isArray(player.secondaries)
  );
}

function loadState(): TrackerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.players?.length === 2 && parsed.players.every(isValidPlayer)) {
        return parsed as TrackerState;
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return emptyState([COLORS[0], COLORS[1]]);
}

function stripMd(text: string) {
  return text.replace(/\*\*/g, '');
}

// TV-browser scoreboard, modeled on the user's old BattleForge Tracker: pregame player/
// faction/colour setup, a Round 0 for deployment/pre-battle actions (timed, but no CP or
// secondary draws — those only start with Round 1), then a live round-and-turn tracker.
// The CP/VP rules are implemented in ../lib/tracker.ts (and unit tested there); see that
// file's comments for the exact source text each rule comes from. In short:
//
// - Core CP: both players gain it every turn (not just whoever's turn it is), per Core
//   Rules 08.02. Bonus CP (anything else, including discarding a Secondary Mission) is
//   capped at +1/player/battle round by the Event Companion, and discarding for it is only
//   offered on that player's own turn ("if it is your turn", Chapter Approved deck rules).
// - Primary and Secondary VP are each capped at 15/battle round and 45 for the whole game
//   (Event Companion's VP source table). Each player stores one VP number PER ROUND per
//   source (PlayerState.primaryVpByRound / secondaryVpByRound) instead of one running total —
//   every write (manual stepper, a scored secondary card, a Primary tier) goes through
//   addRoundVp, which clamps that round's slot to [0,15] immediately. So the cap can't be
//   quietly bypassed by not noticing a side note: the number on screen for "this round" is
//   always the actual legal value, and the whole-game total is just those (already-capped)
//   per-round numbers summed and capped again at 45.
// - Secondary Missions are drawn from the real Chapter Approved Defender deck
//   (rules.secondaries) — 2 fresh cards at the start of every one of a player's own turns,
//   added to whatever's already active for them (the rule never caps the hand at 2, so
//   neither does this — it can grow past 2 over the course of a game). Scoring a hand card
//   walks through its actual card text: sections marked `or` are mutually exclusive (pick
//   one), sections with a `cumulative` tier let you tick every condition that applies and
//   sums them, and a lone tier with a `cap` is a per-unit count capped at that section's max.
// - A manual Secondary VP counter is also available for players using physical cards
//   instead of the digital deck.
// - If both players pick a Force Disposition in setup, each one's Primary Mission is
//   resolved the same way Missions.tsx/BunkerMode.tsx do (missionMatchup) and shown with
//   the same kind of scoring helper as secondaries: every section's tiers are clickable
//   (or, for `perUnit` tiers, a count input), adding straight into the Primary VP counter —
//   unlike secondaries this is additive and repeatable, since a Primary Mission is never
//   "completed", it scores again every qualifying round.
//
// Layout: this screen targets a TV/desktop browser, not mobile, so past a wide breakpoint
// each player's card splits into a stats column and a secondaries column side by side
// instead of stacking everything vertically (see .tracker-player in index.css).
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

  function undo() {
    if (prevRef.current) {
      setState(prevRef.current);
      prevRef.current = null;
    }
  }

  function startGame() {
    prevRef.current = state;
    setState(startGameState(state));
  }

  function nextTurn() {
    prevRef.current = state;
    setState((prev) => nextTurnState(prev, catalog.map((c) => c.name)));
  }

  function resetGame() {
    if (!confirm('Start a new game? This clears the board for both players.')) return;
    setState(emptyState([state.players[0].color, state.players[1].color]));
    prevRef.current = null;
  }

  function updatePlayer(i: 0 | 1, mut: (p: PlayerState) => PlayerState, logText?: string) {
    prevRef.current = state;
    setState((prev) => {
      const players = [...prev.players] as [PlayerState, PlayerState];
      players[i] = mut(players[i]);
      const log = logText ? [...prev.log, { id: uid(), ts: Date.now(), text: logText }] : prev.log;
      return { ...prev, players, log };
    });
  }

  if (state.phase === 'setup') {
    return <SetupScreen state={state} factions={factions} onChange={setState} onStart={startGame} />;
  }

  const deploying = state.round === 0;
  const ended = state.phase === 'ended';

  return (
    <div className="tracker">
      <div className="tracker-topbar">
        <div className="tracker-rounds">
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <span key={r} className={`tracker-roundchip ${r === state.round ? 'active' : ''}`}>
              {r}
            </span>
          ))}
          <span className="muted tiny">RND</span>
        </div>
        <div className="tracker-clock">
          <span className="muted tiny">{formatElapsed(Date.now() - state.startedAt)} total</span>
          {!ended && <span className="tracker-turnclock">{formatElapsed(Date.now() - state.turnStartedAt)}</span>}
          {ended ? (
            <span className="tracker-activebadge tracker-deploy">Battle Ended</span>
          ) : deploying ? (
            <span className="tracker-activebadge tracker-deploy">Deployment</span>
          ) : (
            <span className="tracker-activebadge" style={{ background: state.players[state.active].color }}>
              {state.players[state.active].name}
            </span>
          )}
        </div>
      </div>

      <div className="row" style={{ gap: 8 }}>
        <button className="ghost" onClick={resetGame} title="Reset game">
          ⟲
        </button>
        <button className="ghost" onClick={undo} disabled={!prevRef.current} title="Undo last action">
          ↶
        </button>
        {!ended && (
          <button className="primary tracker-nextturn" onClick={nextTurn}>
            {deploying ? 'Begin Battle ›' : 'Next Turn ›'}
          </button>
        )}
      </div>

      {ended && <VictorBanner players={state.players} />}

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
        {([0, 1] as const).map((i) => {
          const opponent = state.players[i === 0 ? 1 : 0];
          const myMissionName =
            state.players[i].disposition && opponent.disposition
              ? missionMatchup(rules, state.players[i].disposition, opponent.disposition)?.my
              : undefined;
          const mission = rules.missions?.find((m) => m.name === myMissionName);
          return (
            // Container query wrapper: each player's card splits into a stats/secondaries
            // side-by-side layout based on its OWN rendered width, not the page's — with two
            // players sharing the viewport a plain width media query fires far too early
            // (checking the whole page's width, not this card's half of it) and the two
            // internal columns end up squeezed and overlapping.
            <div className="tracker-player-slot" key={i}>
              <PlayerPanel
                player={state.players[i]}
                round={state.round}
                isActive={!deploying && state.active === i}
                catalog={catalog}
                mission={mission}
                onChange={(mut, logText) => updatePlayer(i, mut, logText)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// "At the end of the battle, the player with the most VP is the victor. If the players are
// tied, the battle is a draw" (Event Companion, DETERMINE VICTOR) — doesn't account for the
// Battle Ready Army painted-force bonus, which isn't tracked here.
function VictorBanner({ players }: { players: [PlayerState, PlayerState] }) {
  const scores: [number, number] = [finalScore(players[0]), finalScore(players[1])];
  const result = winner(players);
  return (
    <div className="card tracker-victor">
      <div className="tracker-victor-title">
        {result === 'draw' ? 'Draw' : `${players[result].name} wins!`}
      </div>
      <div className="row wrap" style={{ gap: 24 }}>
        {([0, 1] as const).map((i) => (
          <div key={i} className="row" style={{ gap: 6, alignItems: 'baseline' }}>
            <span className="tracker-swatch-sm" style={{ background: players[i].color }} />
            <span>{players[i].name}</span>
            <b className="tracker-victor-score">{scores[i]}</b>
            <span className="muted tiny">VP</span>
          </div>
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
  // Takes an updater (not a plain value) so two updates fired in the same tick — e.g. both
  // players' colour/faction/disposition clicks batched together — never clobber each other
  // by reading a stale `state` snapshot from outside the update.
  onChange: (mut: (s: TrackerState) => TrackerState) => void;
  onStart: () => void;
}) {
  function updatePlayer(i: 0 | 1, mut: (p: PlayerState) => PlayerState) {
    onChange((prev) => {
      const players = [...prev.players] as [PlayerState, PlayerState];
      players[i] = mut(players[i]);
      return { ...prev, players };
    });
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
            <span className="tiny muted">Force Disposition (for your Primary Mission)</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {Object.keys(DISPOSITIONS).map((d) => (
                <button
                  key={d}
                  className={state.players[i].disposition === d ? 'primary small' : 'ghost small'}
                  onClick={() => updatePlayer(i, (p) => ({ ...p, disposition: d }))}
                >
                  <DispositionIcon name={d} />
                </button>
              ))}
            </div>
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
  isActive,
  catalog,
  mission,
  onChange,
}: {
  player: PlayerState;
  round: number;
  isActive: boolean;
  catalog: NonNullable<Rules['secondaries']>;
  mission?: Mission;
  onChange: (mut: (p: PlayerState) => PlayerState, logText?: string) => void;
}) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const primaryTotal = totalVp(player.primaryVpByRound);
  const secondaryTotal = totalVp(player.secondaryVpByRound);
  const total = primaryTotal + secondaryTotal;
  const scoring = round > 0; // Round 0 is deployment — nothing is scored yet
  const hand = player.secondaries.filter((c) => c.status === 'hand');
  const history = [...player.secondaries.filter((c) => c.status !== 'hand')].reverse();
  // Chapter Approved deck rules: you can only discard an active Secondary Mission for the
  // bonus CP "if it is your turn" — and the Event Companion caps that bonus at 1/round.
  const canDiscardForCp = isActive && player.discardedForCpRound !== round;
  const discardTitle = !isActive
    ? "Only on this player's own turn"
    : player.discardedForCpRound === round
    ? 'Already used this round'
    : 'Discard this card to gain 1 CP';

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

  function reshuffleHandCard(card: SecondaryCard) {
    onChange(
      (p) => reshuffleCardState(p, round, card.id),
      `${player.name} shuffles ${card.cardName} back into the deck and draws a replacement.`,
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

  function completeCard(card: SecondaryCard, vp: number, description: string) {
    const { applied } = addRoundVp(player.secondaryVpByRound, round, vp);
    const cappedNote = applied < vp ? ` — only ${applied} counted, round cap` : '';
    onChange(
      (p) => {
        const { byRound } = addRoundVp(p.secondaryVpByRound, round, vp);
        return {
          ...p,
          secondaryVpByRound: byRound,
          secondaries: p.secondaries.map((c) =>
            c.id === card.id ? { ...c, status: 'completed', vp: applied, scoredRound: round } : c,
          ),
        };
      },
      `${player.name} completes ${card.cardName}: +${applied} VP (${description})${cappedNote}.`,
    );
    setCompletingId(null);
  }

  return (
    <div className="card tracker-player" style={{ borderColor: player.color }}>
      <div className="tracker-player-main">
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

        {scoring ? (
          <>
            <div className="tracker-stat">
              <span className="tracker-stat-label">
                Primary VP <span className="tiny muted">R{round}</span>
              </span>
              <Stepper
                value={player.primaryVpByRound[round]}
                onChange={(_v, d) =>
                  onChange((p) => {
                    const { byRound } = addRoundVp(p.primaryVpByRound, round, d);
                    return { ...p, primaryVpByRound: byRound };
                  }, `${player.name}: Primary VP ${d > 0 ? '+' : ''}${d} (Round ${round}).`)
                }
              />
            </div>

            {mission && (
              <div className="tracker-mission">
                <Collapsible title={<span className="tiny muted">Primary: {mission.name}</span>}>
                  <MissionCard m={mission} />
                </Collapsible>
                <Collapsible title={<span className="tiny muted">Score this Primary Mission</span>}>
                  <PrimaryScoringPanel
                    mission={mission}
                    round={round}
                    onScore={(vp, desc) => {
                      const { applied } = addRoundVp(player.primaryVpByRound, round, vp);
                      const cappedNote = applied < vp ? ` — only ${applied} counted, round cap` : '';
                      onChange(
                        (p) => ({ ...p, primaryVpByRound: addRoundVp(p.primaryVpByRound, round, vp).byRound }),
                        `${player.name}: Primary VP +${applied} (${desc})${cappedNote}.`,
                      );
                    }}
                  />
                </Collapsible>
              </div>
            )}

            <div className="tracker-stat">
              <span className="tracker-stat-label tiny muted">
                Manual Secondary VP <span className="tiny muted">R{round}</span>
              </span>
              <Stepper
                value={player.secondaryVpByRound[round]}
                onChange={(_v, d) =>
                  onChange((p) => {
                    const { byRound } = addRoundVp(p.secondaryVpByRound, round, d);
                    return { ...p, secondaryVpByRound: byRound };
                  }, `${player.name}: manual Secondary VP ${d > 0 ? '+' : ''}${d} (Round ${round}).`)
                }
              />
            </div>
          </>
        ) : (
          <>
            {mission && (
              <div className="tracker-mission">
                <Collapsible title={<span className="tiny muted">Primary: {mission.name} — view full text</span>}>
                  <MissionCard m={mission} />
                </Collapsible>
              </div>
            )}
            <div className="muted small">Scoring starts at Round 1.</div>
          </>
        )}

        <Collapsible title={<span className="tiny muted">VP by round</span>}>
          <RoundTable primary={player.primaryVpByRound} secondary={player.secondaryVpByRound} />
        </Collapsible>
      </div>

      <div className="tracker-secondaries">
        <div className="tracker-stat-label">Secondary missions</div>

        {scoring && !hand.length && (
          <div className="muted small">
            No active secondaries yet — drawn automatically at the start of this player's turn.
          </div>
        )}
        {!scoring && <div className="muted small">Drawn once Round 1 begins.</div>}

        {hand.map((c) => {
          const card = catalog.find((sc) => sc.name === c.cardName);
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
                  title={discardTitle}
                  onClick={() => discardForCp(c)}
                >
                  🗑 Discard (+1 CP)
                </button>
                {reshuffleEligible(c.cardName, round, player.secondaries) && (
                  <button
                    className="ghost small"
                    title="This card's WHEN DRAWN condition is met — shuffle it back and draw a new one"
                    onClick={() => reshuffleHandCard(c)}
                  >
                    🔀 Shuffle back
                  </button>
                )}
              </div>
              {completingId === c.id && card && (
                <SecondaryScoringPicker card={card} onScore={(vp, desc) => completeCard(c, vp, desc)} />
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

        <button className="ghost small" disabled={!scoring} title={scoring ? '' : 'Available from Round 1'} onClick={drawExtra}>
          + Draw extra secondary
        </button>
      </div>
    </div>
  );
}

const ROUNDS = Array.from({ length: MAX_ROUND }, (_, i) => i + 1);

function RoundTable({ primary, secondary }: { primary: number[]; secondary: number[] }) {
  return (
    <div className="tracker-roundtable-wrap">
      <table className="tracker-roundtable">
        <thead>
          <tr>
            <th></th>
            {ROUNDS.map((r) => (
              <th key={r}>R{r}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="muted tiny">Primary</td>
            {ROUNDS.map((r) => (
              <td key={r}>{primary[r]}</td>
            ))}
            <td>
              <b>{totalVp(primary)}</b>/{GAME_CAP}
            </td>
          </tr>
          <tr>
            <td className="muted tiny">Secondary</td>
            {ROUNDS.map((r) => (
              <td key={r}>{secondary[r]}</td>
            ))}
            <td>
              <b>{totalVp(secondary)}</b>/{GAME_CAP}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Renders the scoring options for a hand card's Tactical-relevant sections (FIXED-only
// sections are skipped — the digital deck always plays Tactical). Each section renders
// according to what its tiers are marked with in the source card data:
//  - a lone tier with a `cap` is a per-unit count (e.g. "3VP per unit, up to 5VP")
//  - any `cumulative` tier means the section's tiers are independent checkboxes that sum
//  - otherwise tiers are mutually exclusive (`or`) — pick one to score immediately
function SecondaryScoringPicker({
  card,
  onScore,
}: {
  card: SecondaryMission;
  onScore: (vp: number, description: string) => void;
}) {
  const sections = card.sections.filter((s) => s.chip !== 'FIXED');
  return (
    <div className="col tracker-tierpicker" style={{ gap: 10 }}>
      <span className="tiny muted">Which was satisfied?</span>
      {sections.map((s, i) => (
        <SectionPicker key={i} section={s} onScore={onScore} />
      ))}
    </div>
  );
}

function SectionPicker({
  section,
  onScore,
}: {
  section: SecondaryMission['sections'][number];
  onScore: (vp: number, description: string) => void;
}) {
  const [count, setCount] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(() => section.tiers.map(() => false));

  const hasCumulative = section.tiers.some((t) => t.cumulative);
  const isCountTier = section.tiers.length === 1 && section.cap != null;

  const header = (
    <div className="tiny muted">
      {section.when} · {section.trigger}
    </div>
  );

  if (isCountTier) {
    const tier = section.tiers[0];
    const vp = Math.min(count * tier.vp, section.cap!);
    return (
      <div className="tracker-section-picker">
        {header}
        <div className="small">{stripMd(tier.text)}</div>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <Stepper value={count} onChange={(v) => setCount(Math.max(0, v))} />
          <span className="tiny muted">
            × {tier.vp} VP, capped at {section.cap}
          </span>
          <button className="ghost small" disabled={count === 0} onClick={() => onScore(vp, `${stripMd(tier.text)} × ${count}`)}>
            Score {vp} VP
          </button>
        </div>
      </div>
    );
  }

  if (hasCumulative) {
    const vp = section.tiers.reduce((s, t, i) => s + (checked[i] ? t.vp : 0), 0);
    return (
      <div className="tracker-section-picker">
        {header}
        {section.tiers.map((t, i) => (
          <label key={i} className="row tracker-checkrow" style={{ gap: 6, alignItems: 'baseline' }}>
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={(e) => setChecked((cs) => cs.map((c, j) => (j === i ? e.target.checked : c)))}
            />
            <span>
              <b>{t.vp} VP</b> — {stripMd(t.text)}
            </span>
          </label>
        ))}
        <button
          className="ghost small"
          disabled={vp === 0}
          onClick={() =>
            onScore(
              vp,
              section.tiers
                .filter((_, i) => checked[i])
                .map((t) => stripMd(t.text))
                .join(' + '),
            )
          }
        >
          Score {vp} VP
        </button>
      </div>
    );
  }

  return (
    <div className="tracker-section-picker">
      {header}
      {section.tiers.map((t, i) => (
        <button key={i} className="ghost small tracker-tierbtn" onClick={() => onScore(t.vp, stripMd(t.text))}>
          <b>{t.vp} VP</b> — {stripMd(t.text)}
        </button>
      ))}
    </div>
  );
}

// A Primary Mission is never "completed" like a secondary — it scores again every
// qualifying round, for the whole game — so every tier is just an independent, repeatable
// "add its VP" control rather than a one-shot pick. There's no `or` flag in this data (unlike
// secondaries) since escalating tiers are normally self-evidently exclusive by their own
// wording (e.g. "1 objective" vs "2 or more") — trusted to the player rather than enforced.
//
// Sections are also gated to the battle rounds they're actually printed for ("SECOND BATTLE
// ROUND ONWARDS", "FIRST & SECOND BATTLE ROUND", etc., via sectionAppliesAtRound) — a section
// that doesn't apply yet (or anymore) this round is hidden rather than offered.
function PrimaryScoringPanel({
  mission,
  round,
  onScore,
}: {
  mission: Mission;
  round: number;
  onScore: (vp: number, description: string) => void;
}) {
  const sections = mission.sections.filter((s) => sectionAppliesAtRound(s.when, round));
  return (
    <div className="col tracker-tierpicker" style={{ gap: 10 }}>
      <span className="tiny muted">Score this Primary Mission — Round {round}</span>
      {sections.map((s, i) => (
        <div key={i} className="tracker-section-picker">
          <div className="tiny muted">
            {s.when} · {s.trigger}
          </div>
          {s.tiers.map((t, j) => (
            <PrimaryTierRow key={j} tier={t} onScore={onScore} />
          ))}
        </div>
      ))}
      {!sections.length && (
        <div className="muted small">No scoring section applies this round for this mission.</div>
      )}
    </div>
  );
}

function PrimaryTierRow({ tier, onScore }: { tier: MissionTier; onScore: (vp: number, description: string) => void }) {
  const [count, setCount] = useState(1);
  if (tier.perUnit) {
    const vp = count * tier.vp;
    return (
      <div className="tracker-section-picker">
        <div className="small">
          {tier.cumulative ? '+' : ''}
          {tier.vp} VP each — {stripMd(tier.text)}
        </div>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <Stepper value={count} onChange={(v) => setCount(Math.max(0, v))} />
          <button
            className="ghost small"
            disabled={count === 0}
            onClick={() => onScore(vp, `${stripMd(tier.text)} × ${count}`)}
          >
            Add {vp} VP
          </button>
        </div>
      </div>
    );
  }
  return (
    <button className="ghost small tracker-tierbtn" onClick={() => onScore(tier.vp, stripMd(tier.text))}>
      <b>
        {tier.cumulative ? '+' : ''}
        {tier.vp} VP
      </b>{' '}
      — {stripMd(tier.text)}
    </button>
  );
}

function md(text: string) {
  return text.split(/\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>));
}

function SecondaryCardText({ card }: { card: SecondaryMission }) {
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
