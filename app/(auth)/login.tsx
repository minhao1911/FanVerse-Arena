import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0e1a', '#111827', '#0a0e1a']} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>⚽</Text>
            </View>
            <Text style={styles.appName}>FanVerse</Text>
            <Text style={styles.tagline}>Your football universe</Text>
          </View>

          <View style={[styles.card, { backgroundColor: '#111827', borderColor: '#1e2d4a' }]}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: '#1a2236', borderColor: '#1e2d4a' }]}>
                <Ionicons name="mail-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: '#1a2236', borderColor: '#1e2d4a' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: '#f5a623', opacity: loading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: '#1e2d4a' }]} />
              <Text style={[styles.orText, { color: '#64748b' }]}>or</Text>
              <View style={[styles.line, { backgroundColor: '#1e2d4a' }]} />
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, { borderColor: '#1e2d4a' }]}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <Text style={[styles.registerText, { color: '#f1f5f9' }]}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f5a62322', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#f5a623', marginBottom: 16,
  },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 32, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#f1f5f9', letterSpacing: 1 },
  tagline: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#64748b', marginTop: 4 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24 },
  cardTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#f1f5f9', marginBottom: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 13, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const, flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, color: '#94a3b8', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#f1f5f9' },
  loginBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  loginBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1 },
  orText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  registerBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  registerText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
});
