import { describe, it, expect } from 'vitest';
import {
  emptyState,
  startGame,
  nextTurn,
  addRoundVp,
  totalVp,
  drawUpTo,
  emptyPlayer,
  ROUND_CAP,
  GAME_CAP,
  MAX_ROUND,
} from './tracker';

const CATALOG = ['A', 'B', 'C', 'D', 'E', 'F'];

describe('startGame / round 0 (deployment)', () => {
  it('grants no CP and draws no cards', () => {
    const s = startGame(emptyState(['#111', '#222']));
    expect(s.round).toBe(0);
    expect(s.players[0].cp).toBe(0);
    expect(s.players[1].cp).toBe(0);
    expect(s.players[0].secondaries).toEqual([]);
    expect(s.players[1].secondaries).toEqual([]);
  });
});

describe('nextTurn out of round 0', () => {
  it('enters Round 1 as Player 1s turn, grants Core CP to both, and draws only for Player 1', () => {
    const s0 = startGame(emptyState(['#111', '#222']));
    const s1 = nextTurn(s0, CATALOG);
    expect(s1.round).toBe(1);
    expect(s1.active).toBe(0);
    expect(s1.players[0].cp).toBe(1);
    expect(s1.players[1].cp).toBe(1);
    expect(s1.players[0].secondaries).toHaveLength(2);
    expect(s1.players[1].secondaries).toHaveLength(0);
  });
});

describe('nextTurn within/across rounds', () => {
  it('grants Core CP to BOTH players every turn, not just the active one', () => {
    let s = nextTurn(startGame(emptyState(['#111', '#222'])), CATALOG); // -> round 1, P1
    s = nextTurn(s, CATALOG); // -> round 1, P2
    expect(s.active).toBe(1);
    expect(s.players[0].cp).toBe(2);
    expect(s.players[1].cp).toBe(2);
  });

  it('only the newly active player draws back up to a 2-card hand', () => {
    let s = nextTurn(startGame(emptyState(['#111', '#222'])), CATALOG); // P1 draws 2
    s = nextTurn(s, CATALOG); // P2's turn: P2 draws 2, P1 stays at 2
    expect(s.players[0].secondaries).toHaveLength(2);
    expect(s.players[1].secondaries).toHaveLength(2);
  });

  it('wraps from Player 2 back to Player 1 into the next battle round', () => {
    let s = nextTurn(startGame(emptyState(['#111', '#222'])), CATALOG); // round 1, P1
    s = nextTurn(s, CATALOG); // round 1, P2
    s = nextTurn(s, CATALOG); // round 2, P1
    expect(s.round).toBe(2);
    expect(s.active).toBe(0);
  });

  it('never advances past round 5', () => {
    let s = nextTurn(startGame(emptyState(['#111', '#222'])), CATALOG);
    for (let i = 0; i < 20; i++) s = nextTurn(s, CATALOG);
    expect(s.round).toBe(5);
  });
});

describe('addRoundVp — the 15/round cap is enforced at the point of storage', () => {
  it('applies the full delta when under the cap', () => {
    const { byRound, applied } = addRoundVp(emptyPlayer('P', '#111').primaryVpByRound, 1, 10);
    expect(byRound[1]).toBe(10);
    expect(applied).toBe(10);
  });

  it('clamps a single round at 15 and reports only what was actually applied', () => {
    const { byRound, applied } = addRoundVp(emptyPlayer('P', '#111').primaryVpByRound, 1, 20);
    expect(byRound[1]).toBe(15);
    expect(applied).toBe(15);
  });

  it('cannot be bypassed by adding in several smaller increments within the same round', () => {
    let byRound = emptyPlayer('P', '#111').primaryVpByRound;
    byRound = addRoundVp(byRound, 1, 10).byRound;
    const second = addRoundVp(byRound, 1, 10); // would be 20 total, capped to 15
    expect(second.byRound[1]).toBe(15);
    expect(second.applied).toBe(5); // only 5 of the second +10 actually counted
  });

  it('does not let one round\'s cap affect another round\'s allowance', () => {
    let byRound = emptyPlayer('P', '#111').primaryVpByRound;
    byRound = addRoundVp(byRound, 1, 20).byRound; // round 1 maxed at 15
    byRound = addRoundVp(byRound, 2, 10).byRound; // round 2 independent
    expect(byRound[1]).toBe(15);
    expect(byRound[2]).toBe(10);
  });

  it('floors at 0 (never negative)', () => {
    const { byRound } = addRoundVp(emptyPlayer('P', '#111').primaryVpByRound, 1, -5);
    expect(byRound[1]).toBe(0);
  });
});

describe('totalVp — sum across rounds, capped at 45 for the whole game', () => {
  it('sums already-capped per-round values', () => {
    const byRound = new Array(MAX_ROUND + 1).fill(0);
    byRound[1] = 15;
    byRound[2] = 15;
    expect(totalVp(byRound)).toBe(30);
  });

  it('caps the whole-game total at 45 even if every round maxed out would exceed it', () => {
    const byRound = new Array(MAX_ROUND + 1).fill(ROUND_CAP); // 6 * 15 = 90
    expect(totalVp(byRound)).toBe(GAME_CAP);
  });
});

describe('drawUpTo', () => {
  it('draws up to 2 cards from the deck into hand', () => {
    const p = { ...emptyPlayer('P', '#111'), deck: [...CATALOG] };
    const { player, drawn } = drawUpTo(p, 1);
    expect(drawn).toHaveLength(2);
    expect(player.secondaries).toHaveLength(2);
    expect(player.deck).toHaveLength(CATALOG.length - 2);
  });

  it('tops up only the missing slots when the hand already has 1 card', () => {
    const base = { ...emptyPlayer('P', '#111'), deck: [...CATALOG] };
    const withOne = {
      ...base,
      secondaries: [{ id: 'x', cardName: 'Z', status: 'hand' as const, vp: 0, drawnRound: 1 }],
    };
    const { player, drawn } = drawUpTo(withOne, 1);
    expect(drawn).toHaveLength(1);
    expect(player.secondaries).toHaveLength(2);
  });

  it('draws nothing once the hand is already full', () => {
    const base = { ...emptyPlayer('P', '#111'), deck: [...CATALOG] };
    const full = {
      ...base,
      secondaries: [
        { id: 'x', cardName: 'Z', status: 'hand' as const, vp: 0, drawnRound: 1 },
        { id: 'y', cardName: 'W', status: 'hand' as const, vp: 0, drawnRound: 1 },
      ],
    };
    const { drawn } = drawUpTo(full, 1);
    expect(drawn).toHaveLength(0);
  });
});

describe('constants', () => {
  it('ROUND_CAP is 15 and GAME_CAP is 45, per the Event Companion VP source table', () => {
    expect(ROUND_CAP).toBe(15);
    expect(GAME_CAP).toBe(45);
  });
});
