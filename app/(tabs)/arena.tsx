import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { DebateCard } from '@/components/DebateCard';

const FILTERS = ['All', 'Hot', 'New', 'Top'];

export default function ArenaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debates, voteDebate } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');

  const sorted = [...debates].sort((a, b) => {
    if (activeFilter === 'Hot') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    if (activeFilter === 'New') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (activeFilter === 'Top') return b.upvotes - a.upvotes;
    return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
        backgroundColor: colors.headerBg,
        borderBottomColor: colors.border
      }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Debate Arena</Text>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/create-debate')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filter, { backgroundColor: activeFilter === f ? colors.primary : colors.cardAlt, borderColor: activeFilter === f ? colors.primary : colors.border }]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, { color: activeFilter === f ? '#000' : colors.mutedForeground }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
        renderItem={({ item }) => (
          <DebateCard debate={item} onVote={voteDebate} onPress={() => {}} />
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="flame-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No debates yet</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Start the first debate!</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  newBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', gap: 8 },
  filter: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});
