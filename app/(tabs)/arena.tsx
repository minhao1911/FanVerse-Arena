import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { DebateCard } from '@/components/DebateCard';

const CATEGORIES = [
  { key: 'All', icon: '🌐', label: 'All' },
  { key: 'WC 2026', icon: '🏆', label: 'WC 2026' },
  { key: 'GOAT', icon: '🐐', label: 'GOAT' },
  { key: 'Tactics', icon: '📊', label: 'Tactics' },
  { key: 'Football', icon: '⚽', label: 'Football' },
];

const SORTS = [
  { key: 'Hot', icon: 'flame', label: 'Hot' },
  { key: 'New', icon: 'time', label: 'New' },
  { key: 'Top', icon: 'trending-up', label: 'Top' },
] as const;

type SortKey = (typeof SORTS)[number]['key'];

function ArenaStatBadge({ icon, value, label, color, bg }: { icon: string; value: string | number; label: string; color: string; bg: string }) {
  return (
    <View style={[aStyles.statBadge, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <View>
        <Text style={[aStyles.statBadgeVal, { color }]}>{value}</Text>
        <Text style={[aStyles.statBadgeLabel, { color: '#64748b' }]}>{label}</Text>
      </View>
    </View>
  );
}

export default function ArenaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debates, voteDebate, sendRealTimeNotification, onlineCount } = useApp();
  const [activeSort, setActiveSort] = useState<SortKey>('Hot');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = debates.filter(d =>
    activeCategory === 'All' || (d.category ?? '') === activeCategory
  );

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === 'Hot') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    if (activeSort === 'New') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return b.upvotes - a.upvotes;
  });

  const totalVotes = debates.reduce((sum, d) => sum + d.upvotes + d.downvotes, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={['#0d1829', '#111827']}
        style={[styles.header, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12 }]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>🔥 Debate Arena</Text>
            <Text style={[styles.headerSub, { color: colors.muted }]}>Where nations clash with words</Text>
          </View>
          <TouchableOpacity
            style={[styles.newDebateBtn, { backgroundColor: colors.primary }]}
            onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/create-debate'); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.newDebateBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <ArenaStatBadge icon="🌐" value={onlineCount > 0 ? `${onlineCount}` : '...'} label="online" color="#22c55e" bg="rgba(34,197,94,0.1)" />
          <ArenaStatBadge icon="🔥" value={debates.length} label="debates" color="#f59e0b" bg="rgba(245,158,11,0.1)" />
          <ArenaStatBadge icon="👍" value={totalVotes > 999 ? `${(totalVotes / 1000).toFixed(1)}k` : totalVotes} label="votes cast" color="#3b82f6" bg="rgba(59,130,246,0.1)" />
          <ArenaStatBadge icon="🤖" value="AI" label="moderated" color="#a855f7" bg="rgba(168,85,247,0.1)" />
        </ScrollView>

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(c => {
            const active = activeCategory === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.catPill, {
                  backgroundColor: active ? colors.primary : colors.cardAlt,
                  borderColor: active ? colors.primary : colors.border,
                }]}
                onPress={() => setActiveCategory(c.key)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13 }}>{c.icon}</Text>
                <Text style={[styles.catPillText, { color: active ? '#000' : colors.mutedForeground }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort pills */}
        <View style={styles.sortRow}>
          {SORTS.map(s => {
            const active = activeSort === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.sortPill, {
                  backgroundColor: active ? colors.card : 'transparent',
                  borderColor: active ? colors.border : 'transparent',
                }]}
                onPress={() => setActiveSort(s.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={s.icon as any} size={13} color={active ? colors.primary : colors.muted} />
                <Text style={[styles.sortPillText, { color: active ? colors.primary : colors.muted }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ flex: 1 }} />
          <View style={[styles.aiTag, { backgroundColor: 'rgba(168,85,247,0.12)', borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Ionicons name="shield-checkmark" size={11} color="#a855f7" />
            <Text style={[styles.aiTagText, { color: '#a855f7' }]}>AI Moderated</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── LIST ── */}
      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
        renderItem={({ item, index }) => (
          <View style={[styles.debateWrap, index === 0 && styles.debateFirst]}>
            {index === 0 && (
              <View style={[styles.hotBanner, { backgroundColor: '#ef4444' + '18', borderColor: '#ef4444' + '40' }]}>
                <Ionicons name="flame" size={12} color="#ef4444" />
                <Text style={[styles.hotBannerText, { color: '#ef4444' }]}>TOP DEBATE</Text>
              </View>
            )}
            <DebateCard
              debate={item}
              onVote={(debateId, vote) => {
                voteDebate(debateId, vote);
                sendRealTimeNotification({
                  type: 'vote',
                  message: `${vote === 'up' ? '👍 upvoted' : '👎 downvoted'}: "${item.title}"`,
                  fromTeamFlag: item.authorTeamFlag,
                  fromUser: item.authorName,
                  targetId: debateId,
                });
              }}
              onPress={() => {}}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🔥</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No debates in this category</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Be the first to start one!</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/create-debate')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Start Debate</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  headerSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  newDebateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  newDebateBtnText: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  statsRow: { gap: 8, marginBottom: 14 },
  catRow: { gap: 8, marginBottom: 10 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 10 },
  sortPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  sortPillText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  aiTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  aiTagText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  list: { padding: 16, gap: 10 },
  debateWrap: {},
  debateFirst: {},
  hotBanner: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 6 },
  hotBannerText: { fontSize: 10, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, textAlign: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
});

const aStyles = StyleSheet.create({
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  statBadgeVal: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, lineHeight: 20 },
  statBadgeLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
});
