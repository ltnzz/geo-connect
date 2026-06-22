import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useColors, radius, spacing } from '../../utils/theme';

export default function EventArtwork({ event, compact = false }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (event.bannerUrl) {
    return (
      <View style={[styles.artwork, compact && styles.compactArtwork]}>
        <Image source={{ uri: event.bannerUrl }} style={styles.artworkImage} />
        {event.category ? (
          <Text style={[styles.artworkCategory, compact && styles.compactCategory]}>
            {event.category}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.artwork,
        compact && styles.compactArtwork,
        styles.fallbackBackground,
      ]}
    >
      <View style={styles.artworkIcon}>
        <Ionicons color={colors.primary} name="calendar" size={compact ? 20 : 28} />
      </View>
      {event.category ? (
        <Text style={[styles.artworkCategory, compact && styles.compactCategory]}>
          {event.category}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  artwork: {
    alignItems: 'center',
    height: 190,
    justifyContent: 'center',
    position: 'relative',
  },
  compactArtwork: {
    height: 120,
  },
  fallbackBackground: {
    backgroundColor: colors.primary + '1A',
  },
  artworkImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md,
    height: '100%',
    width: '100%',
  },
  artworkIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface + 'C2',
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  artworkCategory: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderRadius: radius.full,
    bottom: spacing.md,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    right: spacing.md,
  },
  compactCategory: {
    bottom: spacing.sm,
    fontSize: 9,
    right: spacing.sm,
  },
});

