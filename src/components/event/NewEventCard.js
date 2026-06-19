import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

export default function NewEventCard({ event, onPress }) {
  const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
  const scheduleString = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const address = event.location?.city || 'Nearby';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.trendingCard, pressed && styles.pressed]}
    >
      <View style={styles.trendingArtworkWrap}>
        <View style={[styles.artwork, styles.compactArtwork, !event.bannerUrl && { backgroundColor: '#E9F0FF' }]}>
          {event.bannerUrl ? (
            <Image source={{ uri: event.bannerUrl }} style={styles.artworkImage} />
          ) : (
            <View style={styles.artworkIcon}>
              <Ionicons color={colors.primary} name="calendar" size={20} />
            </View>
          )}
          {event.category ? (
            <Text style={[styles.artworkCategory, styles.compactCategory]}>
              {event.category}
            </Text>
          ) : null}
        </View>

        <View style={styles.trendingDistanceBadge}>
          <Text style={styles.trendingDistance}>Baru</Text>
        </View>
      </View>
      <View style={styles.trendingContent}>
        <Text numberOfLines={1} style={styles.trendingTitle}>
          {event.title}
        </Text>
        <Text numberOfLines={1} style={styles.trendingMeta}>
          {scheduleString} · {address}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trendingCard: {
    backgroundColor: colors.surface,
    borderColor: '#E0E6EF',
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    width: 180,
  },
  trendingArtworkWrap: {
    position: 'relative',
  },
  artwork: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compactArtwork: {
    height: 120,
  },
  artworkImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md,
    height: '100%',
    width: '100%',
  },
  artworkIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  artworkCategory: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderRadius: radius.full,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
  },
  compactCategory: {
    bottom: spacing.sm,
    fontSize: 9,
    right: spacing.sm,
  },
  trendingDistanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  trendingDistance: {
    color: '#526173',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  trendingContent: {
    padding: 10,
  },
  trendingTitle: {
    color: '#263244',
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
