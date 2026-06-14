import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import { db } from '../../config/firebase';
import { COLLECTIONS, NOTIFICATION_TYPES } from '../../constants/firestore';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius, spacing } from '../../utils/theme';

const notificationCopy = {
  [NOTIFICATION_TYPES.comment]: {
    icon: 'chatbubble-outline',
    text: 'commented on your post',
  },
  [NOTIFICATION_TYPES.like]: {
    icon: 'heart-outline',
    text: 'liked your post',
  },
  [NOTIFICATION_TYPES.follow]: {
    icon: 'person-add-outline',
    text: 'started following you',
  },
};

const formatTime = (timestamp) => {
  const date = timestamp?.toDate?.();
  return date
    ? date.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';
};

export default function NotificationScreen() {
  const userId = useAuthStore((state) => state.user?.uid);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return undefined;
    }

    const notificationsQuery = query(
      collection(db, COLLECTIONS.notifications),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setItems(
          snapshot.docs.map((notification) => ({
            id: notification.id,
            ...notification.data(),
          })),
        );
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );
  }, [userId]);

  const markAsRead = async (notification) => {
    if (notification.read) {
      return;
    }

    await updateDoc(doc(db, COLLECTIONS.notifications, notification.id), {
      read: true,
    });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Notifications" showBack />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.list,
            !items.length && styles.emptyList,
          ]}
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                color={colors.neutral}
                name="notifications-outline"
                size={42}
              />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                Comments, likes, and new followers will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const copy =
              notificationCopy[item.type] || notificationCopy.comment;

            return (
              <Pressable
                onPress={() => markAsRead(item)}
                style={[
                  styles.item,
                  !item.read && styles.unreadItem,
                ]}
              >
                <View style={styles.icon}>
                  <Ionicons
                    color={colors.primary}
                    name={copy.icon}
                    size={22}
                  />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.message}>
                    <Text style={styles.actor}>
                      @{item.actorUsername || 'someone'}
                    </Text>{' '}
                    {copy.text}
                  </Text>
                  <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                </View>
                {!item.read ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    padding: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  item: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  unreadItem: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  message: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  actor: {
    fontFamily: 'Poppins_600SemiBold',
  },
  time: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  unreadDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 8,
    marginLeft: spacing.sm,
    width: 8,
  },
});
