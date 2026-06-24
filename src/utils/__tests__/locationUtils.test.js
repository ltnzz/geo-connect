import { calculateDistance, formatDistanceString } from '../locationUtils';

describe('locationUtils', () => {
  describe('calculateDistance', () => {
    it('returns null if any coordinate is missing', () => {
      expect(calculateDistance(null, 106.8, -6.4, 106.7)).toBeNull();
      expect(calculateDistance(-6.2, null, -6.4, 106.7)).toBeNull();
      expect(calculateDistance(-6.2, 106.8, null, 106.7)).toBeNull();
      expect(calculateDistance(-6.2, 106.8, -6.4, null)).toBeNull();
    });

    it('calculates distance between two points in km correctly', () => {
      
      const dist = calculateDistance(-6.2088, 106.8456, -6.4025, 106.7942);
      expect(dist).toBeGreaterThan(20);
      expect(dist).toBeLessThan(25);
    });

    it('returns 0 for the exact same point', () => {
      const dist = calculateDistance(-6.2, 106.8, -6.2, 106.8);
      expect(dist).toBeCloseTo(0);
    });
  });

  describe('formatDistanceString', () => {
    it('returns Calculating... if isFetching is true', () => {
      expect(formatDistanceString(null, null, true)).toBe('Calculating...');
    });

    it('returns distance string if both locations are valid', () => {
      const userLoc = { latitude: -6.2088, longitude: 106.8456 };
      const eventLoc = { latitude: -6.4025, longitude: 106.7942 };
      const str = formatDistanceString(userLoc, eventLoc, false);
      expect(str).toMatch(/ km away/);
    });

    it('returns Nearby if location is missing', () => {
      expect(formatDistanceString(null, { latitude: -6.4025, longitude: 106.7942 }, false)).toBe('Nearby');
      expect(formatDistanceString({ latitude: -6.4025, longitude: 106.7942 }, null, false)).toBe('Nearby');
    });
  });
});
