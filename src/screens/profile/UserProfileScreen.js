import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import { firestoreService } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { useColors, radius, spacing } from '../../utils/theme';
import { POST_LOCATION_VISIBILITY } from '../../constants/firestore';

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

  if (post.location?.visibility === POST_LOCATION_VISIBILITY.hidden) {
    return 'AroundU';
  }

  if (post.location?.visibility === POST_LOCATION_VISIBILITY.city) {
    return post.location?.city || 'AroundU';
  }

  return post.location?.address || post.location?.city || post.placeName || 'AroundU';
};

export default function UserProfileScreen({ route }) {
  const navigation = useNavigation();
  const currentUserId = useAuthStore((state) => state.user?.uid);
  const targetUserId = route.params?.userId;
  
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeSegment, setActiveSegment] = useState('posts');
  const [profileUser, setProfileUser] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const checkFollowing = useFeedStore((s) => s.checkFollowing);
  const followingByUser = useFeedStore((s) => s.followingByUser);
  const toggleFollowAction = useFeedStore((s) => s.toggleFollow);

  const isFollowing = !!followingByUser[targetUserId];

  useEffect(() => {
    if (currentUserId && targetUserId) {
      checkFollowing(currentUserId, targetUserId);
    }
  }, [checkFollowing, currentUserId, targetUserId]);

  useEffect(() => {
    if (!targetUserId) {
      setError('User not found.');
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError('');

    Promise.all([
      firestoreService.getUser(targetUserId),
      firestoreService.getUserPosts(targetUserId),
      firestoreService.getEventsByCreator(targetUserId).catch(() => []),
    ])
      .then(([profile, posts, events]) => {
        if (isActive) {
          if (profile) {
            setProfileUser(profile);
            setProfilePosts(posts);
            setUserEvents(events);
          } else {
            setError('User not found.');
          }
        }
      })
      .catch(() => {
        if (isActive) {
          setError('Unable to load profile.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [targetUserId]);

  const handleFollowPress = async () => {
    if (!currentUserId || !targetUserId) return;
    

    const delta = isFollowing ? -1 : 1;
    setProfileUser((prev) => ({
      ...prev,
      followersCount: Math.max(0, (prev?.followersCount || 0) + delta)
    }));

    await toggleFollowAction(currentUserId, targetUserId);
  };

  const username = profileUser?.username || 'someone';
  const city = profileUser?.city || 'Unknown Location';

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader showBack title="Profile" />
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !profileUser) {
    return (
      <View style={styles.screen}>
        <ScreenHeader showBack title="Profile" />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error || 'Profile not available'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader showBack title={username} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          {profileUser?.avatarUrl ? (
            <Image source={{ uri: profileUser.avatarUrl }} style={styles.avatarImage} />
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

        {profileUser?.bio ? (
          <Text style={styles.bioText}>{profileUser.bio}</Text>
        ) : null}

        {currentUserId !== targetUserId && (
          <Pressable
            accessibilityRole="button"
            onPress={handleFollowPress}
            style={({ pressed }) => [
              styles.followButton,
              isFollowing && styles.followingButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        )}

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCount(profileUser?.postsCount || profilePosts.length)}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Connections', { initialType: 'followers', userId: targetUserId })}
            style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
          >
            <Text style={styles.statValue}>{formatCount(profileUser?.followersCount)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Connections', { initialType: 'following', userId: targetUserId })}
            style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
          >
            <Text style={styles.statValue}>{formatCount(profileUser?.followingCount)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </Pressable>
        </View>

        <View style={styles.segments}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSegment === 'posts' }}
            onPress={() => setActiveSegment('posts')}
            style={[styles.segmentButton, activeSegment === 'posts' && styles.segmentButtonActive]}
          >
            <Ionicons color={activeSegment === 'posts' ? colors.primary : colors.neutral} name="grid-outline" size={17} />
            <Text style={[styles.segmentText, activeSegment === 'posts' && styles.segmentTextActive]}>Posts</Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSegment === 'events' }}
            onPress={() => setActiveSegment('events')}
            style={[styles.segmentButton, activeSegment === 'events' && styles.segmentButtonActive]}
          >
            <Ionicons color={activeSegment === 'events' ? colors.primary : colors.neutral} name="calendar-outline" size={17} />
            <Text style={[styles.segmentText, activeSegment === 'events' && styles.segmentTextActive]}>Events</Text>
          </Pressable>
        </View>

        {activeSegment === 'posts' && (
          <View style={{ width: '100%' }}>
            {profilePosts.length === 0 ? (
              <View style={styles.feedState}>
                <Ionicons color={colors.neutral} name="grid-outline" size={28} />
                <Text style={styles.feedStateTitle}>No posts yet</Text>
              </View>
            ) : (
              <View style={styles.feedGrid}>
                {profilePosts.map((post, index) => (
                  <Pressable
                    key={post.id}
                    onPress={() => navigation.navigate('ProfileFeed', { initialPostId: post.id, posts: profilePosts, title: 'Posts' })}
                    style={({ pressed }) => [
                      styles.feedItem,
                      { backgroundColor: post.color || POST_COLORS[index % POST_COLORS.length] },
                      pressed && styles.pressed,
                    ]}
                  >
                    {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.feedImage} /> : null}
                    <View style={styles.feedOverlay}>
                      <Ionicons color="#FFFFFF" name="location" size={13} />
                      <Text numberOfLines={1} style={styles.feedLocation}>{getPostLocationLabel(post)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {activeSegment === 'events' && (
          <View style={{ width: '100%' }}>
            {userEvents.length === 0 ? (
              <View style={styles.feedState}>
                <Ionicons color={colors.neutral} name="calendar-outline" size={28} />
                <Text style={styles.feedStateTitle}>No events yet</Text>
              </View>
            ) : (
              <View style={styles.feedGrid}>
                {userEvents.map((event) => (
                  <Pressable
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
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontFamily: 'Poppins_400Regular' },
  content: { alignItems: 'center', paddingBottom: spacing.xl, paddingHorizontal: spacing.md },
  avatar: {
    alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg,
    borderWidth: 1, height: 92, justifyContent: 'center', marginTop: 22, overflow: 'hidden', width: 92,
  },
  avatarImage: { height: '100%', width: '100%' },
  name: { color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: 19, marginTop: 14, maxWidth: '88%' },
  metaRow: { alignItems: 'center', flexDirection: 'row', marginTop: 2, maxWidth: '90%' },
  metaText: { color: colors.mutedText, fontFamily: 'Poppins_400Regular', fontSize: 12 },
  bioText: { color: colors.text, fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18, marginTop: spacing.sm, maxWidth: '88%', textAlign: 'center' },
  followButton: {
    alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, height: 40, justifyContent: 'center', marginTop: 14, width: 156,
  },
  followingButton: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  followButtonText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  followingButtonText: { color: colors.text },
  statsCard: {
    alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1,
    flexDirection: 'row', height: 76, marginTop: 34, paddingHorizontal: 8, width: '100%',
  },
  stat: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  statValue: { color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  statLabel: { color: colors.mutedText, fontFamily: 'Poppins_400Regular', fontSize: 10, marginTop: 1 },
  divider: { backgroundColor: colors.border, height: 34, width: StyleSheet.hairlineWidth },
  segments: { alignItems: 'center', alignSelf: 'stretch', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 28 },
  segmentButton: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', paddingBottom: 10 },
  segmentButtonActive: { borderBottomColor: colors.primary },
  segmentText: { color: colors.neutral, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  segmentTextActive: { color: colors.primary },
  feedGrid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 12 },
  feedItem: { aspectRatio: 1, backgroundColor: colors.background, borderRadius: radius.sm, justifyContent: 'flex-end', overflow: 'hidden', width: '32.9%' },
  feedImage: { ...StyleSheet.absoluteFillObject, height: undefined, width: undefined },
  feedOverlay: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.35)', flexDirection: 'row', gap: 3, paddingHorizontal: 6, paddingVertical: 5 },
  feedLocation: { color: '#FFFFFF', flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 8 },
  feedState: { alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', minHeight: 150, paddingHorizontal: spacing.lg },
  feedStateTitle: { color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: 14, marginTop: spacing.sm },
  pressed: { opacity: 0.65 },
});
