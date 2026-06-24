import { isWithin24Hours, filterRecentEvents, formatEventSchedule, combineDateTime, formatRelativeTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('isWithin24Hours', () => {
    it('returns false for null/undefined', () => {
      expect(isWithin24Hours(null)).toBe(false);
    });

    it('returns true for a date within 24 hours', () => {
      const now = new Date();
      expect(isWithin24Hours(now)).toBe(true);
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      expect(isWithin24Hours(twelveHoursAgo)).toBe(true);
    });

    it('returns false for a date older than 24 hours', () => {
      const now = new Date();
      const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);
      expect(isWithin24Hours(thirtyHoursAgo)).toBe(false);
    });
  });

  describe('filterRecentEvents', () => {
    it('filters out events older than 24h and sorts descending', () => {
      const now = new Date();
      const events = [
        { id: 1, createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000) }, 
        { id: 2, createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) },  
        { id: 3, createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000) }, 
      ];
      const result = filterRecentEvents(events);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(2); 
      expect(result[1].id).toBe(3);
    });
  });

  describe('formatEventSchedule', () => {
    it('returns empty string if no startTime', () => {
      expect(formatEventSchedule(null)).toBe('');
    });

    it('formats same day schedule correctly', () => {
      const start = new Date('2026-06-25T10:00:00');
      const end = new Date('2026-06-25T14:00:00');
      const result = formatEventSchedule(start, end);
      expect(result).toContain('10:00 AM');
      expect(result).toContain('2:00 PM');
    });

    it('formats multi day schedule correctly', () => {
      const start = new Date('2026-06-25T10:00:00');
      const end = new Date('2026-06-26T14:00:00');
      const result = formatEventSchedule(start, end);
      expect(result).toContain('\n');
    });
  });

  describe('combineDateTime', () => {
    it('combines date and time objects', () => {
      const date = new Date('2026-06-25T00:00:00');
      const time = new Date('2026-01-01T15:30:00');
      const combined = combineDateTime(date, time);
      expect(combined.getFullYear()).toBe(2026);
      expect(combined.getDate()).toBe(25);
      expect(combined.getHours()).toBe(15);
      expect(combined.getMinutes()).toBe(30);
    });
  });

  describe('formatRelativeTime', () => {
    it('formats time relatively', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
      
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinsAgo)).toBe('5 minutes ago');
      
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });
  });
});
