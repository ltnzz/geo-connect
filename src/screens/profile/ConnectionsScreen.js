import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import UserRow from '../../components/profile/UserRow';
import { firestoreService } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedstore';
import { useColors, radius, spacing } from '../../utils/theme';

const CONNECTION_TYPES = ['followers', 'following'];

export default function ConnectionsScreen({ route }) {
  const currentUser = useAuthStore((state) => state.user);
  const userId = route.params?.userId || currentUser?.uid;
  const checkFollowing = useFeedStore((s) => s.checkFollowing);
  const followingByUser = useFeedStore((s) => s.followingByUser);
  const toggleFollow = useFeedStore((s) => s.toggleFollow);

  const [activeType, setActiveType] = useState(
    CONNECTION_TYPES.includes(route.params?.initialType)
      ? route.params.initialType
      : 'followers',
  );
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    connections.forEach((profile) => {
      const targetUserId = profile.id || profile.uid;
      if (targetUserId && currentUser?.uid) {
        checkFollowing(currentUser.uid, targetUserId);
      }
    });
  }, [checkFollowing, currentUser?.uid, connections]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError('');

    firestoreService
      .getConnections(userId, activeType)
      .then((profiles) => {
        if (isActive) {
          setConnections(profiles);
        }
      })
      .catch(() => {
        if (isActive) {
          setError(`Unable to load ${activeType}.`);
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
  }, [activeType, userId]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Connections" showBack />

      <View style={styles.tabs}>
        {CONNECTION_TYPES.map((type) => {
          const isActive = activeType === type;

          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={type}
              onPress={() => setActiveType(type)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {type === 'followers' ? 'Followers' : 'Following'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Loading {activeType}...</Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={styles.state}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={30} />
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : null}

      {!isLoading && !error && connections.length === 0 ? (
        <View style={styles.state}>
          <Ionicons color={colors.neutral} name="people-outline" size={34} />
          <Text style={styles.stateTitle}>No {activeType} yet</Text>
          <Text style={styles.stateText}>
            {activeType === 'followers'
              ? 'People who follow this account will appear here.'
              : 'Accounts followed by this user will appear here.'}
          </Text>
        </View>
      ) : null}

      {!isLoading && !error && connections.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {connections.map((profile) => (
            <UserRow
              key={profile.id}
              user={profile}
              currentUserId={currentUser?.uid}
              isFollowing={!!followingByUser[profile.id || profile.uid]}
              onFollowPress={toggleFollow}
              showFollowButton
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  tabs: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 13,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.primary,
  },
  list: {
    padding: spacing.md,
  },
  state: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  stateTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    marginTop: spacing.sm,
  },
  stateText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
