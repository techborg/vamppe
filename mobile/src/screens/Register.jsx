import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/theme';

export default function Register({ navigation }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      await login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <Text style={styles.logoV}>V</Text>
        </View>
        <Text style={styles.title}>Join Vamppe</Text>
        <Text style={styles.subtitle}>It only takes a moment</Text>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        {['username', 'email', 'password'].map((field) => (
          <TextInput
            key={field}
            style={styles.input}
            placeholder={field === 'username' ? 'Username' : field === 'email' ? 'Email address' : 'Password (min 6 chars)'}
            placeholderTextColor={colors.gray4}
            value={form[field]}
            onChangeText={(v) => setForm({ ...form, [field]: v })}
            keyboardType={field === 'email' ? 'email-address' : 'default'}
            autoCapitalize="none"
            secureTextEntry={field === 'password'}
          />
        ))}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already on Vamppe? <Text style={{ color: colors.orange }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  logoBox: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoV: { fontSize: 28, fontWeight: '900', color: colors.orange },
  title: { fontSize: 24, fontWeight: '800', color: colors.white, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.gray3, marginBottom: 28 },
  errorBox: { width: '100%', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  errorText: { color: colors.red, fontSize: 13 },
  input: { width: '100%', backgroundColor: colors.surface2, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, color: colors.white, fontSize: 15, marginBottom: 12 },
  btn: { width: '100%', backgroundColor: colors.orange, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4, marginBottom: 20 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  link: { color: colors.gray3, fontSize: 14 },
});
