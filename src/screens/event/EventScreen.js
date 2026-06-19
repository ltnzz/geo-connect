import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import NewEventCard from '../../components/event/NewEventCard';
import { DUMMY_EVENTS } from '../../data/dummyEvents';
import { useEventStore } from '../../stores/eventStore';
import { filterRecentEvents } from '../../utils/dateUtils';
import { colors, radius, spacing } from '../../utils/theme';

function EventArtwork({ event, compact = false }) {
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
        { backgroundColor: '#E9F0FF' }, // Fallback color
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

function FeaturedEventCard({ event, onOpen }) {
  const [response, setResponse] = useState(null);

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
            onPress={() => setResponse(response === 'going' ? null : 'going')}
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
            onPress={() => setResponse(response === 'interested' ? null : 'interested')}
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

function TrendingEventCard({ event, onPress }) {
  let scheduleString = '';
  if (event.schedule) {
    scheduleString = event.schedule;
  } else if (event.startTime) {
    const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
    scheduleString = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const attendeesCount = event.attendees !== undefined ? event.attendees : (event.participantCount || 0);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.trendingCard, pressed && styles.pressed]}
    >
      <View style={styles.trendingArtworkWrap}>
        <EventArtwork compact event={event} />
        <View style={styles.trendingDistanceBadge}>
          <Text style={styles.trendingDistance}>Nearby</Text>
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

export default function EventScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { events, isLoading, fetchEvents } = useEventStore();

  useEffect(() => {
    if (events.length === 0 && !isLoading) {
      fetchEvents();
    }
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  
  // Real Events (for New Events section)
  const matchingReal = normalizedSearch
    ? events.filter((event) =>
        [
          event.title,
          event.location?.address,
          event.location?.city,
          event.description,
        ].some((value) => value?.toLowerCase().includes(normalizedSearch))
      )
    : events;

  const newEvents = filterRecentEvents(matchingReal);

  // Dummy Events (for Featured and Trending sections)
  const matchingDummy = normalizedSearch
    ? DUMMY_EVENTS.filter((event) =>
        [
          event.title,
          event.venue,
          event.category,
          event.status,
        ].some((value) => value.toLowerCase().includes(normalizedSearch))
      )
    : DUMMY_EVENTS;

  const featuredEvent = matchingDummy[0];
  const trendingEvents = matchingDummy.slice(1);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
        showSearch
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Nearby Events</Text>
        <Text style={styles.subtitle}>
          Curated happenings around your location.
        </Text>

        {isLoading && events.length === 0 ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} size="large" />
        ) : featuredEvent ? (
          <FeaturedEventCard
            event={featuredEvent}
            onOpen={() => navigation.navigate('EventDetail', { eventId: featuredEvent.id })}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons color="#A5AFBD" name="calendar-outline" size={34} />
            <Text style={styles.emptyTitle}>No matching events</Text>
            <Text style={styles.emptyText}>
              {normalizedSearch ? 'Try another event, venue, or category.' : 'No upcoming events right now.'}
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Events</Text>
        </View>

        {newEvents.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.trendingList}
            data={newEvents}
            horizontal
            keyExtractor={(event) => event.id}
            renderItem={({ item }) => (
              <NewEventCard
                event={item}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              />
            )}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.emptyNewEventsText}>No new events recently.</Text>
        )}

        {trendingEvents.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Spots</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Maps')}
                style={styles.viewMapButton}
              >
                <Text style={styles.viewMapText}>View map</Text>
                <Ionicons color={colors.primary} name="arrow-forward" size={13} />
              </Pressable>
            </View>

            <FlatList
              contentContainerStyle={styles.trendingList}
              data={trendingEvents}
              horizontal
              keyExtractor={(event) => event.id}
              renderItem={({ item }) => (
                <TrendingEventCard
                  event={item}
                  onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                />
              )}
              showsHorizontalScrollIndicator={false}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8F9FF',
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  heading: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    letterSpacing: -0.5,
    paddingHorizontal: spacing.md,
  },
  subtitle: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 3,
    paddingHorizontal: spacing.md,
  },
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
  artwork: {
    alignItems: 'center',
    height: 190,
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
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  viewMapButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  viewMapText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  trendingList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    minHeight: 260,
  },
  emptyTitle: {
    color: '#465268',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: spacing.xs,
  },
  emptyNewEventsText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.72,
  },
});
