import { Image, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BASE_URL } from '../utils/api';
import { colors } from '../utils/theme';

export default function Avatar({ src, size = 40, onPress, style }) {
  const uri = src
    ? src.startsWith('http') ? src : `${BASE_URL}${src}`
    : null;

  const box = {
    width: size, height: size,
    borderRadius: size * 0.4,
    overflow: 'hidden',
  };

  if (uri) {
    return (
      <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.8} style={[box, style]}>
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.8}
      style={[box, styles.placeholder, style]}>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: size * 0.38, fontWeight: '700' }}>?</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
