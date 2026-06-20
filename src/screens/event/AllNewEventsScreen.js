import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import NewEventCard from '../../components/event/NewEventCard';
import { useEventStore } from '../../stores/eventStore';
import { filterRecentEvents } from '../../utils/dateUtils';
import { colors, spacing } from '../../utils/theme';

export default function AllNewEventsScreen() {
  const navigation = useNavigation();
  const { events, fetchMoreEvents, isLoadingMore, hasMore } = useEventStore();
  
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
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : null
          }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8F9FF',
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
