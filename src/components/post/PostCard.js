import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

export default function PostCard() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.userName}>Dimas Pratama</Text>
            <View style={styles.locationRow}>
              <Ionicons color={colors.primary} name="location-outline" size={12} />
              <Text style={styles.locationText}>Kopi Nako, Senopati</Text>
            </View>
          </View>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>858m away</Text>
        </View>
      </View>

      {/* Image Placeholder */}
      <View style={styles.imagePlaceholder} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.actionsRow}>
          <View style={styles.actionItem}>
            <Ionicons color={colors.text} name="heart-outline" size={20} />
            <Text style={styles.actionText}>24</Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons color={colors.text} name="chatbubble-outline" size={20} />
            <Text style={styles.actionText}>5</Text>
          </View>
        </View>
        <Text style={styles.description}>
          Found this hidden gem in Senopati. The pour-over here is incredible. Perfect spot for afternoon deep work.
        </Text>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>2h ago</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  userInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 40,
    width: 40,
  },
  userName: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  locationText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  distanceBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  imagePlaceholder: {
    backgroundColor: '#E2E8F0',
    height: 240,
    width: '100%',
  },
  footer: {
    padding: spacing.md,
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  actionItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  actionText: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  description: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  timeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
