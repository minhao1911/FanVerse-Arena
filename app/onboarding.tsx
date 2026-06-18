import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, Platform
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { NATIONAL_TEAMS, NationalTeam, CONFEDERATIONS } from '@/data/teams';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { selectTeam } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedConfed, setSelectedConfed] = useState<string | null>(null);
  const [selected, setSelected] = useState<NationalTeam | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = NATIONAL_TEAMS.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchConfed = !selectedConfed || t.confederation === selectedConfed;
    return matchSearch && matchConfed;
  });

  const handleSelect = (team: NationalTeam) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(team);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      await selectTeam(selected.id, selected.name, selected.flag);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  function formatFans(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k fans';
    return n + ' fans';
  }

  return (
    <LinearGradient colors={['#0a0e1a', '#111827']} style={styles.bg}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Choose Your Nation</Text>
        <Text style={styles.subtitle}>Represent your team in every debate and prediction</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchInput, { backgroundColor: '#111827', borderColor: '#1e2d4a' }]}>
          <Ionicons name="search-outline" size={18} color="#64748b" />
          <TextInput
            style={styles.searchText}
            value={search}
            onChangeText={setSearch}
            placeholder="Search teams..."
            placeholderTextColor="#64748b"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.confeds}>
        <FlatList
          data={['All', ...CONFEDERATIONS]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          keyExtractor={item => item}
          renderItem={({ item }) => {
            const active = item === 'All' ? !selectedConfed : selectedConfed === item;
            return (
              <TouchableOpacity
                style={[styles.confedBtn, { backgroundColor: active ? '#f5a623' : '#111827', borderColor: active ? '#f5a623' : '#1e2d4a' }]}
                onPress={() => setSelectedConfed(item === 'All' ? null : item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.confedText, { color: active ? '#000' : '#94a3b8' }]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (selected ? 100 : 20) }]}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => {
          const isSelected = selected?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.teamCard, { backgroundColor: isSelected ? '#f5a62322' : '#111827', borderColor: isSelected ? '#f5a623' : '#1e2d4a' }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.teamFlag}>{item.flag}</Text>
              <Text style={[styles.teamName, { color: '#f1f5f9' }]}>{item.name}</Text>
              <Text style={[styles.teamFans, { color: '#64748b' }]}>{formatFans(item.fanCount)}</Text>
              <Text style={[styles.teamConfed, { color: '#3b82f6' }]}>{item.confederation}</Text>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: '#f5a623' }]}>
                  <Ionicons name="checkmark" size={14} color="#000" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {selected && (
        <View style={[styles.confirmBar, { paddingBottom: insets.bottom + 16 }]}>
          {!!error && <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>}
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: '#f5a623', opacity: loading ? 0.7 : 1 }]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#000" /> : (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmFlag}>{selected.flag}</Text>
                <Text style={styles.confirmText}>I'm a {selected.name} fan!</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 26, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#f1f5f9', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#64748b' },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 46 },
  searchText: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#f1f5f9' },
  confeds: { marginBottom: 12 },
  confedBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  confedText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  teamCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 16,
    alignItems: 'center', gap: 4, marginBottom: 10, position: 'relative'
  },
  teamFlag: { fontSize: 40, marginBottom: 4 },
  teamName: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, textAlign: 'center' },
  teamFans: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  teamConfed: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  checkmark: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  confirmBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0d1220', paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e2d4a' },
  errorText: { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 8 },
  confirmBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmFlag: { fontSize: 24 },
  confirmText: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
});
