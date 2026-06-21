import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Alert, Image, Share, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import ScreenHeader from '../../components/common/ScreenHeader';
import EventDetailFooter from '../../components/event/EventDetailFooter';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';
import { useLocation } from '../../hooks/useLocation';
import { useEventResponse } from '../../hooks/useEventResponse';
import { useHostName } from '../../hooks/useHostName';
import { formatEventSchedule } from '../../utils/dateUtils';
import { formatDistanceString } from '../../utils/locationUtils';
import { firestoreService } from '../../services/firestoreService';
import { colors, radius, spacing } from '../../utils/theme';
import EventStorySection from '../../components/event/EventStorySection';

export default function EventDetailScreen({ route }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { location, isFetchingLocation, handleGetLocation } = useLocation();
  const events = useEventStore((s) => s.events);
  const removeEvent = useEventStore((s) => s.removeEvent);
  const event = events.find((item) => item.id === route.params?.eventId);

  const { response, toggleGoing, toggleInterested } = useEventResponse(event?.id);
  const hostName = useHostName(event?.creatorId);

  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  if (!event) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Event not found.</Text>
      </View>
    );
  }

  const isOwnEvent = user && event.creatorId === user.uid;
  const title = event.title;
  const category = event.category || 'Event';
  const description = event.description;
  const venue = event.location?.city || event.location?.address || 'Nearby';
  const attendees = event.participantCount || 0;
  const scheduleStr = formatEventSchedule(event.startTime, event.endTime) || event.schedule || '';
  const distanceStr = formatDistanceString(location, event.location, isFetchingLocation);

  const shareEvent = () =>
    Share.share({
      message: `${title}\n${scheduleStr} at ${venue}`,
      title: title,
    });

  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.deleteEvent(event.id);
              removeEvent(event.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        onRightPress={shareEvent}
        rightIcon="share-social-outline"
        rightLabel="Share event"
        showBack
        showRightOnBack
        title="Event Details"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: '#E9F0FF' }]}>
          {event.bannerUrl ? (
            <Image source={{ uri: event.bannerUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroIcon}>
              <Ionicons color={colors.primary} name="musical-notes" size={38} />
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <View style={styles.hostRow}>
          <View style={styles.hostAvatar}>
            <Ionicons color={colors.primary} name="people" size={15} />
          </View>
          <Text style={styles.hostText}>Hosted by {hostName}</Text>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons color={colors.neutral} name="calendar-outline" size={13} />
            <Text style={styles.chipText}>{scheduleStr}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons color={colors.primary} name="location" size={13} />
            <Text style={styles.chipText}>{distanceStr}</Text>
          </View>
        </View>

        <View style={styles.venueRow}>
          <Ionicons color={colors.primary} name="navigate-circle-outline" size={20} />
          <Text style={styles.venueText}>{venue}</Text>
        </View>

        <Text style={styles.description}>{description}</Text>

        <EventStorySection eventId={event.id} eventLocation={event.location} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <EventDetailFooter
          isOwnEvent={isOwnEvent}
          response={response}
          onDelete={handleDeleteEvent}
          onEdit={() => navigation.navigate('EditEvent', { eventId: event.id })}
          onToggleGoing={toggleGoing}
          onToggleInterested={toggleInterested}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8F9FF',
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 245,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.full,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  categoryBadge: {
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: radius.full,
    bottom: spacing.md,
    paddingHorizontal: 11,
    paddingVertical: 5,
    position: 'absolute',
    right: spacing.md,
  },
  categoryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    letterSpacing: -0.6,
    lineHeight: 30,
    marginTop: spacing.lg,
  },
  hostRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  hostAvatar: {
    alignItems: 'center',
    backgroundColor: '#E9F0FF',
    borderRadius: radius.full,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  hostText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginLeft: 7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#DFE5EE',
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    color: '#526173',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  venueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  venueText: {
    color: colors.mutedText,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginLeft: 6,
  },
  description: {
    color: '#566275',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  storyCard: {
    backgroundColor: colors.surface,
    borderColor: '#E0E6EF',
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
    shadowColor: '#64748B',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  storyTitle: {
    color: '#344054',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  attendeeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  avatars: {
    height: 30,
    width: 76,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#F1F4F9',
    borderColor: '#FFFFFF',
    borderRadius: radius.full,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    width: 30,
  },
  attendeeCount: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: '#E0E6EF',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
});
