import { uid } from './helpers';

// Pure state/logic for the Game Tracker screen (src/screens/GameTracker.tsx), kept separate
// so the CP/VP rules — the part worth getting exactly right — can be unit tested without a
// DOM. See that screen's file comment for the rules this implements and why.

export const ROUND_CAP = 15; // max VP scoreable per source (Primary / Secondary) per battle round
export const GAME_CAP = 45; // max VP scoreable per source across the whole battle
export const MAX_ROUND = 5;

export type LogEntry = { id: string; ts: number; text: string };
export type SecondaryStatus = 'hand' | 'completed' | 'discarded';
export type SecondaryCard = {
  id: string;
  cardName: string;
  status: SecondaryStatus;
  vp: number; // the VP actually credited (post round-cap) — see completeCardVp
  drawnRound: number;
  scoredRound?: number; // battle round it was completed in
};
export type PlayerState = {
  name: string;
  factionId: string;
  disposition: string; // Force Disposition, '' = not chosen yet — drives the Primary Mission lookup
  color: string;
  cp: number;
  // Index 0 (deployment) is always 0 — there's no scoring before Round 1. Index r holds
  // this player's Primary/Secondary VP for battle round r, and is clamped to [0, ROUND_CAP]
  // on every write (see addRoundVp), so the 15/round cap can't be bypassed by just not
  // noticing a "raw vs effective" side note — the stored number itself is always legal.
  // Primary and manual/physical-card Secondary contributions share the array with digital
  // secondary-card completions; which source contributed how much doesn't matter once
  // merged, since only the round's combined total is ever capped or displayed.
  primaryVpByRound: number[];
  secondaryVpByRound: number[];
  deck: string[]; // shuffled remaining draw pool for this player's secondary deck
  secondaries: SecondaryCard[]; // every card ever drawn (hand / completed / discarded)
  discardedForCpRound: number; // last battle round this player used the discard-for-CP bonus (0 = never)
};
export type TrackerState = {
  phase: 'setup' | 'live' | 'ended'; // 'ended': the battle is over — no more turns
  round: number; // 0 = pregame/deployment (no CP, no draws); 1-5 = battle rounds
  active: 0 | 1;
  startedAt: number; // whole-game clock
  turnStartedAt: number; // current turn/step clock (also covers round 0's deployment time)
  log: LogEntry[];
  players: [PlayerState, PlayerState];
};

function emptyRoundArray(): number[] {
  return new Array(MAX_ROUND + 1).fill(0);
}

/** Adds `delta` VP to round `round`'s bucket, clamped to [0, ROUND_CAP]. Returns the new
 *  array plus how much of `delta` was actually applied (the rest is legitimately ignored,
 *  per the rule that excess-of-cap VP doesn't count — not a bug to work around). */
export function addRoundVp(byRound: number[], round: number, delta: number): { byRound: number[]; applied: number } {
  const copy = [...byRound];
  const before = copy[round] ?? 0;
  const after = Math.max(0, Math.min(ROUND_CAP, before + delta));
  copy[round] = after;
  return { byRound: copy, applied: after - before };
}

/** Whole-game total for one VP source, summed across rounds (each already ≤15) and capped at 45. */
export function totalVp(byRound: number[]): number {
  return Math.min(GAME_CAP, byRound.reduce((s, v) => s + v, 0));
}

/** A player's final score: Primary + Secondary totals (each already capped at 45). */
export function finalScore(p: PlayerState): number {
  return totalVp(p.primaryVpByRound) + totalVp(p.secondaryVpByRound);
}

/** "the player with the most VP is the victor... If the players are tied, the battle is a
 *  draw" (Event Companion, DETERMINE VICTOR) — doesn't account for the Battle Ready Army
 *  bonus (10VP for a painted force), which isn't tracked here. */
export function winner(players: [PlayerState, PlayerState]): 0 | 1 | 'draw' {
  const [a, b] = [finalScore(players[0]), finalScore(players[1])];
  if (a === b) return 'draw';
  return a > b ? 0 : 1;
}

export function emptyPlayer(name: string, color: string): PlayerState {
  return {
    name,
    factionId: '',
    disposition: '',
    color,
    cp: 0,
    primaryVpByRound: emptyRoundArray(),
    secondaryVpByRound: emptyRoundArray(),
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

// A handful of secondary cards let you shuffle them back into your deck and draw a
// replacement, "WHEN DRAWN", if some condition holds — most say "you can" (optional, the
// player chooses); Defend Stronghold doesn't say "can", so it's mandatory. Hand-curated
// rather than parsed from the card text since there are only 5 of these across the whole
// deck and just two condition shapes.
type ReshuffleCondition =
  | { type: 'first-round' }
  | { type: 'other-card-active'; otherCard: string };
export const RESHUFFLE_RULES: Record<string, { mandatory: boolean; condition: ReshuffleCondition }> = {
  'Behind Enemy Lines': { mandatory: false, condition: { type: 'first-round' } },
  'Forward Position': { mandatory: false, condition: { type: 'first-round' } },
  'Defend Stronghold': { mandatory: true, condition: { type: 'first-round' } },
  Cleanse: { mandatory: false, condition: { type: 'other-card-active', otherCard: 'Plunder' } },
  Plunder: { mandatory: false, condition: { type: 'other-card-active', otherCard: 'Cleanse' } },
};

export function isMandatoryReshuffle(cardName: string): boolean {
  return !!RESHUFFLE_RULES[cardName]?.mandatory;
}

/** Whether `cardName`'s "when drawn" reshuffle condition currently holds for this player. */
export function reshuffleEligible(cardName: string, round: number, secondaries: SecondaryCard[]): boolean {
  const rule = RESHUFFLE_RULES[cardName];
  if (!rule) return false;
  if (rule.condition.type === 'first-round') return round === 1;
  return secondaries.some((c) => c.cardName === rule.condition.otherCard && c.status === 'hand');
}

/** Draws one card from `deck`, transparently shuffling it back and drawing again if it's a
 *  mandatory-reshuffle card whose condition currently holds (e.g. Defend Stronghold on Round
 *  1) — the player never sees a card they were never allowed to keep. Reports every name it
 *  had to reshuffle along the way, for logging. */
function drawOneRespectingMandatoryReshuffle(
  deck: string[],
  round: number,
  secondariesSoFar: SecondaryCard[],
): { name: string; deck: string[]; reshuffled: string[] } | null {
  const d = [...deck];
  const reshuffled: string[] = [];
  for (let guard = 0; guard < 20 && d.length > 0; guard++) {
    const name = d.shift()!;
    if (isMandatoryReshuffle(name) && reshuffleEligible(name, round, secondariesSoFar)) {
      d.splice(Math.floor(Math.random() * (d.length + 1)), 0, name);
      reshuffled.push(name);
      continue;
    }
    return { name, deck: d, reshuffled };
  }
  return null;
}

// Draws 2 fresh cards from this player's own shuffled deck, ADDED to whatever's already
// active for them — the rule text ("At the start of your Command phase, draw two Secondary
// Missions... these Secondary Missions are active for you") never caps the hand at 2, so
// unlike an earlier version of this tracker, a player's hand is allowed to grow past 2 (no
// reshuffle of completed/discarded cards — a deliberate simplification of the real
// reshuffle-on-discard rule, fine for a casual tracker since 18 cards comfortably covers a
// 5-round game even without ever topping the hand back down).
export function drawTwo(
  p: PlayerState,
  round: number,
): { player: PlayerState; drawn: string[]; reshuffled: string[] } {
  let deck = p.deck;
  let secondaries = p.secondaries;
  const drawn: string[] = [];
  const reshuffled: string[] = [];
  for (let i = 0; i < 2; i++) {
    const result = drawOneRespectingMandatoryReshuffle(deck, round, secondaries);
    if (!result) break;
    deck = result.deck;
    reshuffled.push(...result.reshuffled);
    secondaries = [...secondaries, { id: uid(), cardName: result.name, status: 'hand', vp: 0, drawnRound: round }];
    drawn.push(result.name);
  }
  return { player: { ...p, deck, secondaries }, drawn, reshuffled };
}

/** Player-triggered version of the optional ("you can") reshuffle: puts `cardId` back into
 *  the deck and immediately draws one replacement (which itself respects mandatory reshuffle). */
export function reshuffleCard(p: PlayerState, round: number, cardId: string): PlayerState {
  const card = p.secondaries.find((c) => c.id === cardId && c.status === 'hand');
  if (!card) return p;
  const afterRemoval = p.secondaries.filter((c) => c.id !== cardId);
  const deck = [...p.deck];
  deck.splice(Math.floor(Math.random() * (deck.length + 1)), 0, card.cardName);
  const result = drawOneRespectingMandatoryReshuffle(deck, round, afterRemoval);
  if (!result) return { ...p, deck, secondaries: afterRemoval };
  return {
    ...p,
    deck: result.deck,
    secondaries: [
      ...afterRemoval,
      { id: uid(), cardName: result.name, status: 'hand', vp: 0, drawnRound: round },
    ],
  };
}

// Primary Mission sections are gated to specific battle rounds ("SECOND BATTLE ROUND
// ONWARDS", "FIRST & SECOND BATTLE ROUND", "SECOND TO FOURTH BATTLE ROUND", etc.) — these
// are the only 9 distinct phrasings used across all 25 cards (checked against the full
// scraped set), so a small ordinal parser covers every real case. Unrecognised text fails
// open (shown), since hiding a section that actually applies is worse than showing one that
// doesn't come up until you check the real card.
const ORDINALS: Record<string, number> = { FIRST: 1, SECOND: 2, THIRD: 3, FOURTH: 4, FIFTH: 5 };

export function sectionAppliesAtRound(when: string, round: number): boolean {
  const w = when.toUpperCase().trim();
  if (w === 'ANY BATTLE ROUND') return true;
  if (w === 'END OF BATTLE') return round === MAX_ROUND;
  let m = w.match(/^(\w+) BATTLE ROUND ONWARDS$/);
  if (m && ORDINALS[m[1]]) return round >= ORDINALS[m[1]];
  m = w.match(/^(\w+) TO (\w+) BATTLE ROUND$/);
  if (m && ORDINALS[m[1]] && ORDINALS[m[2]]) return round >= ORDINALS[m[1]] && round <= ORDINALS[m[2]];
  m = w.match(/^(\w+) & (\w+) BATTLE ROUND$/);
  if (m && ORDINALS[m[1]] && ORDINALS[m[2]]) return round === ORDINALS[m[1]] || round === ORDINALS[m[2]];
  m = w.match(/^(\w+) BATTLE ROUND$/);
  if (m && ORDINALS[m[1]]) return round === ORDINALS[m[1]];
  return true;
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
 *  turn it is); only the newly-active player draws 2 fresh secondary cards (added to
 *  whatever they already have active — the hand isn't capped at 2). */
export function nextTurn(state: TrackerState, catalogNames: string[], now = Date.now()): TrackerState {
  if (state.phase === 'ended') return state; // no-op past end of battle

  const turnDuration = formatElapsed(now - state.turnStartedAt);

  if (state.round === 0) {
    let players = state.players.map((p) => ({ ...p, deck: shuffled(catalogNames) })) as [
      PlayerState,
      PlayerState,
    ];
    players = players.map((p) => ({ ...p, cp: p.cp + 1 })) as [PlayerState, PlayerState];
    const { player: drawnPlayer, drawn, reshuffled } = drawTwo(players[0], 1);
    players = [...players] as [PlayerState, PlayerState];
    players[0] = drawnPlayer;
    const parts = [
      `Deployment took ${turnDuration}.`,
      `Round 1 — ${drawnPlayer.name}'s turn begins.`,
      'Command phase: both players gain +1 Core CP.',
    ];
    if (reshuffled.length) parts.push(`${drawnPlayer.name} shuffles back: ${reshuffled.join(', ')} (mandatory).`);
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

  // The battle ends after 5 battle rounds ("players continue to play out their turns until
  // the battle ends" — end of battle is end of the second player's turn in Round 5). No
  // further CP/draws/round-6 — the game is simply over.
  if (wrapping && state.round === MAX_ROUND) {
    return {
      ...state,
      phase: 'ended',
      turnStartedAt: now,
      log: [...state.log, { id: uid(), ts: now, text: `Turn duration: ${turnDuration}. Battle ends — Round 5 complete.` }],
    };
  }

  const round = wrapping ? Math.min(MAX_ROUND, state.round + 1) : state.round;
  const active: 0 | 1 = wrapping ? 0 : 1;

  const players = state.players.map((p) => ({ ...p, cp: p.cp + 1 })) as [PlayerState, PlayerState];
  const { player: drawnPlayer, drawn, reshuffled } = drawTwo(players[active], round);
  players[active] = drawnPlayer;

  const parts = [
    `Turn duration: ${turnDuration}.`,
    wrapping
      ? `Round ${round} — ${drawnPlayer.name}'s turn begins.`
      : `${drawnPlayer.name}'s turn begins.`,
    'Command phase: both players gain +1 Core CP.',
  ];
  if (reshuffled.length) parts.push(`${drawnPlayer.name} shuffles back: ${reshuffled.join(', ')} (mandatory).`);
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
