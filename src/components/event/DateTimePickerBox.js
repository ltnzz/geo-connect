import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors, radius, spacing } from '../../utils/theme';

export default function DateTimePickerBox({
  val1,
  val2,
  showPicker1,
  showPicker2,
  setShowPicker1,
  setShowPicker2,
  onChange1,
  onChange2,
  mode = 'date',
  icon = 'calendar-outline'
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const formatVal = (val) => {
    if (mode === 'date') return val.toLocaleDateString();
    return val.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.dateTimeRow}>
      <Pressable style={styles.dateTimeButton} onPress={() => setShowPicker1(true)}>
        <Ionicons color={colors.neutral} name={icon} size={20} />
        <Text style={styles.dateTimeText}>{formatVal(val1)}</Text>
      </Pressable>
      {showPicker1 && (
        <DateTimePicker value={val1} mode={mode} display="default" onChange={onChange1} />
      )}

      <Text style={styles.separator}>-</Text>

      <Pressable style={styles.dateTimeButton} onPress={() => setShowPicker2(true)}>
        <Ionicons color={colors.neutral} name={icon} size={20} />
        <Text style={styles.dateTimeText}>{formatVal(val2)}</Text>
      </Pressable>
      {showPicker2 && (
        <DateTimePicker value={val2} mode={mode} display="default" onChange={onChange2} />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  dateTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  separator: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
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
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
});

