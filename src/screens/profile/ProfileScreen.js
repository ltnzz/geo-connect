import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

import ScreenHeader from '../../components/common/ScreenHeader';
import NewEventCard from '../../components/event/NewEventCard';
import ProfileLocationPicker from '../../components/profile/ProfileLocationPicker';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';
import { firestoreService } from '../../services/firestoreService';
import { useColors, radius, spacing } from '../../utils/theme';


const POST_COLORS = ['#E9F0FF', '#E9FDF5', '#FFF7E8', '#F3E8FF', '#FFECEF'];

const formatCount = (value) => {
  const count = Number(value) || 0;

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(count >= 10000000 ? 0 : 1)}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  }

  return String(count);
};

const getPostLocationLabel = (post) => {
  if (typeof post.location === 'string') {
    return post.location;
  }

  return post.location?.address || post.location?.city || post.placeName || 'AroundU';
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeSegment, setActiveSegment] = useState('posts');
  const [profilePosts, setProfilePosts] = useState([]);
  const { width: screenWidth } = useWindowDimensions();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const segments = ['posts', 'events', 'saved'];
  const activeIndex = segments.indexOf(activeSegment);

  const translateX = useSharedValue(0);

  useEffect(() => {
    setIsTransitioning(true);
    translateX.value = withSpring(-activeIndex * screenWidth, { damping: 20, stiffness: 90 }, (finished) => {
      if (finished) {
        runOnJS(setIsTransitioning)(false);
      }
    });
  }, [activeIndex, screenWidth]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-5, 5])
      .onStart(() => {
        runOnJS(setIsTransitioning)(true);
      })
      .onUpdate((event) => {
        translateX.value = -activeIndex * screenWidth + event.translationX;
      })
      .onEnd((event) => {
        const dragLimit = screenWidth * 0.2;
        const velocity = event.velocityX;
        let nextIndex = activeIndex;

        if (event.translationX > dragLimit || velocity > 500) {
          nextIndex = Math.max(0, activeIndex - 1);
        } else if (event.translationX < -dragLimit || velocity < -500) {
          nextIndex = Math.min(segments.length - 1, activeIndex + 1);
        }

        if (nextIndex !== activeIndex) {
          runOnJS(setActiveSegment)(segments[nextIndex]);
        } else {
          translateX.value = withSpring(-activeIndex * screenWidth, { damping: 20, stiffness: 90 }, (finished) => {
            if (finished) {
              runOnJS(setIsTransitioning)(false);
            }
          });
        }
      });
  }, [activeIndex, screenWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const getPageStyle = (tabName) => {
    const isActive = activeSegment === tabName;
    if (isActive || isTransitioning) {
      return { width: screenWidth };
    }
    return { width: screenWidth, height: 0, overflow: 'hidden' };
  };

  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [savedPosts, setSavedPosts] = useState([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState('');
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    city: user?.city || '',
    profileLocation: user?.profileLocation || null,
  });

  const username = user?.username || 'aroundu';
  const city = user?.city || 'Jakarta';
  const visiblePosts = activeSegment === 'posts' ? profilePosts : savedPosts;
  const events = useEventStore((state) => state.events);
  const fetchEvents = useEventStore((state) => state.fetchEvents);
  const isEventsLoading = useEventStore((state) => state.isLoading);
  const userEvents = events.filter((e) => e.creatorId === user?.uid);

  useEffect(() => {
    if (activeSegment === 'events' && events.length === 0 && !isEventsLoading) {
      fetchEvents();
    }
  }, [activeSegment, events.length, isEventsLoading, fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        return undefined;
      }

      let isActive = true;

      setIsPostsLoading(true);
      setPostsError('');

      Promise.all([
        firestoreService.getUser(user.uid),
        firestoreService.getUserPosts(user.uid),
        firestoreService.getBookmarkedPostIds(user.uid),
      ])
        .then(async ([profile, posts, bookmarkedIds]) => {
          const likedIds = posts.length
            ? await firestoreService.getLikedPostIds(posts.map((p) => p.id), user.uid)
            : new Set();

          const enrichedPosts = posts.map((p) => ({
            ...p,
            isLiked: likedIds.has(p.id),
            isBookmarked: bookmarkedIds.has(p.id),
          }));

          if (isActive) {
            if (profile) {
              updateCurrentUser({
                followersCount: profile.followersCount ?? 0,
                followingCount: profile.followingCount ?? 0,
                postsCount: profile.postsCount ?? enrichedPosts.length,
              });
            }
            setProfilePosts(enrichedPosts);
          }
        })
        .catch(() => {
          if (isActive) {
            setPostsError('Unable to load your posts.');
          }
        })
        .finally(() => {
          if (isActive) {
            setIsPostsLoading(false);
          }
        });

      return () => {
        isActive = false;
      };
    }, [updateCurrentUser, user?.uid]),
  );

  useEffect(() => {
    if (activeSegment !== 'saved' || !user?.uid) {
      return;
    }

    let isActive = true;
    setIsSavedLoading(true);
    setSavedError('');

    Promise.all([
      firestoreService.getBookmarkedPosts(user.uid),
      firestoreService.getBookmarkedPostIds(user.uid),
    ])
      .then(async ([posts, bookmarkedIds]) => {
        const likedIds = posts.length
          ? await firestoreService.getLikedPostIds(posts.map((p) => p.id), user.uid)
          : new Set();

        const enrichedPosts = posts.map((p) => ({
          ...p,
          isLiked: likedIds.has(p.id),
          isBookmarked: bookmarkedIds.has(p.id),
        }));

        if (isActive) {
          setSavedPosts(enrichedPosts);
        }
      })
      .catch(() => {
        if (isActive) {
          setSavedError('Unable to load saved posts.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsSavedLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [activeSegment, user?.uid]);

  const openEditProfile = () => {
    setEditForm({
      username: user?.username || '',
      bio: user?.bio || '',
      city: user?.city || '',
      profileLocation: user?.profileLocation || null,
    });
    setIsEditVisible(true);
  };

  const updateEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user?.uid || isSavingProfile) {
      return;
    }

    const updates = {
      username: editForm.username.trim().toLowerCase(),
      bio: editForm.bio.trim(),
      city: editForm.city.trim(),
      profileLocation: editForm.profileLocation,
    };

    if (!updates.username) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await firestoreService.updateUser(user.uid, updates);
      updateCurrentUser(updates);
      setIsEditVisible(false);
    } catch {
      Alert.alert('Unable to save profile', 'Please check your connection and try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.screen}>
        <ScreenHeader
        onRightPress={() => navigation.navigate('Settings')}
        rightIcon="settings-outline"
        rightLabel="Account settings"
        title="Profile"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatar}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons color={colors.neutral} name="person-outline" size={44} />
          )}
        </View>

        <Text numberOfLines={1} style={styles.name}>
          @{username}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons color={colors.neutral} name="location-outline" size={13} />
          <Text numberOfLines={1} style={styles.metaText}>
            {city}
          </Text>
        </View>

        {user?.bio ? (
          <Text style={styles.bioText}>{user.bio}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={openEditProfile}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCount(user?.postsCount)}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.divider} />
          <Pressable
            accessibilityLabel="View followers"
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('Connections', {
                initialType: 'followers',
                userId: user?.uid,
              })
            }
            style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
          >
            <Text style={styles.statValue}>{formatCount(user?.followersCount)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            accessibilityLabel="View following"
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('Connections', {
                initialType: 'following',
                userId: user?.uid,
              })
            }
            style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
          >
            <Text style={styles.statValue}>{formatCount(user?.followingCount)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </Pressable>
        </View>

        <View style={styles.segments}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSegment === 'posts' }}
            onPress={() => setActiveSegment('posts')}
            style={[
              styles.segmentButton,
              activeSegment === 'posts' && styles.segmentButtonActive,
            ]}
          >
            <Ionicons
              color={activeSegment === 'posts' ? colors.primary : colors.neutral}
              name="grid-outline"
              size={17}
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'posts' && styles.segmentTextActive,
              ]}
            >
              Posts
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSegment === 'events' }}
            onPress={() => setActiveSegment('events')}
            style={[
              styles.segmentButton,
              activeSegment === 'events' && styles.segmentButtonActive,
            ]}
          >
            <Ionicons
              color={activeSegment === 'events' ? colors.primary : colors.neutral}
              name="calendar-outline"
              size={17}
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'events' && styles.segmentTextActive,
              ]}
            >
              Events
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSegment === 'saved' }}
            onPress={() => setActiveSegment('saved')}
            style={[
              styles.segmentButton,
              activeSegment === 'saved' && styles.segmentButtonActive,
            ]}
          >
            <Ionicons
              color={activeSegment === 'saved' ? colors.primary : colors.neutral}
              name="bookmark-outline"
              size={17}
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'saved' && styles.segmentTextActive,
              ]}
            >
              Saved
            </Text>
          </Pressable>
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.tabContainer, animatedStyle, { width: screenWidth * 3 }]}>
            {/* Posts Page */}
            <View style={getPageStyle('posts')}>
              {isPostsLoading ? (
                <View style={styles.feedState}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.feedStateText}>Loading your posts...</Text>
                </View>
              ) : postsError ? (
                <View style={styles.feedState}>
                  <Ionicons color={colors.danger} name="alert-circle-outline" size={25} />
                  <Text style={styles.feedStateText}>{postsError}</Text>
                </View>
              ) : profilePosts.length === 0 ? (
                <View style={styles.feedState}>
                  <Ionicons color={colors.neutral} name="grid-outline" size={28} />
                  <Text style={styles.feedStateTitle}>No posts yet</Text>
                  <Text style={styles.feedStateText}>
                    Posts you create will appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.feedGrid}>
                  {profilePosts.map((post, index) => (
                    <Pressable
                      accessibilityLabel={`Post at ${getPostLocationLabel(post)}`}
                      accessibilityRole="button"
                      key={post.id}
                      onPress={() =>
                        navigation.navigate('ProfileFeed', {
                          initialPostId: post.id,
                          posts: profilePosts,
                          title: 'Posts',
                        })
                      }
                      style={({ pressed }) => [
                        styles.feedItem,
                        {
                          backgroundColor:
                            post.color ||
                            POST_COLORS[index % POST_COLORS.length],
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      {post.imageUrl ? (
                        <Image source={{ uri: post.imageUrl }} style={styles.feedImage} />
                      ) : null}
                      <View style={styles.feedOverlay}>
                        <Ionicons color="#FFFFFF" name="location" size={13} />
                        <Text numberOfLines={1} style={styles.feedLocation}>
                          {getPostLocationLabel(post)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Events Page */}
            <View style={getPageStyle('events')}>
              {isEventsLoading ? (
                <View style={styles.feedState}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.feedStateText}>Loading events...</Text>
                </View>
              ) : userEvents.length === 0 ? (
                <View style={styles.feedState}>
                  <Ionicons color={colors.neutral} name="calendar-outline" size={28} />
                  <Text style={styles.feedStateTitle}>No events created yet</Text>
                  <Text style={styles.feedStateText}>
                    Events you create will appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.feedGrid}>
                  {userEvents.map((event) => (
                    <Pressable
                      accessibilityLabel={`Event at ${event.location?.address}`}
                      accessibilityRole="button"
                      key={event.id}
                      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                      style={({ pressed }) => [
                        styles.feedItem,
                        { backgroundColor: colors.background },
                        pressed && styles.pressed,
                      ]}
                    >
                      {event.bannerUrl ? (
                        <Image source={{ uri: event.bannerUrl }} style={styles.feedImage} />
                      ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons color={colors.primary} name="calendar" size={28} />
                        </View>
                      )}
                      <View style={styles.feedOverlay}>
                        <Ionicons color="#FFFFFF" name="location" size={13} />
                        <Text numberOfLines={1} style={styles.feedLocation}>
                          {event.location?.city || event.location?.address || 'Nearby'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Saved Page */}
            <View style={getPageStyle('saved')}>
              {isSavedLoading ? (
                <View style={styles.feedState}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.feedStateText}>Loading saved posts...</Text>
                </View>
              ) : savedError ? (
                <View style={styles.feedState}>
                  <Ionicons color={colors.danger} name="alert-circle-outline" size={25} />
                  <Text style={styles.feedStateText}>{savedError}</Text>
                </View>
              ) : savedPosts.length === 0 ? (
                <View style={styles.feedState}>
                  <Ionicons color={colors.neutral} name="bookmark-outline" size={28} />
                  <Text style={styles.feedStateTitle}>No saved posts yet</Text>
                  <Text style={styles.feedStateText}>
                    Posts you bookmark will appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.feedGrid}>
                  {savedPosts.map((post, index) => (
                    <Pressable
                      accessibilityLabel={`Post at ${getPostLocationLabel(post)}`}
                      accessibilityRole="button"
                      key={post.id}
                      onPress={() =>
                        navigation.navigate('ProfileFeed', {
                          initialPostId: post.id,
                          posts: savedPosts,
                          title: 'Saved',
                        })
                      }
                      style={({ pressed }) => [
                        styles.feedItem,
                        {
                          backgroundColor:
                            post.color ||
                            POST_COLORS[index % POST_COLORS.length],
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      {post.imageUrl ? (
                        <Image source={{ uri: post.imageUrl }} style={styles.feedImage} />
                      ) : null}
                      <View style={styles.feedOverlay}>
                        <Ionicons color="#FFFFFF" name="location" size={13} />
                        <Text numberOfLines={1} style={styles.feedLocation}>
                          {getPostLocationLabel(post)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        </GestureDetector>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsEditVisible(false)}
        transparent
        visible={isEditVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Profile</Text>
              <Pressable
                accessibilityLabel="Close edit profile"
                accessibilityRole="button"
                onPress={() => setIsEditVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons color={colors.neutral} name="close" size={22} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={(value) => updateEditField('username', value)}
              placeholder="username"
              placeholderTextColor={colors.neutral}
              style={styles.input}
              value={editForm.username}
            />

            <Text style={styles.inputLabel}>Location</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsLocationPickerVisible(true)}
              style={styles.locationPickerButton}
            >
              <View style={styles.locationPickerIcon}>
                <Ionicons color={colors.primary} name="map-outline" size={18} />
              </View>
              <View style={styles.locationPickerCopy}>
                <Text style={styles.locationPickerText}>
                  {editForm.city || editForm.profileLocation?.address || 'Pick from map'}
                </Text>
                <Text style={styles.locationPickerHint}>
                  Tap to choose your profile location
                </Text>
              </View>
              <Ionicons color={colors.neutral} name="chevron-forward" size={18} />
            </Pressable>

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              multiline
              onChangeText={(value) => updateEditField('bio', value)}
              placeholder="Tell people what you are into"
              placeholderTextColor={colors.neutral}
              style={[styles.input, styles.bioInput]}
              value={editForm.bio}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isSavingProfile}
              onPress={saveProfile}
              style={[styles.saveButton, isSavingProfile && styles.saveButtonDisabled]}
            >
              {isSavingProfile ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Profile</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <ProfileLocationPicker
        onClose={() => setIsLocationPickerVisible(false)}
        onSelect={(location) => {
          setEditForm((current) => ({
            ...current,
            city: location.city || location.address || current.city,
            profileLocation: location,
          }));
          setIsLocationPickerVisible(false);
        }}
        visible={isLocationPickerVisible}
      />
      </View>
    </GestureHandlerRootView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 92,
    justifyContent: 'center',
    marginTop: 22,
    overflow: 'hidden',
    shadowColor: colors.neutral,
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    width: 92,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  name: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 19,
    marginTop: 14,
    maxWidth: '88%',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 2,
    maxWidth: '90%',
  },
  metaText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  bioText: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    maxWidth: '88%',
    textAlign: 'center',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginTop: 14,
    width: 156,
  },
  editButtonText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  statsCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    height: 76,
    marginTop: 34,
    paddingHorizontal: 8,
    shadowColor: colors.neutral,
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    width: '100%',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  statLabel: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginTop: 1,
  },
  divider: {
    backgroundColor: colors.border,
    height: 34,
    width: StyleSheet.hairlineWidth,
  },
  segments: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: 28,
  },
  segmentButton: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingBottom: 10,
  },
  segmentButtonActive: {
    borderBottomColor: colors.primary,
  },
  segmentText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  feedGrid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 12,
  },
  eventList: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: spacing.xs,
  },
  feedItem: {
    aspectRatio: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '32.9%',
  },
  feedImage: {
    ...StyleSheet.absoluteFillObject,
    height: undefined,
    width: undefined,
  },
  feedOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  feedLocation: {
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 8,
  },
  feedState: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 150,
    paddingHorizontal: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  feedStateTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    marginTop: spacing.sm,
  },
  feedStateText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15,23,42,0.46)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  editSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
  },
  closeButton: {
    padding: spacing.xs,
  },
  inputLabel: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  bioInput: {
    minHeight: 86,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  locationPickerButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  locationPickerIcon: {
    alignItems: 'center',
    backgroundColor: `${colors.primary}1A`,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 34,
  },
  locationPickerCopy: {
    flex: 1,
  },
  locationPickerText: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  locationPickerHint: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginTop: 1,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 46,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.72,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
});
