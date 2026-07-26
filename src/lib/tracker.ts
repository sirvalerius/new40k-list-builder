import { uid } from './helpers';

// Pure state/logic for the Game Tracker screen (src/screens/GameTracker.tsx), kept separate
// so the CP/VP rules — the part worth getting exactly right — can be unit tested without a
// DOM. See that screen's file comment for the rules this implements and why.

export const ROUND_CAP = 15; // max VP scoreable per source (Primary / Secondary) per battle round
export const GAME_CAP = 45; // max VP scoreable per source across the whole battle

export type LogEntry = { id: string; ts: number; text: string };
export type SecondaryStatus = 'hand' | 'completed' | 'discarded';
export type SecondaryCard = {
  id: string;
  cardName: string;
  status: SecondaryStatus;
  vp: number;
  drawnRound: number;
};
export type PlayerState = {
  name: string;
  factionId: string;
  color: string;
  cp: number;
  primaryVp: number;
  primaryVpRoundStart: number; // primaryVp snapshot at the start of the current round
  primaryVpBanked: number; // capped VP already locked in from completed rounds
  manualSecondaryVp: number; // hand-entered VP, for players tracking secondaries on physical cards
  secVpRoundStart: number; // rawSecondaryVp snapshot at the start of the current round
  secVpBanked: number;
  deck: string[]; // shuffled remaining draw pool for this player's secondary deck
  secondaries: SecondaryCard[]; // every card ever drawn (hand / completed / discarded)
  discardedForCpRound: number; // last battle round this player used the discard-for-CP bonus (0 = never)
};
export type TrackerState = {
  phase: 'setup' | 'live';
  round: number; // 0 = pregame/deployment (no CP, no draws); 1-5 = battle rounds
  active: 0 | 1;
  startedAt: number; // whole-game clock
  turnStartedAt: number; // current turn/step clock (also covers round 0's deployment time)
  log: LogEntry[];
  players: [PlayerState, PlayerState];
};

export function emptyPlayer(name: string, color: string): PlayerState {
  return {
    name,
    factionId: '',
    color,
    cp: 0,
    primaryVp: 0,
    primaryVpRoundStart: 0,
    primaryVpBanked: 0,
    manualSecondaryVp: 0,
    secVpRoundStart: 0,
    secVpBanked: 0,
    deck: [],
    secondaries: [],
    discardedForCpRound: 0,
  };
}

export function emptyState(colors: [string, string]): TrackerState {
  return {
    phase: 'setup',
    round: 0,
    active: 0,
    startedAt: Date.now(),
    turnStartedAt: Date.now(),
    log: [],
    players: [emptyPlayer('Player 1', colors[0]), emptyPlayer('Player 2', colors[1])],
  };
}

export function shuffled(names: string[]): string[] {
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
export function drawUpTo(p: PlayerState, round: number): { player: PlayerState; drawn: string[] } {
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

/** Raw (uncapped) Secondary VP: completed digital cards + the manual counter. */
export function rawSecondaryVp(p: PlayerState): number {
  const cardVp = p.secondaries.filter((c) => c.status === 'completed').reduce((s, c) => s + c.vp, 0);
  return cardVp + p.manualSecondaryVp;
}

/** VP actually counted toward the battle so far, after the 15/round and 45/game caps. */
export function effectiveVp(raw: number, roundStart: number, banked: number): number {
  const thisRound = Math.max(0, raw - roundStart);
  return Math.min(GAME_CAP, banked + Math.min(ROUND_CAP, thisRound));
}

export function effectivePrimaryVp(p: PlayerState): number {
  return effectiveVp(p.primaryVp, p.primaryVpRoundStart, p.primaryVpBanked);
}
export function effectiveSecondaryVp(p: PlayerState): number {
  return effectiveVp(rawSecondaryVp(p), p.secVpRoundStart, p.secVpBanked);
}

/** Locks in this (ending) round's capped gain and resets the round snapshot for the next one. */
export function bankRound(p: PlayerState): PlayerState {
  const primaryGain = Math.max(0, p.primaryVp - p.primaryVpRoundStart);
  const secRaw = rawSecondaryVp(p);
  const secGain = Math.max(0, secRaw - p.secVpRoundStart);
  return {
    ...p,
    primaryVpBanked: Math.min(GAME_CAP, p.primaryVpBanked + Math.min(ROUND_CAP, primaryGain)),
    primaryVpRoundStart: p.primaryVp,
    secVpBanked: Math.min(GAME_CAP, p.secVpBanked + Math.min(ROUND_CAP, secGain)),
    secVpRoundStart: secRaw,
  };
}

export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Round 0 (deployment): no CP, no draws — just timed. Enters Round 1 on the first Next Turn. */
export function startGame(state: TrackerState, now = Date.now()): TrackerState {
  return {
    ...state,
    phase: 'live',
    round: 0,
    active: 0,
    startedAt: now,
    turnStartedAt: now,
    log: [
      ...state.log,
      { id: uid(), ts: now, text: 'Deployment begins — no CP or secondary draws until Round 1.' },
    ],
  };
}

/** Advances to the next turn (or out of Round 0 into Round 1). Both players gain Core CP
 *  per turn (Core Rules 08.02 — the Command phase grants it to both, not just whoever's
 *  turn it is); only the newly-active player draws back up to a 2-card secondary hand. */
export function nextTurn(state: TrackerState, catalogNames: string[], now = Date.now()): TrackerState {
  const turnDuration = formatElapsed(now - state.turnStartedAt);

  if (state.round === 0) {
    let players = state.players.map((p) => ({ ...p, deck: shuffled(catalogNames) })) as [
      PlayerState,
      PlayerState,
    ];
    players = players.map((p) => ({ ...p, cp: p.cp + 1 })) as [PlayerState, PlayerState];
    const { player: drawnPlayer, drawn } = drawUpTo(players[0], 1);
    players = [...players] as [PlayerState, PlayerState];
    players[0] = drawnPlayer;
    const parts = [
      `Deployment took ${turnDuration}.`,
      `Round 1 — ${drawnPlayer.name}'s turn begins.`,
      'Command phase: both players gain +1 Core CP.',
    ];
    if (drawn.length) parts.push(`${drawnPlayer.name} draws: ${drawn.join(', ')}.`);
    return {
      ...state,
      round: 1,
      active: 0,
      turnStartedAt: now,
      players,
      log: [...state.log, { id: uid(), ts: now, text: parts.join(' ') }],
    };
  }

  const wrapping = state.active === 1;
  const round = wrapping ? Math.min(5, state.round + 1) : state.round;
  const active: 0 | 1 = wrapping ? 0 : 1;

  let players = state.players.map((p) => ({ ...p, cp: p.cp + 1 })) as [PlayerState, PlayerState];
  if (wrapping) players = players.map(bankRound) as [PlayerState, PlayerState];

  const { player: drawnPlayer, drawn } = drawUpTo(players[active], round);
  players = [...players] as [PlayerState, PlayerState];
  players[active] = drawnPlayer;

  const parts = [
    `Turn duration: ${turnDuration}.`,
    wrapping
      ? `Round ${round} — ${drawnPlayer.name}'s turn begins.`
      : `${drawnPlayer.name}'s turn begins.`,
    'Command phase: both players gain +1 Core CP.',
  ];
  if (drawn.length) parts.push(`${drawnPlayer.name} draws: ${drawn.join(', ')}.`);
  return {
    ...state,
    round,
    active,
    turnStartedAt: now,
    players,
    log: [...state.log, { id: uid(), ts: now, text: parts.join(' ') }],
  };
}
