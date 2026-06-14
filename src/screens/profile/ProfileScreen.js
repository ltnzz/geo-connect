import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
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
import { useAuthStore } from '../../stores/authStore';
import { DUMMY_POSTS } from '../../data/dummyPosts';
import { firestoreService } from '../../services/firestoreService';
import { colors, radius, spacing } from '../../utils/theme';

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

  return post.location?.name || post.placeName || post.city || 'AroundU';
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const [activeSegment, setActiveSegment] = useState('posts');
  const [savedPosts, setSavedPosts] = useState([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState('');

  const username = user?.username || 'aroundu';
  const displayName = user?.displayName || user?.fullName || username;
  const city = user?.city || 'Jakarta';
  const visiblePosts = activeSegment === 'posts' ? DUMMY_POSTS : savedPosts;

  useEffect(() => {
    if (activeSegment !== 'saved' || !user?.uid) {
      return;
    }

    let isActive = true;
    setIsSavedLoading(true);
    setSavedError('');

    firestoreService
      .getBookmarkedPosts(user.uid)
      .then((posts) => {
        if (isActive) {
          setSavedPosts(posts);
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

  const showEditUnavailable = () => {
    Alert.alert('Edit Profile', 'Profile editing will be available soon.');
  };

  return (
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
            <Ionicons color="#A9B4C5" name="person-outline" size={44} />
          )}
        </View>

        <Text numberOfLines={1} style={styles.name}>
          {displayName}
        </Text>

        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.metaText}>
            @{username}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Ionicons color={colors.neutral} name="location-outline" size={13} />
          <Text numberOfLines={1} style={styles.metaText}>
            {city}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={showEditUnavailable}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCount(DUMMY_POSTS.length)}</Text>
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

        {activeSegment === 'saved' && isSavedLoading ? (
          <View style={styles.feedState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.feedStateText}>Loading saved posts...</Text>
          </View>
        ) : null}

        {activeSegment === 'saved' && !isSavedLoading && savedError ? (
          <View style={styles.feedState}>
            <Ionicons color={colors.danger} name="alert-circle-outline" size={25} />
            <Text style={styles.feedStateText}>{savedError}</Text>
          </View>
        ) : null}

        {activeSegment === 'saved' &&
        !isSavedLoading &&
        !savedError &&
        visiblePosts.length === 0 ? (
          <View style={styles.feedState}>
            <Ionicons color="#AAB2C0" name="bookmark-outline" size={28} />
            <Text style={styles.feedStateTitle}>No saved posts yet</Text>
            <Text style={styles.feedStateText}>
              Posts you bookmark will appear here.
            </Text>
          </View>
        ) : null}

        {!isSavedLoading && !savedError && visiblePosts.length > 0 ? (
          <View style={styles.feedGrid}>
            {visiblePosts.map((post, index) => (
              <Pressable
                accessibilityLabel={`Post at ${getPostLocationLabel(post)}`}
                accessibilityRole="button"
                key={post.id}
                onPress={() =>
                  navigation.navigate('PostDetail', {
                    initialPostId: post.id,
                    posts: visiblePosts,
                  })
                }
                style={({ pressed }) => [
                  styles.feedItem,
                  {
                    backgroundColor:
                      post.color ||
                      DUMMY_POSTS[index % DUMMY_POSTS.length].color,
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
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FBFCFF',
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: 28,
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EEF2F7',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 92,
    justifyContent: 'center',
    marginTop: 22,
    overflow: 'hidden',
    shadowColor: '#64748B',
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
    color: '#273142',
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
    color: '#8A94A6',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  metaDot: {
    color: '#AAB2C0',
    fontSize: 12,
    marginHorizontal: 5,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CFD7E5',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginTop: 14,
    width: 156,
  },
  editButtonText: {
    color: '#465268',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  statsCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E0EB',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    height: 76,
    marginTop: 34,
    paddingHorizontal: 8,
    shadowColor: '#64748B',
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
    color: '#3D485B',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  statLabel: {
    color: '#9AA3B2',
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginTop: 1,
  },
  divider: {
    backgroundColor: '#E9EDF3',
    height: 34,
    width: StyleSheet.hairlineWidth,
  },
  segments: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomColor: '#E8EDF4',
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
    gap: 5,
    marginTop: 10,
  },
  feedItem: {
    aspectRatio: 1,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '32%',
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
  feedStateTitle: {
    color: '#465268',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    marginTop: spacing.sm,
  },
  feedStateText: {
    color: '#8A94A6',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
