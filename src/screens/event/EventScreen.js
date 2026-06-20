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
import FeaturedEventCard from '../../components/event/FeaturedEventCard';
import NewEventCard from '../../components/event/NewEventCard';
import TrendingEventCard from '../../components/event/TrendingEventCard';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';
import { filterRecentEvents } from '../../utils/dateUtils';
import { calculateDistance } from '../../utils/locationUtils';
import { useLocation } from '../../hooks/useLocation';
import { colors, radius, spacing } from '../../utils/theme';



export default function EventScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { events, isLoading, fetchEvents } = useEventStore();
  const user = useAuthStore((s) => s.user);
  const { location, isFetchingLocation, handleGetLocation } = useLocation();

  useEffect(() => {
    if (events.length === 0 && !isLoading) {
      fetchEvents();
    }
    handleGetLocation();
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

      const nearbyEvents = location
    ? matchingReal.filter((event) => {
        if (event.creatorId === user?.uid) return false;
        if (!event.location || !event.location.latitude || !event.location.longitude) return false;
        const dist = calculateDistance(
          location.latitude,
          location.longitude,
          event.location.latitude,
          event.location.longitude
        );
        return dist !== null && dist <= 1; // within 1 km
      })
    : [];

  const featuredEvent = nearbyEvents.length > 0 ? nearbyEvents[0] : null;

  // We keep trending spots using all real events sorted by popularity or just slice it,
  // because DUMMY_EVENTS was removed. Let's use real events that have attendees.
  const trendingEvents = matchingReal
    .filter(e => e.id !== featuredEvent?.id)
    .sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0))
    .slice(0, 5);

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

        {isLoading || isFetchingLocation ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} size="large" />
        ) : featuredEvent ? (
          <FeaturedEventCard
            event={featuredEvent}
            onOpen={() => navigation.navigate('EventDetail', { eventId: featuredEvent.id })}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons color="#A5AFBD" name="location-outline" size={34} />
            <Text style={styles.emptyTitle}>No nearby events</Text>
            <Text style={styles.emptyText}>
              There are no events within a 1 km radius of your location.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Events</Text>
          {newEvents.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('AllNewEvents')}
              style={styles.viewMapButton}
            >
              <Text style={styles.viewMapText}>View all</Text>
              <Ionicons color={colors.primary} name="arrow-forward" size={13} />
            </Pressable>
          )}
        </View>

        {newEvents.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.trendingList}
            data={newEvents.slice(0, 5)}
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
