import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import PostCard from '../../components/post/PostCard';
import SearchBar from '../../components/search/SearchBar';
import UserRow from '../../components/profile/UserRow';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../constants/firestore';
import { firestoreService } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';
import { useFeedStore } from '../../stores/feedstore';
import { useColors, radius, spacing } from '../../utils/theme';


const uniqueById = (items) =>
  items.filter(
    (item, index, source) =>
      item?.id && source.findIndex((candidate) => candidate.id === item.id) === index,
  );

export default function SearchScreen() {
  const navigation = useNavigation();
  const currentUserId = useAuthStore((s) => s.user?.uid);
  const feedPosts = useFeedStore((s) => s.posts);
  const checkFollowing = useFeedStore((s) => s.checkFollowing);
  const followingByUser = useFeedStore((s) => s.followingByUser);
  const toggleFollow = useFeedStore((s) => s.toggleFollow);
  const eventsData = useEventStore((s) => s.events);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTab, setActiveSearchTab] = useState('PEOPLE');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchedPosts, setSearchedPosts] = useState([]);
  const [searchedEvents, setSearchedEvents] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSearchingContent, setIsSearchingContent] = useState(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  useEffect(() => {
    if (!normalizedSearch) {
      setSearchedUsers([]);
      return;
    }

    let isActive = true;
    const fetchUsers = async () => {
      setIsSearchingUsers(true);
      try {
        const usersQuery = query(
          collection(db, COLLECTIONS.users),
          where('username', '>=', normalizedSearch),
          where('username', '<=', `${normalizedSearch}\uf8ff`),
        );
        const snapshot = await getDocs(usersQuery);
        if (isActive) {
          setSearchedUsers(snapshot.docs.map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
          })));
        }
      } catch {
        if (isActive) setSearchedUsers([]);
      } finally {
        if (isActive) setIsSearchingUsers(false);
      }
    };

    const timer = setTimeout(fetchUsers, 500);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [normalizedSearch]);

  useEffect(() => {
    if (!normalizedSearch) {
      setSearchedPosts([]);
      setSearchedEvents([]);
      return;
    }

    let isActive = true;
    const fetchContent = async () => {
      setIsSearchingContent(true);
      try {
        const [posts, events] = await Promise.all([
          firestoreService.searchPosts(normalizedSearch),
          firestoreService.searchEvents(normalizedSearch),
        ]);

        const likedIds = posts.length && currentUserId
          ? await firestoreService.getLikedPostIds(posts.map((p) => p.id), currentUserId)
          : new Set();

        const bookmarkedIds = posts.length && currentUserId
          ? await firestoreService.getBookmarkedPostIds(currentUserId)
          : new Set();

        const enrichedPosts = posts.map((p) => ({
          ...p,
          isLiked: likedIds.has(p.id),
          isBookmarked: bookmarkedIds.has(p.id),
        }));

        if (isActive) {
          setSearchedPosts(enrichedPosts);
          setSearchedEvents(events);
        }
      } catch {
        if (isActive) {
          setSearchedPosts([]);
          setSearchedEvents([]);
        }
      } finally {
        if (isActive) setIsSearchingContent(false);
      }
    };

    const timer = setTimeout(fetchContent, 500);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [normalizedSearch]);

  useEffect(() => {
    searchedUsers.forEach((user) => {
      const targetUserId = user.id || user.uid;
      if (targetUserId) {
        checkFollowing(currentUserId, targetUserId);
      }
    });
  }, [checkFollowing, currentUserId, searchedUsers]);

  const visiblePosts = normalizedSearch
    ? uniqueById([...searchedPosts, ...feedPosts]).filter((post) =>
      [
        post.authorName,
        post.caption,
        post.location?.address,
        post.location?.city,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch)),
    )
    : [];

  const visibleEvents = normalizedSearch
    ? uniqueById([...searchedEvents, ...eventsData]).filter((event) =>
      [
        event.title,
        event.location?.address,
        event.location?.city,
        event.description,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch)),
    )
    : [];

  const renderPerson = ({ item }) => (
    <UserRow
      user={item}
      currentUserId={currentUserId}
      isFollowing={!!followingByUser[item.id || item.uid]}
      onFollowPress={toggleFollow}
      showFollowButton
    />
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        onLeftPress={() => navigation.goBack()}
        showBack
        title="Search"
      />
      <SearchBar
        autoFocus
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        placeholder="Search people, events, posts..."
        value={searchQuery}
      />

      <View style={styles.searchTabContainer}>
        {['PEOPLE', 'EVENTS', 'POSTS'].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveSearchTab(tab)}
            style={[styles.searchTabButton, activeSearchTab === tab && styles.searchTabActive]}
          >
            <Text style={[styles.searchTabText, activeSearchTab === tab && styles.searchTabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeSearchTab === 'POSTS' ? (
        isSearchingContent ? (
          <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={visiblePosts}
            keyExtractor={(post) => post.id}
            ListEmptyComponent={
              normalizedSearch ? (
                <Text style={styles.emptyText}>No posts found</Text>
              ) : (
                <Text style={styles.emptyText}>Type to search posts</Text>
              )
            }
            renderItem={({ item }) => <PostCard post={item} />}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : activeSearchTab === 'PEOPLE' ? (
        isSearchingUsers ? (
          <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={searchedUsers}
            keyExtractor={(user) => user.id}
            ListEmptyComponent={
              normalizedSearch ? (
                <Text style={styles.emptyText}>No users found</Text>
              ) : (
                <Text style={styles.emptyText}>Type to search users</Text>
              )
            }
            renderItem={renderPerson}
          />
        )
      ) : isSearchingContent ? (
        <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={visibleEvents}
          keyExtractor={(event) => event.id}
          ListEmptyComponent={
            normalizedSearch ? (
              <Text style={styles.emptyText}>No events found</Text>
            ) : (
              <Text style={styles.emptyText}>Type to search events</Text>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              style={styles.eventRow}
            >
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventSubtitle}>{item.location?.address || 'TBD'}</Text>
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  footerLoader: {
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  searchTabContainer: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    padding: 4,
  },
  searchTabButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    paddingVertical: 8,
  },
  searchTabActive: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: colors.neutral,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchTabText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  searchTabTextActive: {
    color: colors.primary,
  },
  eventRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: 12,
  },
  eventTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  eventSubtitle: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
});
