import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import ScreenHeader from '../../components/common/ScreenHeader';
import NewEventCard from '../../components/event/NewEventCard';
import { useEventStore } from '../../stores/eventStore';
import { filterRecentEvents } from '../../utils/dateUtils';
import { useColors, spacing } from '../../utils/theme';

export default function AllNewEventsScreen() {
  const navigation = useNavigation();
  const { events, fetchMoreEvents, isLoadingMore, hasMore } = useEventStore();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  
  const newEvents = filterRecentEvents(events);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        showBack
        title="All New Events"
      />
      
      <FlatList
        contentContainerStyle={styles.listContent}
        data={newEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewEventCard
            event={item}
            fullWidth
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
          />
        )}
        showsVerticalScrollIndicator={false}
        onEndReached={hasMore ? fetchMoreEvents : null}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No new events yet.</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : null
        }
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 48,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});
