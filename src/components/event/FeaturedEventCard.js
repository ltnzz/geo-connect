import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import EventArtwork from './EventArtwork';
import { useEventResponse } from '../../hooks/useEventResponse';
import { colors, radius, spacing } from '../../utils/theme';

export default function FeaturedEventCard({ event, onOpen }) {
  const { response, toggleGoing, toggleInterested } = useEventResponse(event?.id);

  let scheduleString = '';
  if (event.schedule) {
    scheduleString = event.schedule;
  } else if (event.startTime) {
    const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
    scheduleString = startTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <View style={styles.featuredCard}>
      <View style={styles.badgeRow}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{event.status || 'Upcoming'}</Text>
        </View>
        <Text style={styles.distance}>Nearby</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpen}>
        <EventArtwork event={event} />
      </Pressable>

      <View style={styles.featuredContent}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          style={styles.titleRow}
        >
          <View style={styles.titleCopy}>
            <Text style={styles.featuredTitle}>{event.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons color={colors.neutral} name="location-outline" size={12} />
              <Text numberOfLines={1} style={styles.metaText}>
                {event.venue || event.location?.address || 'TBD'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons color={colors.neutral} name="time-outline" size={12} />
              <Text style={styles.metaText}>{scheduleString}</Text>
            </View>
          </View>
          <View style={styles.calendarButton}>
            <Ionicons color={colors.primary} name="calendar-outline" size={20} />
          </View>
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={toggleGoing}
            style={({ pressed }) => [
              styles.responseAction,
              response === 'going' && styles.goingActionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              color={response === 'going' ? '#FFFFFF' : colors.primary}
              name={response === 'going' ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={16}
            />
            <Text
              style={[
                styles.responseActionText,
                response === 'going' && styles.goingActionTextSelected,
              ]}
            >
              Going
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={toggleInterested}
            style={({ pressed }) => [
              styles.responseAction,
              response === 'interested' && styles.secondaryActionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              color={response === 'interested' ? colors.tertiary : colors.mutedText}
              name={response === 'interested' ? 'bookmark' : 'bookmark-outline'}
              size={15}
            />
            <Text
              style={[
                styles.responseActionText,
                response === 'interested' && styles.secondaryActionTextSelected,
              ]}
            >
              Interested
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  featuredCard: {
    backgroundColor: colors.surface,
    borderColor: '#E0E6EF',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  statusBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  statusDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 7,
    width: 7,
  },
  statusText: {
    color: '#526173',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  distance: {
    color: colors.neutral,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  featuredContent: {
    padding: spacing.md,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  titleCopy: {
    flex: 1,
  },
  featuredTitle: {
    color: '#263244',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    color: colors.neutral,
    flexShrink: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  calendarButton: {
    alignItems: 'center',
    borderColor: '#C9D7F2',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 36,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  responseAction: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#C7D2E3',
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    justifyContent: 'center',
  },
  goingActionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  responseActionText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  goingActionTextSelected: {
    color: '#FFFFFF',
  },
  secondaryActionSelected: {
    backgroundColor: '#EAF8F2',
    borderColor: colors.tertiary,
  },
  secondaryActionTextSelected: {
    color: colors.tertiary,
  },
  pressed: {
    opacity: 0.72,
  },
});
