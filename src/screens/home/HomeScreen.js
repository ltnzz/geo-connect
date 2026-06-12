import { ScrollView, StyleSheet, View } from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import PostCard from '../../components/post/PostCard';
import { colors, spacing } from '../../utils/theme';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <PostCard />
        <PostCard />
        <PostCard />
      </ScrollView>
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
});
