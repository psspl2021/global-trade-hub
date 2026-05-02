import { describe, it, expect } from 'vitest';
import { isAccidentalTruncation } from './pricing';

describe('isAccidentalTruncation', () => {
  describe('detects accidental truncation (returns true)', () => {
    it('blocks 65,000 → 65 (3 orders)', () => {
      expect(isAccidentalTruncation(65000, 65)).toBe(true);
    });

    it('blocks 1000 → 9 (3 orders)', () => {
      expect(isAccidentalTruncation(1000, 9)).toBe(true);
    });

    it('blocks 100,000 → 100 (3 orders)', () => {
      expect(isAccidentalTruncation(100000, 100)).toBe(true);
    });

    it('blocks 999 → 9 (2 orders)', () => {
      expect(isAccidentalTruncation(999, 9)).toBe(true);
    });
  });

  describe('allows legitimate edits (returns false)', () => {
    it('allows 65,000 → 5,000 (1 order)', () => {
      expect(isAccidentalTruncation(65000, 5000)).toBe(false);
    });

    it('allows 9,900 → 900 (1 order)', () => {
      expect(isAccidentalTruncation(9900, 900)).toBe(false);
    });

    it('allows 1000 → 100 (1 order, borderline)', () => {
      expect(isAccidentalTruncation(1000, 100)).toBe(false);
    });

    it('allows 1000 → 999 (no order drop)', () => {
      expect(isAccidentalTruncation(1000, 999)).toBe(false);
    });

    it('allows increases', () => {
      expect(isAccidentalTruncation(100, 65000)).toBe(false);
    });

    it('allows same value', () => {
      expect(isAccidentalTruncation(1000, 1000)).toBe(false);
    });
  });

  describe('defensive guards (returns false)', () => {
    it('rejects zero inputs', () => {
      expect(isAccidentalTruncation(0, 100)).toBe(false);
      expect(isAccidentalTruncation(1000, 0)).toBe(false);
      expect(isAccidentalTruncation(0, 0)).toBe(false);
    });

    it('rejects negative inputs', () => {
      expect(isAccidentalTruncation(-1000, 10)).toBe(false);
      expect(isAccidentalTruncation(1000, -10)).toBe(false);
    });

    it('rejects NaN/Infinity', () => {
      expect(isAccidentalTruncation(NaN, 100)).toBe(false);
      expect(isAccidentalTruncation(1000, NaN)).toBe(false);
      expect(isAccidentalTruncation(Infinity, 100)).toBe(false);
      expect(isAccidentalTruncation(1000, Infinity)).toBe(false);
    });
  });

  describe('power-of-10 epsilon stability', () => {
    it('handles exact powers of 10 without flicker', () => {
      // 10000 → 100 = exactly 2 orders → blocked
      expect(isAccidentalTruncation(10000, 100)).toBe(true);
      // 10000 → 1000 = exactly 1 order → allowed
      expect(isAccidentalTruncation(10000, 1000)).toBe(false);
    });

    it('respects exact boundary between 1 and 2 orders', () => {
      // 100 → 10 = exactly 1 order → allowed
      expect(isAccidentalTruncation(100, 10)).toBe(false);
      // 100 → 9 = crosses into 2 orders → blocked
      expect(isAccidentalTruncation(100, 9)).toBe(true);
    });
  });
});
