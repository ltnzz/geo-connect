import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Alert, Image, Share, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import ScreenHeader from '../../components/common/ScreenHeader';
import { DUMMY_EVENTS } from '../../data/dummyEvents';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';
import { useLocation } from '../../hooks/useLocation';
import { calculateDistance } from '../../utils/locationUtils';
import { firestoreService } from '../../services/firestoreService';
import { colors, radius, spacing } from '../../utils/theme';

export default function EventDetailScreen({ route }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { location, handleGetLocation } = useLocation();
  const events = useEventStore((s) => s.events);
  const removeEvent = useEventStore((s) => s.removeEvent);
  const realEvent = events.find((item) => item.id === route.params?.eventId);
  const dummyEvent = DUMMY_EVENTS.find((item) => item.id === route.params?.eventId);
  
  const event = realEvent || dummyEvent || DUMMY_EVENTS[0];
  const [response, setResponse] = useState(null);

  const isReal = !!realEvent;
  const isOwnEvent = isReal && user && event.creatorId === user.uid;
  const title = event.title;
  const category = event.category || 'Event';
  const description = event.description;
  const venue = isReal ? (event.location?.city || event.location?.address || 'Nearby') : event.venue;

  const [hostName, setHostName] = useState('Loading...');

  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  useEffect(() => {
    if (isReal && event.creatorId) {
      if (user && event.creatorId === user.uid) {
        setHostName('You');
      } else {
        firestoreService.getUser(event.creatorId).then(creator => {
          if (creator && creator.username) {
            setHostName(creator.username);
          } else {
            setHostName('User');
          }
        }).catch(() => setHostName('User'));
      }
    }
  }, [isReal, event.creatorId, user]);

  const host = isReal ? hostName : event.host;
  const attendees = isReal ? (event.participantCount || 0) : event.attendees;
  
  let scheduleStr = event.schedule || '';
  if (isReal && event.startTime) {
    const startD = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
    const endD = event.endTime?.toDate ? event.endTime.toDate() : (event.endTime ? new Date(event.endTime) : startD);

    const startDateStr = startD.toLocaleDateString([], { day: 'numeric', month: 'short' });
    const endDateStr = endD.toLocaleDateString([], { day: 'numeric', month: 'short' });
    const startTimeStr = startD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (startDateStr === endDateStr) {
      scheduleStr = `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
    } else {
      scheduleStr = `${startDateStr} - ${endDateStr}\n${startTimeStr} - ${endTimeStr}`;
    }
  }

  const dist = location && event.location ? calculateDistance(
    location.latitude,
    location.longitude,
    event.location.latitude,
    event.location.longitude
  ) : null;
  const distanceStr = dist !== null ? `${dist.toFixed(1)} km away` : 'Nearby';

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
        <View style={[styles.hero, !isReal && { backgroundColor: event.color }, isReal && { backgroundColor: '#E9F0FF' }]}>
          {isReal && event.bannerUrl ? (
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
          <Text style={styles.hostText}>Hosted by {host}</Text>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons color={colors.neutral} name="calendar-outline" size={13} />
            <Text style={styles.chipText}>{scheduleStr}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons color={colors.primary} name="location" size={13} />
            <Text style={styles.chipText}>{isReal ? distanceStr : event.distance}</Text>
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
                  <Ionicons color="#8291A7" name="person" size={14} />
                </View>
              ))}
            </View>
            <Text style={styles.attendeeCount}>+{attendees} going</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {isOwnEvent ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={handleDeleteEvent}
              style={[styles.responseButton, { borderColor: '#FFE4E6', backgroundColor: '#FFF1F2' }]}
            >
              <Ionicons color="#E11D48" name="trash-outline" size={16} />
              <Text style={[styles.interestedText, { color: '#E11D48' }]}>Delete</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
              style={[styles.responseButton, styles.goingButton, styles.goingSelected]}
            >
              <Ionicons color="#FFFFFF" name="pencil" size={16} />
              <Text style={[styles.goingText, styles.goingTextSelected]}>Edit Event</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setResponse(response === 'interested' ? null : 'interested')
              }
              style={[
                styles.responseButton,
                response === 'interested' && styles.interestedSelected,
              ]}
            >
              <Ionicons
                color={
                  response === 'interested' ? colors.tertiary : colors.neutral
                }
                name={
                  response === 'interested' ? 'bookmark' : 'bookmark-outline'
                }
                size={16}
              />
              <Text
                style={[
                  styles.interestedText,
                  response === 'interested' && styles.interestedTextSelected,
                ]}
              >
                Interested
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setResponse(response === 'going' ? null : 'going')}
              style={[
                styles.responseButton,
                styles.goingButton,
                response === 'going' && styles.goingSelected,
              ]}
            >
              <Ionicons
                color={response === 'going' ? '#FFFFFF' : colors.primary}
                name={
                  response === 'going'
                    ? 'checkmark-circle'
                    : 'checkmark-circle-outline'
                }
                size={17}
              />
              <Text
                style={[
                  styles.goingText,
                  response === 'going' && styles.goingTextSelected,
                ]}
              >
                Going
              </Text>
            </Pressable>
          </>
        )}
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
  responseButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#C7D2E3',
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    justifyContent: 'center',
  },
  interestedSelected: {
    backgroundColor: '#EAF8F2',
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
    flex: 2,
  },
  goingText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  goingTextSelected: {
    color: '#FFFFFF',
  },
});
