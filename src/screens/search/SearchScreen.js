import { collection, getDocs, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import SearchBar from '../../components/search/SearchBar';
import ScreenHeader from '../../components/common/ScreenHeader';
import PostCard from '../../components/post/PostCard';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../constants/firestore';
import { DUMMY_EVENTS } from '../../data/dummyEvents';
import { DUMMY_POSTS } from '../../data/dummyPosts';
import { colors, radius, spacing } from '../../utils/theme';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTab, setActiveSearchTab] = useState('PEOPLE');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      setSearchedUsers([]);
      return;
    }

    let isActive = true;
    const fetchUsers = async () => {
      setIsSearchingUsers(true);
      try {
        const q = query(
          collection(db, COLLECTIONS.users),
          where('username', '>=', normalizedSearch),
          where('username', '<=', normalizedSearch + '\uf8ff')
        );
        const snapshot = await getDocs(q);
        if (isActive) {
          const results = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSearchedUsers(results);
        }
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        if (isActive) setIsSearchingUsers(false);
      }
    };

    const timer = setTimeout(fetchUsers, 500);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visiblePosts = normalizedSearch
    ? DUMMY_POSTS.filter((post) =>
        [post.author, post.location, post.caption].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      )
    : [];

  const visibleEvents = normalizedSearch
    ? DUMMY_EVENTS.filter((event) =>
        [event.title, event.venue, event.description].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      )
    : [];

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
      
      {/* Search Tabs */}
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
            renderItem={({ item }) => (
              <View style={styles.personRow}>
                <View style={styles.avatar}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons color="#A9B4C5" name="person-outline" size={25} />
                  )}
                </View>
                <View style={styles.personInfo}>
                  <Text numberOfLines={1} style={styles.personName}>
                    {item.displayName || item.fullName || item.username || 'User'}
                  </Text>
                  <Text numberOfLines={1} style={styles.personUsername}>
                    @{item.username}
                    {item.city ? ` · ${item.city}` : ''}
                  </Text>
                </View>
              </View>
            )}
          />
        )
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
            <View style={styles.eventRow}>
              <Text style={styles.personName}>{item.title}</Text>
              <Text style={styles.personUsername}>{item.venue}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
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
    shadowColor: '#000',
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
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  personUsername: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  eventRow: {
    backgroundColor: colors.surface,
    borderColor: '#E1E7F0',
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: 12,
  },
});
