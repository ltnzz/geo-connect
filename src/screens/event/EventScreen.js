import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import FeaturedEventCard from '../../components/event/FeaturedEventCard';
import NewEventCard from '../../components/event/NewEventCard';
import TrendingEventCard from '../../components/event/TrendingEventCard';
import EventSectionHeader from '../../components/event/EventSectionHeader';
import EmptyNearbyEvent from '../../components/event/EmptyNearbyEvent';
import EmptyNewEvent from '../../components/event/EmptyNewEvent';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';
import { firestoreService } from '../../services/firestoreService';
import { filterRecentEvents } from '../../utils/dateUtils';
import { calculateDistance } from '../../utils/locationUtils';
import { useLocation } from '../../hooks/useLocation';
import { useColors, radius, spacing } from '../../utils/theme';

const RADIUS_OPTIONS = [
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: 'City', value: 25 },
];

export default function EventScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trendingPlaces, setTrendingPlaces] = useState([]);
  const [selectedRadius, setSelectedRadius] = useState(5);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { events, isLoading, isOffline, fetchEvents } = useEventStore();
  const user = useAuthStore((state) => state.user);
  const {
    location,
    isFetchingLocation,
    handleGetLocation,
  } = useLocation();

  const refreshEvents = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchEvents(),
        handleGetLocation(false),
        firestoreService
          .getTrendingPlacesToday()
          .then(setTrendingPlaces)
          .catch(() => []),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (events.length === 0 && !isLoading) {
      fetchEvents();
    }
  }, [events.length, fetchEvents, isLoading]);

  useEffect(() => {
    handleGetLocation(false);
    firestoreService
      .getTrendingPlacesToday()
      .then(setTrendingPlaces)
      .catch(() => { });
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();


  const matchingReal = normalizedSearch
    ? events.filter((event) =>
      event.title?.toLowerCase().includes(normalizedSearch)
    )
    : events;

  // 1. Filter ALL search-matching events by distance first
  const nearbyEvents = location
    ? matchingReal
      .map((event) => {
        if (!event.location || !event.location.latitude || !event.location.longitude) return null;
        const dist = calculateDistance(
          location.latitude,
          location.longitude,
          event.location.latitude,
          event.location.longitude
        );
        if (dist === null || dist > selectedRadius) return null;
        return { ...event, distance: dist };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
    : [];

  // 2. Filter places by distance
  const nearbyPlaces = location
    ? trendingPlaces
      .map((place) => {
        if (!place.location || !place.location.latitude || !place.location.longitude) return null;
        const dist = calculateDistance(
          location.latitude,
          location.longitude,
          place.location.latitude,
          place.location.longitude
        );
        if (dist === null || dist > selectedRadius) return null;
        return { ...place, distance: dist };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
    : [];

  // 3. Derive section data from the distance-filtered arrays
  const newEvents = filterRecentEvents(nearbyEvents);

  const featuredEvent = nearbyEvents.length > 0 ? nearbyEvents[0] : null;

  const trendingEvents = nearbyEvents
    .filter(e => e.id !== featuredEvent?.id)
    .sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0))
    .slice(0, 5);

  const radiusLabel = RADIUS_OPTIONS.find((o) => o.value === selectedRadius)?.label ?? `${selectedRadius} km`;
  const nearbySubtitle = `Events within ${radiusLabel} of your location.`;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
        showSearch
        searchPlaceholder="Search events..."
      />
      {isOffline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline mode - showing cached events</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={refreshEvents}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Nearby Events</Text>
        <Text style={styles.subtitle}>{nearbySubtitle}</Text>

        <ScrollView
          contentContainerStyle={styles.radiusRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {RADIUS_OPTIONS.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => setSelectedRadius(option.value)}
              style={[
                styles.radiusPill,
                selectedRadius === option.value && styles.radiusPillActive,
              ]}
            >
              <Text
                style={[
                  styles.radiusPillText,
                  selectedRadius === option.value && styles.radiusPillTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading || isFetchingLocation ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} size="large" />
        ) : featuredEvent ? (
          <FeaturedEventCard
            event={featuredEvent}
            onOpen={() => navigation.navigate('EventDetail', { eventId: featuredEvent.id })}
          />
        ) : (
          <EmptyNearbyEvent radius={selectedRadius} />
        )}

        <EventSectionHeader
          buttonText="View all"
          onButtonPress={() => navigation.navigate('AllNewEvents')}
          showButton={newEvents.length > 0}
          title="New Events"
        />

        {newEvents.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.trendingList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {newEvents.slice(0, 5).map((item) => (
              <NewEventCard
                key={item.id}
                event={item}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyNewEvent />
        )}

        <EventSectionHeader
          buttonText="View map"
          onButtonPress={() => navigation.navigate('Maps')}
          title="Trending Places Today"
          showButton={nearbyPlaces.length > 0}
        />
        {nearbyPlaces.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.trendingList}
            data={nearbyPlaces}
            horizontal
            keyExtractor={(place) => place.id}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('VenueDetail', {
                    place: item,
                    placeId: item.id,
                  })
                }
                style={styles.placeCard}
              >
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.placeImage} />
                ) : (
                  <View style={styles.placeImage}>
                    <Ionicons color={colors.secondary} name="business" size={24} />
                  </View>
                )}
                <Text numberOfLines={1} style={styles.placeTitle}>{item.name}</Text>
                <Text numberOfLines={1} style={styles.placeMeta}>
                  {item.checkinsToday} check-ins today
                </Text>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.emptyNewEventsText}>No trending places in this radius.</Text>
        )}

        <EventSectionHeader
          buttonText="View map"
          onButtonPress={() => navigation.navigate('Maps')}
          title="Trending Spots"
          showButton={trendingEvents.length > 0}
        />
        {trendingEvents.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.trendingList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {trendingEvents.map((item) => (
              <TrendingEventCard
                key={item.id}
                event={item}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyNewEventsText}>No trending events in this radius.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
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
  trendingList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  radiusRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  radiusPill: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  radiusPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusPillText: {
    color: colors.neutral,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  radiusPillTextActive: {
    color: '#FFFFFF',
  },
  emptyNewEventsText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  placeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    width: 148,
  },
  placeImage: {
    alignItems: 'center',
    backgroundColor: `${colors.secondary}15`,
    height: 88,
    justifyContent: 'center',
    width: '100%',
  },
  placeTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  placeMeta: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: 2,
  },
  pressed: {
    opacity: 0.72,
  },
  offlineBanner: {
    backgroundColor: `${colors.secondary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  offlineText: {
    color: colors.secondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
});
