import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

export default function DateTimePickerBox({ 
  date, 
  time, 
  showDatePicker, 
  showTimePicker, 
  setShowDatePicker, 
  setShowTimePicker, 
  onDateChange, 
  onTimeChange 
}) {
  return (
    <View style={styles.dateTimeRow}>
      <Pressable style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
        <Ionicons color={colors.neutral} name="calendar-outline" size={20} />
        <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
      )}

      <Pressable style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
        <Ionicons color={colors.neutral} name="time-outline" size={20} />
        <Text style={styles.dateTimeText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </Pressable>
      {showTimePicker && (
        <DateTimePicker value={time} mode="time" display="default" onChange={onTimeChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
