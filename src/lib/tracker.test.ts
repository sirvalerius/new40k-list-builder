import { describe, it, expect } from 'vitest';
import {
  emptyState,
  startGame,
  nextTurn,
  addRoundVp,
  totalVp,
  drawTwo,
  emptyPlayer,
  reshuffleEligible,
  reshuffleCard,
  isMandatoryReshuffle,
  sectionAppliesAtRound,
  ROUND_CAP,
  GAME_CAP,
  MAX_ROUND,
  type SecondaryCard,
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

  it('only the newly active player draws — the other player is untouched', () => {
    let s = nextTurn(startGame(emptyState(['#111', '#222'])), CATALOG); // P1 draws 2
    s = nextTurn(s, CATALOG); // P2's turn: P2 draws 2, P1 unaffected
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

describe('drawTwo', () => {
  it('draws 2 cards from the deck into hand', () => {
    const p = { ...emptyPlayer('P', '#111'), deck: [...CATALOG] };
    const { player, drawn } = drawTwo(p, 1);
    expect(drawn).toHaveLength(2);
    expect(player.secondaries).toHaveLength(2);
    expect(player.deck).toHaveLength(CATALOG.length - 2);
  });

  it('draws 2 more even if the hand already has cards — the hand is not capped at 2', () => {
    const base = { ...emptyPlayer('P', '#111'), deck: [...CATALOG] };
    const withOne = {
      ...base,
      secondaries: [{ id: 'x', cardName: 'Z', status: 'hand' as const, vp: 0, drawnRound: 1 }],
    };
    const { player, drawn } = drawTwo(withOne, 1);
    expect(drawn).toHaveLength(2);
    expect(player.secondaries).toHaveLength(3);
  });

  it('draws 2 more on top of an already-2-card hand (no cap)', () => {
    const base = { ...emptyPlayer('P', '#111'), deck: [...CATALOG] };
    const withTwo = {
      ...base,
      secondaries: [
        { id: 'x', cardName: 'Z', status: 'hand' as const, vp: 0, drawnRound: 1 },
        { id: 'y', cardName: 'W', status: 'hand' as const, vp: 0, drawnRound: 1 },
      ],
    };
    const { player, drawn } = drawTwo(withTwo, 1);
    expect(drawn).toHaveLength(2);
    expect(player.secondaries).toHaveLength(4);
  });

  it('draws whatever is left once the deck runs low, rather than erroring', () => {
    const p = { ...emptyPlayer('P', '#111'), deck: ['Z'] };
    const { drawn } = drawTwo(p, 1);
    expect(drawn).toHaveLength(1);
  });
});

describe('constants', () => {
  it('ROUND_CAP is 15 and GAME_CAP is 45, per the Event Companion VP source table', () => {
    expect(ROUND_CAP).toBe(15);
    expect(GAME_CAP).toBe(45);
  });
});

describe('reshuffleEligible', () => {
  it('a first-round card is eligible only on round 1', () => {
    expect(reshuffleEligible('Behind Enemy Lines', 1, [])).toBe(true);
    expect(reshuffleEligible('Behind Enemy Lines', 2, [])).toBe(false);
  });

  it('a paired-card condition is eligible only while the other card is in hand', () => {
    const hand: SecondaryCard[] = [{ id: 'x', cardName: 'Plunder', status: 'hand', vp: 0, drawnRound: 2 }];
    expect(reshuffleEligible('Cleanse', 3, hand)).toBe(true);
    expect(reshuffleEligible('Cleanse', 3, [])).toBe(false);
    // discarded/completed doesn't count as "active"
    const discarded: SecondaryCard[] = [{ id: 'x', cardName: 'Plunder', status: 'discarded', vp: 0, drawnRound: 2 }];
    expect(reshuffleEligible('Cleanse', 3, discarded)).toBe(false);
  });

  it('cards with no reshuffle rule are never eligible', () => {
    expect(reshuffleEligible('A Tempting Target', 1, [])).toBe(false);
  });

  it('only Defend Stronghold is mandatory', () => {
    expect(isMandatoryReshuffle('Defend Stronghold')).toBe(true);
    expect(isMandatoryReshuffle('Behind Enemy Lines')).toBe(false);
    expect(isMandatoryReshuffle('Forward Position')).toBe(false);
  });
});

describe('drawTwo — mandatory reshuffle', () => {
  it('never lets Defend Stronghold sit in hand on Round 1, drawing a replacement instead', () => {
    const p = { ...emptyPlayer('P', '#111'), deck: ['Defend Stronghold', 'A Tempting Target'] };
    const { player, drawn, reshuffled } = drawTwo(p, 1);
    expect(drawn).not.toContain('Defend Stronghold');
    expect(reshuffled).toContain('Defend Stronghold');
    expect(player.secondaries.map((c) => c.cardName)).toContain('A Tempting Target');
    // shuffled back in, not lost
    expect(player.deck).toContain('Defend Stronghold');
  });

  it('draws Defend Stronghold normally once past Round 1', () => {
    const p = { ...emptyPlayer('P', '#111'), deck: ['Defend Stronghold', 'A Tempting Target'] };
    const { drawn, reshuffled } = drawTwo(p, 2);
    expect(drawn).toContain('Defend Stronghold');
    expect(reshuffled).toHaveLength(0);
  });
});

describe('reshuffleCard — optional player-triggered reshuffle', () => {
  it('removes the card from hand, returns it to the deck, and draws a replacement', () => {
    // the reshuffled card goes back at a random deck position, so the replacement draw
    // could legitimately come back out again — assert the invariants, not which one "wins".
    let p = { ...emptyPlayer('P', '#111'), deck: ['A Tempting Target'] };
    p = {
      ...p,
      secondaries: [{ id: 'x', cardName: 'Behind Enemy Lines', status: 'hand', vp: 0, drawnRound: 1 }],
    };
    const after = reshuffleCard(p, 1, 'x');
    expect(after.secondaries.find((c) => c.id === 'x')).toBeUndefined();
    expect(after.secondaries).toHaveLength(1);
    const pool = [...after.deck, after.secondaries[0].cardName].sort();
    expect(pool).toEqual(['A Tempting Target', 'Behind Enemy Lines'].sort());
  });

  it('is a no-op if the card is not actually in hand', () => {
    const p = emptyPlayer('P', '#111');
    expect(reshuffleCard(p, 1, 'missing')).toBe(p);
  });
});

describe('sectionAppliesAtRound', () => {
  it('handles every "when" phrasing that actually appears across the scraped mission data', () => {
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('ANY BATTLE ROUND', r))).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('END OF BATTLE', r))).toEqual([5]);
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('FIFTH BATTLE ROUND', r))).toEqual([5]);
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('FIRST BATTLE ROUND', r))).toEqual([1]);
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('FIRST & SECOND BATTLE ROUND', r))).toEqual([1, 2]);
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('SECOND & THIRD BATTLE ROUND', r))).toEqual([2, 3]);
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('SECOND BATTLE ROUND ONWARDS', r))).toEqual([
      2, 3, 4, 5,
    ]);
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('FOURTH BATTLE ROUND ONWARDS', r))).toEqual([4, 5]);
    expect([1, 2, 3, 4, 5].filter((r) => sectionAppliesAtRound('SECOND TO FOURTH BATTLE ROUND', r))).toEqual([
      2, 3, 4,
    ]);
  });

  it('fails open (shows the section) for unrecognised text rather than hiding it', () => {
    expect(sectionAppliesAtRound('SOME UNEXPECTED PHRASING', 3)).toBe(true);
  });
});
