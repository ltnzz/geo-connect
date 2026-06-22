import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import EventArtwork from './EventArtwork';
import { useLocation } from '../../hooks/useLocation';
import { formatEventSchedule } from '../../utils/dateUtils';
import { formatDistanceString } from '../../utils/locationUtils';
import { useColors, radius, spacing } from '../../utils/theme';

export default function TrendingEventCard({ event, onPress }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { location, isFetchingLocation } = useLocation();
  const scheduleString = formatEventSchedule(event.startTime, event.endTime);
  const attendeesCount = event.participantCount || 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.trendingCard, pressed && styles.pressed]}
    >
      <View style={styles.trendingArtworkWrap}>
        <EventArtwork compact event={event} />
        <View style={styles.trendingDistanceBadge}>
          <Text style={styles.trendingDistance}>{formatDistanceString(location, event.location, isFetchingLocation)}</Text>
        </View>
      </View>
      <View style={styles.trendingContent}>
        <Text numberOfLines={1} style={styles.trendingTitle}>
          {event.title}
        </Text>
        <Text numberOfLines={1} style={styles.trendingMeta}>
          {scheduleString} · {attendeesCount} going
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  trendingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    width: 180,
  },
  trendingArtworkWrap: {
    position: 'relative',
  },
  trendingDistanceBadge: {
    backgroundColor: colors.surface + 'E6',
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  trendingDistance: {
    color: colors.mutedText,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  trendingContent: {
    padding: 10,
  },
  trendingTitle: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  trendingMeta: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.72,
  },
});

