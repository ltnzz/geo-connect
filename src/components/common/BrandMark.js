import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { radius } from '../../utils/theme';

export default function BrandMark({ size = 88 }) {
  const height = size * 0.76; // 1744/2292 aspect ratio
  return (
    <Image
      accessibilityLabel="AroundU logo"
      source={require('../../../assets/logo-fix.png')}
      style={{
        height: height,
        width: size,
        resizeMode: 'contain',
      }}
    />
  );
}

const styles = StyleSheet.create({});
