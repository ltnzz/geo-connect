import { Ionicons } from '@expo/vector-icons';
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
import { firestoreService } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { useLocation } from '../../hooks/useLocation';
import { calculateDistance } from '../../utils/locationUtils';
import { useColors, radius, spacing } from '../../utils/theme';

export default function VenueDetailScreen({ navigation, route }) {
  const placeId = route.params?.placeId;
  const user = useAuthStore((state) => state.user);
  const { location, isFetchingLocation, handleGetLocation } = useLocation();
  const [place, setPlace] = useState(route.params?.place || null);
  const [posts, setPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
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
      const [nextPlace, rawPosts, nextLeaderboard] = await Promise.all([
        firestoreService.getPlace(placeId),
        firestoreService.getPlacePosts(placeId),
        firestoreService.getPlaceLeaderboard(placeId),
      ]);

      const likedIds = rawPosts.length && user?.uid
        ? await firestoreService.getLikedPostIds(rawPosts.map((p) => p.id), user.uid)
        : new Set();

      const bookmarkedIds = rawPosts.length && user?.uid
        ? await firestoreService.getBookmarkedPostIds(user.uid)
        : new Set();

      const enrichedPosts = rawPosts.map((p) => ({
        ...p,
        isLiked: likedIds.has(p.id),
        isBookmarked: bookmarkedIds.has(p.id),
      }));

      setPlace(nextPlace);
      setPosts(enrichedPosts);
      setLeaderboard(nextLeaderboard);
    } finally {
      setIsLoading(false);
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

    if (!location) {
      Alert.alert(
        'Location Required',
        'Please wait until your current location is available.'
      );
      handleGetLocation();
      return;
    }

    const distanceKm = calculateDistance(
      location.latitude,
      location.longitude,
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
      return;
    }

    setIsCheckingIn(true);
    try {
      await firestoreService.checkIn({
        userId: user.uid,
        placeId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
      await loadVenue();
      Alert.alert('Checked in', `You checked in at ${place.name}.`);
    } catch (error) {
      Alert.alert(
        'Unable to check in',
        error.message || 'Please check your connection and try again.'
      );
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader showBack title="Venue Profile" />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {place?.photoUrl ? (
              <Image source={{ uri: place.photoUrl }} style={styles.heroImage} />
            ) : (
              <Ionicons color={colors.secondary} name="business" size={48} />
            )}
          </View>

          <Text style={styles.title}>{place?.name || 'Venue'}</Text>
          <Text style={styles.meta}>
            {[place?.category, place?.city].filter(Boolean).join(' - ') || 'Nearby place'}
          </Text>
          <Text style={styles.address}>{place?.address || 'Address unavailable'}</Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{place?.rating || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{place?.checkinsCount || 0}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
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

          <Text style={styles.sectionTitle}>Posts from this venue</Text>
          {posts.length ? (
            posts.map((post) => (
              <Pressable
                accessibilityRole="button"
                key={post.id}
                onPress={() =>
                  navigation.navigate('PostDetail', {
                    initialPostId: post.id,
                    posts,
                  })
                }
                style={styles.postRow}
              >
                {post.imageUrl ? (
                  <Image source={{ uri: post.imageUrl }} style={styles.postThumb} />
                ) : (
                  <View style={styles.postThumb}>
                    <Ionicons color={colors.primary} name="image" size={20} />
                  </View>
                )}
                <Text numberOfLines={2} style={styles.postText}>
                  {post.caption || 'Venue post'}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>No posts tagged here yet.</Text>
          )}
        </ScrollView>
      )}
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
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: `${colors.secondary}15`,
    borderRadius: radius.lg,
    height: 180,
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
  stats: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
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
    marginTop: spacing.xl,
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
  postRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  postThumb: {
    alignItems: 'center',
    backgroundColor: `${colors.primary}1A`,
    borderRadius: radius.sm,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  postText: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: spacing.sm,
  },
});
