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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!username || !email || !password) { setError('Please fill all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await register(email, username, password);
      router.replace('/onboarding');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0e1a', '#111827', '#0a0e1a']} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 16 }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join FanVerse</Text>
            <Text style={styles.subtitle}>Represent your nation. Rule the arena.</Text>
          </View>

          <View style={[styles.card, { backgroundColor: '#111827', borderColor: '#1e2d4a' }]}>
            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputWrap, { backgroundColor: '#1a2236', borderColor: '#1e2d4a' }]}>
                <Ionicons name="person-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="YourFanName"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

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
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: '#f5a623', opacity: loading ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.registerBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
              <Text style={[styles.loginLinkText, { color: '#94a3b8' }]}>Already have an account? <Text style={{ color: '#f5a623' }}>Sign In</Text></Text>
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
  backBtn: { position: 'absolute', left: 16, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 60 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#f1f5f9', marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#64748b', textAlign: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 13, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const, flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, color: '#94a3b8', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#f1f5f9' },
  registerBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  registerBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});
