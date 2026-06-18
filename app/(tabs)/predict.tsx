import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { PredictionCard } from '@/components/PredictionCard';

const FILTERS = ['All', 'Upcoming', 'Live', 'Finished'];

export default function PredictScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { predictions, submitPrediction, leaderboard } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = predictions.filter(p =>
    activeFilter === 'All' ? true :
    activeFilter === 'Upcoming' ? p.status === 'upcoming' :
    activeFilter === 'Live' ? p.status === 'live' :
    p.status === 'finished'
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
        backgroundColor: colors.headerBg,
        borderBottomColor: colors.border
      }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Prediction Center</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>Predict matches, earn XP points</Text>

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
        data={filtered}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
        renderItem={({ item }) => (
          <PredictionCard prediction={item} onSubmit={submitPrediction} />
        )}
        ListHeaderComponent={() => (
          <View style={[styles.leaderboard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.lbTitle, { color: colors.foreground }]}>Top Predictors</Text>
            {leaderboard.slice(0, 3).map((entry, index) => (
              <View key={entry.userId} style={styles.lbRow}>
                <Text style={[styles.lbRank, { color: index === 0 ? colors.gold : index === 1 ? colors.silver : colors.bronze }]}>
                  #{entry.rank}
                </Text>
                <Text style={styles.lbFlag}>{entry.teamFlag}</Text>
                <Text style={[styles.lbName, { color: colors.foreground }]}>{entry.username}</Text>
                <Text style={[styles.lbScore, { color: colors.primary }]}>{entry.score.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Check back soon!</Text>
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
  headerTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, marginBottom: 2 },
  headerSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  list: { padding: 16 },
  leaderboard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  lbTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, marginBottom: 12 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  lbRank: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, width: 32 },
  lbFlag: { fontSize: 20 },
  lbName: { flex: 1, fontSize: 14, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  lbScore: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});
