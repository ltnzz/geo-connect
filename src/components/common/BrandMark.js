import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { radius } from '../../utils/theme';

export default function BrandMark({ size = 88 }) {
  const iconSize = Math.round(size * 0.42);
  const letterSize = Math.round(size * 0.26);

  return (
    <View
      accessibilityLabel="AroundU logo"
      style={[
        styles.mark,
        {
          borderRadius: size * 0.28,
          height: size,
          width: size,
        },
      ]}
    >
      <Ionicons color="#FFFFFF" name="location-sharp" size={iconSize} />
      <Text style={[styles.letter, { fontSize: letterSize }]}>A</Text>
      <View
        style={[
          styles.discoveryDot,
          {
            borderRadius: radius.full,
            height: size * 0.16,
            right: size * 0.12,
            top: size * 0.12,
            width: size * 0.16,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    backgroundColor: '#004AC6',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#004AC6',
    shadowOffset: {
      height: 6,
      width: 0,
    },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  letter: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    lineHeight: undefined,
    position: 'absolute',
  },
  discoveryDot: {
    backgroundColor: '#FEA619',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    position: 'absolute',
  },
});
