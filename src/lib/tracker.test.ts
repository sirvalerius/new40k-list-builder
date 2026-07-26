import { describe, it, expect } from 'vitest';
import {
  emptyState,
  startGame,
  nextTurn,
  bankRound,
  effectiveVp,
  effectivePrimaryVp,
  effectiveSecondaryVp,
  rawSecondaryVp,
  drawUpTo,
  emptyPlayer,
  ROUND_CAP,
  GAME_CAP,
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

describe('effectiveVp (15/round, 45/game caps)', () => {
  it('is the raw value when under both caps', () => {
    expect(effectiveVp(10, 0, 0)).toBe(10);
  });

  it('caps a single round at 15 even if more was scored', () => {
    expect(effectiveVp(20, 0, 0)).toBe(15);
  });

  it('caps the whole-game total at 45', () => {
    expect(effectiveVp(10, 0, 40)).toBe(45); // 40 banked + 10 this round would be 50, capped to 45
  });

  it('does not let a round over 15 spill into the next round\'s allowance', () => {
    // round 1: scored 20 (only 15 counts) -> banked 15. round 2: scores 10 more.
    let p = emptyPlayer('P', '#111');
    p = { ...p, primaryVp: 20 };
    p = bankRound(p); // banks min(15, 20) = 15, resets roundStart to 20
    p = { ...p, primaryVp: 30 }; // +10 this round
    expect(effectivePrimaryVp(p)).toBe(25); // 15 banked + 10 this round, not 20+10=30
  });
});

describe('bankRound', () => {
  it('locks in the capped gain and resets the round-start snapshot', () => {
    let p = emptyPlayer('P', '#111');
    p = { ...p, primaryVp: 12 };
    p = bankRound(p);
    expect(p.primaryVpBanked).toBe(12);
    expect(p.primaryVpRoundStart).toBe(12);
  });

  it('banks secondary VP (completed cards + manual) the same way', () => {
    let p = emptyPlayer('P', '#111');
    p = { ...p, manualSecondaryVp: 25 };
    expect(rawSecondaryVp(p)).toBe(25);
    p = bankRound(p);
    expect(p.secVpBanked).toBe(15); // capped at ROUND_CAP
    expect(effectiveSecondaryVp(p)).toBe(15);
  });
});

describe('drawUpTo', () => {
  it('draws up to 2 cards from the deck into hand', () => {
    const p = { ...emptyPlayer('P', '#111'), deck: shuffleFree(CATALOG) };
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

// deterministic stand-in for shuffled() in tests that don't care about order
function shuffleFree(a: string[]) {
  return [...a];
}

// sanity check the exported constants match the rules this file's tests assume
describe('constants', () => {
  it('ROUND_CAP is 15 and GAME_CAP is 45, per the Event Companion VP source table', () => {
    expect(ROUND_CAP).toBe(15);
    expect(GAME_CAP).toBe(45);
  });
});
