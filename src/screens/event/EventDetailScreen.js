import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image, Share, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, useMemo } from 'react';

import ScreenHeader from '../../components/common/ScreenHeader';
import { EVENT_RSVP } from '../../constants/firestore';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';
import { useLocation } from '../../hooks/useLocation';
import { useEventResponse } from '../../hooks/useEventResponse';
import { useHostName } from '../../hooks/useHostName';
import { formatEventSchedule } from '../../utils/dateUtils';
import { formatDistanceString } from '../../utils/locationUtils';
import { firestoreService } from '../../services/firestoreService';
import { imagePickerService } from '../../services/imagePickerService';
import { cloudinaryService } from '../../services/cloudinaryService';
import StoryViewerModal from '../../components/story/StoryViewerModal';
import { useColors, radius, spacing } from '../../utils/theme';
import EventDetailFooter from '../../components/event/EventDetailFooter';
import EventArtwork from '../../components/event/EventArtwork';

export default function EventDetailScreen({ route }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { location, isFetchingLocation, handleGetLocation } = useLocation();
  const events = useEventStore((s) => s.events);
  const removeEvent = useEventStore((s) => s.removeEvent);
  const event = events.find((item) => item.id === route.params?.eventId);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isReal = true;

  const [stories, setStories] = useState([]);
  const [isStoryViewerVisible, setIsStoryViewerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadStories = async () => {
    if (!event?.id) return;
    try {
      const activeStories = await firestoreService.getEventStories(event.id);
      setStories(activeStories);
    } catch (err) {
      console.warn('Failed to load event stories:', err);
    }
  };

  useEffect(() => {
    loadStories();
  }, [event?.id]);

  const handleAddStory = async () => {
    if (!user?.uid) {
      Alert.alert('Login Required', 'Please log in to add a story.');
      return;
    }

    try {
      const picked = await imagePickerService.fromLibrary();
      if (!picked) return;

      setIsUploading(true);
      Alert.alert('Uploading Story', 'Please wait...', [], { cancelable: false });

      const uploadResult = await cloudinaryService.uploadImage(picked, { folder: 'stories' });
      await firestoreService.createStory({
        userId: user.uid,
        username: user.username || 'aroundu',
        userAvatar: user.avatarUrl || '',
        mediaUrl: uploadResult.url,
        eventId: event.id,
        eventTitle: event.title,
      });

      loadStories();
      Alert.alert('Success', 'Story uploaded successfully!');
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Something went wrong.');
    } finally {
      setIsUploading(false);
    }
  };

  const { response, toggleGoing, toggleInterested, toggleNotGoing } = useEventResponse(event?.id);
  const hostName = useHostName(event?.creatorId);

  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  if (!event) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          onBack={() => navigation.goBack()}
          showBack
          title="Event Expired"
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={64} color={colors.neutral} />
          <Text style={{ color: colors.text, marginTop: 16, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>
            Event Expired or Not Found
          </Text>
          <Text style={{ color: colors.neutral, marginTop: 8, fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
            This event has ended or no longer exists.
          </Text>
        </View>
      </View>
    );
  }

  const isOwnEvent = user && event.creatorId === user.uid;
  const title = event.title;
  const category = event.category || 'Event';
  const description = event.description;
  const venue = isReal ? (event.location?.city || event.location?.address || 'Nearby') : event.venue;
  const host = isReal ? hostName : event.host || 'User';
  const attendees = event.participantCount || 0;
  const distanceStr = formatDistanceString(location, event.location, isFetchingLocation);

  let scheduleStr = event.schedule || '';
  if (isReal && event.startTime) {
    const d = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
    scheduleStr = d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }

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
        <EventArtwork event={event} />

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
          <View style={styles.chip}>
            <Ionicons color={colors.secondary} name="people" size={13} />
            <Text style={styles.chipText}>{attendees} attendees</Text>
          </View>
        </View>

        <View style={styles.venueRow}>
          <Ionicons color={colors.primary} name="navigate-circle-outline" size={20} />
          <Text style={styles.venueText}>{venue}</Text>
        </View>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>Attendees & Event Story</Text>
          <View style={styles.attendeeRow}>
            <View style={styles.avatars}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={[styles.avatar, { left: index * 20 }]}>
                  <Ionicons color={colors.neutral} name="person" size={14} />
                </View>
              ))}
            </View>
            <Text style={styles.attendeeCount}>
              +{event.participantCount || attendees} going - {event.registrationCount || 0} RSVP
            </Text>
          </View>

          {/* Active Stories List */}
          <Text style={styles.subSectionTitle}>Active Stories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
            <Pressable onPress={handleAddStory} style={styles.addStoryThumbnail}>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.addStoryText}>Add Story</Text>
            </Pressable>

            {stories.map((story, index) => (
              <Pressable
                key={story.id}
                onPress={() => {
                  setIsStoryViewerVisible(true);
                }}
                style={styles.storyThumbnailWrapper}
              >
                <Image source={{ uri: story.mediaUrl }} style={styles.storyThumbnail} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <StoryViewerModal
        visible={isStoryViewerVisible}
        stories={stories}
        initialIndex={0}
        onClose={() => setIsStoryViewerVisible(false)}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <EventDetailFooter
          isOwnEvent={isOwnEvent}
          response={response}
          onDelete={handleDeleteEvent}
          onEdit={() => navigation.navigate('EditEvent', { eventId: event.id })}
          onToggleGoing={toggleGoing}
          onToggleInterested={toggleInterested}
          onToggleNotGoing={toggleNotGoing}
        />
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
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
    backgroundColor: `${colors.primary}1A`,
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
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    color: colors.mutedText,
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
    color: colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  storyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
    shadowColor: colors.neutral,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  storyTitle: {
    color: colors.text,
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
    backgroundColor: colors.background,
    borderColor: colors.surface,
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
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  responseButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    justifyContent: 'center',
  },
  interestedSelected: {
    backgroundColor: `${colors.tertiary}1A`,
    borderColor: colors.tertiary,
  },
  interestedText: {
    color: colors.neutral,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  interestedTextSelected: {
    color: colors.tertiary,
  },
  goingSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goingButton: {
    flex: 1,
  },
  goingText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  goingTextSelected: {
    color: '#FFFFFF',
  },
  notGoingSelected: {
    backgroundColor: `${colors.danger}1A`,
    borderColor: colors.danger,
  },
  notGoingTextSelected: {
    color: colors.danger,
  },
  subSectionTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    marginTop: spacing.md,
  },
  storiesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  addStoryThumbnail: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  addStoryText: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    marginTop: 4,
  },
  storyThumbnailWrapper: {
    borderRadius: radius.sm,
    height: 70,
    overflow: 'hidden',
    width: 70,
  },
  storyThumbnail: {
    height: '100%',
    width: '100%',
  },
});
