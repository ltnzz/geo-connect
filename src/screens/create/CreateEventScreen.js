import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

export default function CreateEventScreen() {
  return (
    <View style={styles.container}>
      {/* Event Name Input */}
      <TextInput
        placeholder="Event Name..."
        placeholderTextColor="#CBD5E1"
        style={styles.eventNameInput}
      />

      {/* Date & Time Row */}
      <View style={styles.dateTimeRow}>
        <Pressable style={styles.dateTimeButton}>
          <Ionicons color={colors.neutral} name="calendar-outline" size={20} />
          <Text style={styles.dateTimeText}>Select{'\n'}Date</Text>
        </Pressable>
        <Pressable style={styles.dateTimeButton}>
          <Ionicons color={colors.neutral} name="time-outline" size={20} />
          <Text style={styles.dateTimeText}>Select{'\n'}Time</Text>
        </Pressable>
      </View>

      {/* Location Button */}
      <Pressable style={styles.eventLocationButton}>
        <Ionicons color={colors.primary} name="location" size={18} />
        <Text style={styles.eventLocationText}>Choose Event Location</Text>
      </Pressable>

      {/* Description Box */}
      <TextInput
        multiline
        placeholder="What's this event about?"
        placeholderTextColor="#CBD5E1"
        style={styles.eventDescriptionInput}
      />

      {/* Upload Cover */}
      <Pressable style={styles.eventCoverButton}>
        <View style={styles.eventCoverIconContainer}>
          <Ionicons color={colors.primary} name="add" size={20} />
        </View>
        <Text style={styles.eventCoverText}>Upload Event Cover</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  eventNameInput: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    marginBottom: spacing.xl,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dateTimeButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  dateTimeText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
  eventLocationButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  eventLocationText: {
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  eventDescriptionInput: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    marginBottom: spacing.xl,
    minHeight: 120,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  eventCoverButton: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 160,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  eventCoverIconContainer: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: radius.sm,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 40,
  },
  eventCoverText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
});
