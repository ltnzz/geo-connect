import { formatRelativeTime, formatCount } from '../format';

describe('format Utils', () => {
  describe('formatRelativeTime', () => {
    it('returns empty string if timestamp is invalid', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined)).toBe('');
    });

    it('returns "now" for less than 60 seconds ago', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('now');
    });

    it('returns minutes ago', () => {
      const past = new Date(Date.now() - 5 * 60 * 1000); 
      expect(formatRelativeTime(past)).toBe('5m ago');
    });

    it('returns hours ago', () => {
      const past = new Date(Date.now() - 3 * 60 * 60 * 1000); 
      expect(formatRelativeTime(past)).toBe('3h ago');
    });

    it('returns days ago', () => {
      const past = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); 
      expect(formatRelativeTime(past)).toBe('4d ago');
    });

    it('returns formatted date for older than 7 days', () => {
      const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); 
      const expectedDate = past.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      expect(formatRelativeTime(past)).toBe(expectedDate);
    });

    it('handles Firebase Timestamp objects (has toDate method)', () => {
      const past = new Date(Date.now() - 2 * 60 * 1000); 
      const mockTimestamp = { toDate: () => past };
      expect(formatRelativeTime(mockTimestamp)).toBe('2m ago');
    });
  });

  describe('formatCount', () => {
    it('returns string representation of number less than 1000', () => {
      expect(formatCount(0)).toBe('0');
      expect(formatCount(999)).toBe('999');
      expect(formatCount(50)).toBe('50');
    });

    it('formats thousands with K suffix', () => {
      expect(formatCount(1000)).toBe('1K');
      expect(formatCount(1500)).toBe('1.5K');
      expect(formatCount(10500)).toBe('10.5K');
      expect(formatCount(999999)).toBe('1000K'); 
    });

    it('formats millions with M suffix', () => {
      expect(formatCount(1000000)).toBe('1M');
      expect(formatCount(2500000)).toBe('2.5M');
      expect(formatCount(10000000)).toBe('10M');
    });
  });
});
