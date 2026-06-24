import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import StoryViewerModal from '../../components/story/StoryViewerModal';
import CreateStoryModal from '../../components/story/CreateStoryModal';
import StoryRingRow from '../../components/story/StoryRingRow';
import { firestoreService } from '../../services/firestoreService';
import { locationService } from '../../services/locationService';
import { imagePickerService } from '../../services/imagePickerService';
import { cloudinaryService } from '../../services/cloudinaryService';
import { useAuthStore } from '../../stores/authStore';
import { useLocation } from '../../hooks/useLocation';
import { calculateDistance } from '../../utils/locationUtils';
import { useColors, radius, spacing } from '../../utils/theme';

export default function VenueDetailScreen({ navigation, route }) {
  const placeId = route.params?.placeId;
  const user = useAuthStore((state) => state.user);
  const { location, isFetchingLocation, handleGetLocation } = useLocation();
  const [place, setPlace] = useState(route.params?.place || null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [venueStories, setVenueStories] = useState([]);
  const [viewerStories, setViewerStories] = useState([]);
  const [isStoryViewerVisible, setIsStoryViewerVisible] = useState(false);
  const [isCreateStoryVisible, setIsCreateStoryVisible] = useState(false);
  const [pickedImageUri, setPickedImageUri] = useState(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const loadVenue = async () => {
    if (!placeId) {
      return;
    }

    setIsLoading(true);
    try {
      const [nextPlace, nextLeaderboard, nextStories] = await Promise.all([
        firestoreService.getPlace(placeId),
        firestoreService.getPlaceLeaderboard(placeId),
        firestoreService.getVenueStories(placeId).catch(() => []),
      ]);

      setPlace(nextPlace);
      setLeaderboard(nextLeaderboard);
      setVenueStories(nextStories);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStory = async () => {
    if (!user?.uid) {
      Alert.alert('Login Required', 'Please log in to add stories.');
      return;
    }

    try {
      const picked = await imagePickerService.fromLibrary();
      if (!picked) return;

      setPickedImageUri(picked);
      setIsCreateStoryVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleShareStory = async (target) => {
    setIsUploadingStory(true);
    try {
      const uploadResult = await cloudinaryService.uploadImage(pickedImageUri, { folder: 'stories' });

      const storyData = {
        userId: user.uid,
        username: user?.username || 'aroundu',
        userAvatar: user?.avatarUrl || '',
        mediaUrl: uploadResult.url,
      };

      if (target.type === 'event') {
        storyData.eventId = target.id;
        storyData.eventTitle = target.title;
      } else if (target.type === 'place') {
        storyData.placeId = target.id;
        storyData.placeName = target.name;
      }

      await firestoreService.createStory(storyData);

      loadVenue();
      setIsCreateStoryVisible(false);
      setPickedImageUri(null);
      Alert.alert('Story Shared', `Your story was shared at: ${target.title || target.name}`);
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Something went wrong.');
    } finally {
      setIsUploadingStory(false);
    }
  };

  useEffect(() => {
    loadVenue();
    handleGetLocation();

    const unsubscribe = navigation.addListener('focus', () => {
      loadVenue();
    });

    return unsubscribe;
  }, [placeId, navigation]);

  const checkIn = async () => {
    if (!user?.uid || !place?.location || isCheckingIn) {
      return;
    }

    setIsCheckingIn(true);
    try {
      let currentLat, currentLong;
      if (location) {
        currentLat = location.latitude;
        currentLong = location.longitude;
      } else {
        const position = await locationService.getCurrentPosition();
        currentLat = position.coords.latitude;
        currentLong = position.coords.longitude;
      }

      const distanceKm = calculateDistance(
        currentLat,
        currentLong,
        place.location.latitude,
        place.location.longitude
      );

      if (distanceKm === null || distanceKm > 0.5) {
        Alert.alert(
          'Too Far',
          `You must be within 500 meters of the venue to check in.\nYou are currently ${
            distanceKm ? `${distanceKm.toFixed(1)} km` : 'unknown distance'
          } away.`
        );
        setIsCheckingIn(false);
        return;
      }

      await firestoreService.checkIn({
        userId: user.uid,
        placeId,
        location: {
          latitude: currentLat,
          longitude: currentLong,
        },
      });
      await loadVenue();
      Alert.alert('Checked in', `You checked in at ${place.name}.`);
    } catch (error) {
      Alert.alert(
        'Unable to check in',
        error.message || 'Failed to retrieve your current location. Please verify your GPS settings.'
      );
    } finally {
      setIsCheckingIn(false);
    }
  };

  const groupStoriesByUser = (allStories) => {
    const groups = {};
    allStories.forEach((story) => {
      if (!story.userId) return;
      if (!groups[story.userId]) {
        groups[story.userId] = {
          userId: story.userId,
          username: story.username || 'aroundu',
          userAvatar: story.userAvatar || '',
          stories: [],
        };
      }
      groups[story.userId].stories.push(story);
    });
    return Object.values(groups);
  };

  const groupedVenueStories = groupStoriesByUser(venueStories);
  const currentUserStoriesGroup = groupedVenueStories.find((g) => g.userId === user?.uid);
  const otherUsersStoriesGroups = groupedVenueStories.filter((g) => g.userId !== user?.uid);

  return (
    <View style={styles.screen}>
      <ScreenHeader showBack title="Venue Profile" />

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: colors.border, borderRadius: radius.lg }]} />
          <View style={{ height: 24, width: '60%', backgroundColor: colors.border, borderRadius: 4, marginTop: spacing.md }} />
          <View style={{ height: 16, width: '40%', backgroundColor: colors.border, borderRadius: 4, marginTop: spacing.xs }} />
          <View style={{ height: 16, width: '80%', backgroundColor: colors.border, borderRadius: 4, marginTop: spacing.sm }} />
          <View style={{ height: 64, width: '100%', backgroundColor: colors.border, borderRadius: radius.md, marginTop: spacing.md }} />
          <View style={{ height: 46, width: '100%', backgroundColor: colors.border, borderRadius: radius.sm, marginTop: spacing.md }} />
          <View style={{ height: 24, width: '40%', backgroundColor: colors.border, borderRadius: 4, marginTop: spacing.lg }} />
          <View style={{ height: 120, width: '100%', backgroundColor: colors.border, borderRadius: radius.md, marginTop: spacing.sm }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {place?.photoUrl ? (
              <Image source={{ uri: place.photoUrl }} style={styles.heroImage} />
            ) : (
              <Ionicons color={colors.secondary} name="business" size={48} />
            )}
          </View>

          <StoryRingRow
            style={styles.storyRow}
            currentUserAvatar={user?.avatarUrl}
            currentUserStories={currentUserStoriesGroup?.stories || []}
            groupedStories={otherUsersStoriesGroups}
            onCurrentUserRingPress={() => {
              if (currentUserStoriesGroup) {
                setViewerStories(currentUserStoriesGroup.stories);
                setIsStoryViewerVisible(true);
              }
            }}
            onRingPress={(group) => {
              setViewerStories(group.stories);
              setIsStoryViewerVisible(true);
            }}
            onAddStoryPress={handleAddStory}
          />

          <Text style={styles.title}>{place?.name || 'Venue'}</Text>
          <Text style={styles.meta}>
            {[place?.category, place?.city].filter(Boolean).join(' - ') || 'Nearby place'}
          </Text>
          <Text style={styles.address}>{place?.address || 'Address unavailable'}</Text>

          <View style={styles.stats}>
            {place?.rating && place.rating > 0 ? (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{place.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            ) : null}
            <View style={styles.stat}>
              <Text style={styles.statValue}>{place?.checkinsCount || 0}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isCheckingIn}
            onPress={checkIn}
            style={styles.checkinButton}
          >
            {isCheckingIn ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons color="#FFFFFF" name="location" size={17} />
                <Text style={styles.checkinText}>Check in</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.sectionTitle}>Venue leaderboard</Text>
          {leaderboard.length ? (
            leaderboard.map((entry, index) => (
              <View key={entry.id} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>#{index + 1}</Text>
                <Text style={styles.leaderName}>@{entry.username}</Text>
                <Text style={styles.leaderCount}>{entry.count}x</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No check-ins yet.</Text>
          )}

        </ScrollView>
      )}

      <StoryViewerModal
        visible={isStoryViewerVisible}
        stories={viewerStories}
        initialIndex={0}
        onClose={() => setIsStoryViewerVisible(false)}
      />

      <CreateStoryModal
        visible={isCreateStoryVisible}
        imageUri={pickedImageUri?.uri}
        places={place ? [{...place, type: 'place'}] : []}
        onShare={handleShareStory}
        isSharing={isUploadingStory}
        onClose={() => {
          setIsCreateStoryVisible(false);
          setPickedImageUri(null);
        }}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  storyRow: {
    marginTop: spacing.md,
    marginHorizontal: -spacing.md,
    marginBottom: 0,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: `${colors.secondary}15`,
    borderRadius: radius.lg,
    height: 140,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    marginTop: spacing.lg,
  },
  meta: {
    color: colors.secondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  address: {
    color: colors.mutedText,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  storySection: {
    marginTop: spacing.md,
  },
  stats: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: spacing.md,
  },
  statValue: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  statLabel: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  checkinButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 46,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  checkinText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginTop: spacing.lg,
  },
  leaderRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  leaderRank: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    width: 42,
  },
  leaderName: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
  },
  leaderCount: {
    color: colors.neutral,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: spacing.sm,
  },
});
