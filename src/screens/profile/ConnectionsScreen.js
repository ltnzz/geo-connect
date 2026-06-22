import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
import { colors, radius, spacing } from '../../utils/theme';

const CONNECTION_TYPES = ['followers', 'following'];

export default function ConnectionsScreen({ route }) {
  const navigation = useNavigation();
  const currentUser = useAuthStore((state) => state.user);
  const userId = route.params?.userId || currentUser?.uid;
  const [activeType, setActiveType] = useState(
    CONNECTION_TYPES.includes(route.params?.initialType)
      ? route.params.initialType
      : 'followers',
  );
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
          <Ionicons color="#AAB2C0" name="people-outline" size={34} />
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
            <Pressable
              key={profile.id}
              style={styles.personRow}
              onPress={() =>
                navigation.navigate('UserDetail', {
                  userId: profile.id,
                })
              }
            >
              <View style={styles.avatar}>
                {profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.image} />
                ) : (
                  <Ionicons color="#A9B4C5" name="person-outline" size={25} />
                )}
              </View>

              <View style={styles.personInfo}>
                <Text numberOfLines={1} style={styles.name}>
                  @{profile.username || 'aroundu'}
                </Text>
                <Text numberOfLines={1} style={styles.username}>
                  {profile.city || 'AroundU'}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FBFCFF',
    flex: 1,
  },
  tabs: {
    backgroundColor: colors.surface,
    borderBottomColor: '#E8EDF4',
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
  personRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#E1E7F0',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  username: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
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
