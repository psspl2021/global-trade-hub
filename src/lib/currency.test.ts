import { describe, it, expect } from 'vitest';
import { sanitizeCurrencyStrict, formatINR } from './currency';

describe('sanitizeCurrencyStrict', () => {
  describe('valid inputs', () => {
    it('parses plain integers', () => {
      expect(sanitizeCurrencyStrict('65000')).toBe(65000);
      expect(sanitizeCurrencyStrict('1')).toBe(1);
    });

    it('parses comma-grouped numbers', () => {
      expect(sanitizeCurrencyStrict('65,000')).toBe(65000);
      expect(sanitizeCurrencyStrict('1,00,000')).toBe(100000);
      expect(sanitizeCurrencyStrict('1,234,567')).toBe(1234567);
    });

    it('strips currency symbols', () => {
      expect(sanitizeCurrencyStrict('₹65,000')).toBe(65000);
      expect(sanitizeCurrencyStrict('$100')).toBe(100);
      expect(sanitizeCurrencyStrict('€50')).toBe(50);
    });

    it('strips whitespace', () => {
      expect(sanitizeCurrencyStrict(' 65 000 ')).toBe(65000);
      expect(sanitizeCurrencyStrict('  100  ')).toBe(100);
    });

    it('handles k suffix (thousands)', () => {
      expect(sanitizeCurrencyStrict('65k')).toBe(65000);
      expect(sanitizeCurrencyStrict('65K')).toBe(65000);
      expect(sanitizeCurrencyStrict('1.5k')).toBe(1500);
    });

    it('handles l suffix (lakh)', () => {
      expect(sanitizeCurrencyStrict('5l')).toBe(500000);
      expect(sanitizeCurrencyStrict('1.2L')).toBe(120000);
    });

    it('handles cr suffix (crore)', () => {
      expect(sanitizeCurrencyStrict('1cr')).toBe(10000000);
      expect(sanitizeCurrencyStrict('1.5CR')).toBe(15000000);
    });

    it('accepts numbers directly', () => {
      expect(sanitizeCurrencyStrict(65000)).toBe(65000);
      expect(sanitizeCurrencyStrict(1.5)).toBe(2); // rounded
    });

    it('rounds decimals', () => {
      expect(sanitizeCurrencyStrict('100.4')).toBe(100);
      expect(sanitizeCurrencyStrict('100.6')).toBe(101);
    });
  });

  describe('invalid inputs (return null)', () => {
    it('rejects null/undefined/empty', () => {
      expect(sanitizeCurrencyStrict(null)).toBeNull();
      expect(sanitizeCurrencyStrict(undefined)).toBeNull();
      expect(sanitizeCurrencyStrict('')).toBeNull();
      expect(sanitizeCurrencyStrict('   ')).toBeNull();
    });

    it('rejects zero and negatives', () => {
      expect(sanitizeCurrencyStrict('0')).toBeNull();
      expect(sanitizeCurrencyStrict('000')).toBeNull();
      expect(sanitizeCurrencyStrict('-50')).toBeNull();
      expect(sanitizeCurrencyStrict(-100)).toBeNull();
      expect(sanitizeCurrencyStrict(0)).toBeNull();
    });

    it('rejects non-numeric garbage', () => {
      expect(sanitizeCurrencyStrict('abc')).toBeNull();
      expect(sanitizeCurrencyStrict('12abc')).toBeNull();
      expect(sanitizeCurrencyStrict('--5')).toBeNull();
    });

    it('rejects values exceeding ₹999 Cr cap', () => {
      expect(sanitizeCurrencyStrict('10000000000')).toBeNull(); // 1000 Cr
      expect(sanitizeCurrencyStrict('1000cr')).toBeNull();
    });

    it('rejects NaN/Infinity', () => {
      expect(sanitizeCurrencyStrict(NaN)).toBeNull();
      expect(sanitizeCurrencyStrict(Infinity)).toBeNull();
    });
  });
});

describe('formatINR', () => {
  it('formats with Indian comma grouping', () => {
    expect(formatINR(1000)).toBe('1,000');
    expect(formatINR(100000)).toBe('1,00,000');
    expect(formatINR(10000000)).toBe('1,00,00,000');
  });

  it('returns empty string for invalid input', () => {
    expect(formatINR(null)).toBe('');
    expect(formatINR(undefined)).toBe('');
    expect(formatINR(0)).toBe('');
    expect(formatINR(-100)).toBe('');
    expect(formatINR(NaN)).toBe('');
    expect(formatINR(Infinity)).toBe('');
  });
});
