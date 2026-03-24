import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../utils/theme';

const { width } = Dimensions.get('window');

const Feature = ({ icon, title, desc }) => (
  <View style={styles.feature}>
    <View style={styles.featureIcon}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

export default function Landing({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Logo mark */}
      <View style={styles.logoBox}>
        <Text style={styles.logoV}>V</Text>
      </View>

      <Text style={styles.title}>
        Welcome to{' '}
        <Text style={styles.titleGrad}>Vamppe</Text>
      </Text>
      <Text style={styles.subtitle}>
        Share ideas, connect with people, and feel the rhythm of real conversations.
      </Text>

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => navigation.navigate('Register')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnPrimaryText}>Create your account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnGhost}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnGhostText}>Sign in</Text>
      </TouchableOpacity>

      <View style={styles.features}>
        <Feature icon="✦" title="Real-time feed" desc="See posts from people you follow instantly." />
        <Feature icon="⚡" title="Instant messaging" desc="Chat with anyone, see who's online." />
        <Feature icon="🔔" title="Smart activity" desc="Likes, replies, and follows — all in one place." />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  logoBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  logoV: { fontSize: 36, fontWeight: '900', color: colors.orange },
  title: { fontSize: 30, fontWeight: '800', color: colors.white, textAlign: 'center', marginBottom: 10 },
  titleGrad: { color: colors.orange },
  subtitle: { fontSize: 15, color: colors.gray3, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btnPrimary: {
    width: '100%', backgroundColor: colors.orange,
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
    shadowColor: colors.orange, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  btnPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  btnGhost: {
    width: '100%', borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', marginBottom: 36,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  btnGhostText: { color: colors.gray2, fontWeight: '600', fontSize: 16 },
  features: { width: '100%', gap: 12 },
  feature: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: colors.surface1,
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { color: colors.white, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  featureDesc: { color: colors.gray3, fontSize: 12, lineHeight: 18 },
});
