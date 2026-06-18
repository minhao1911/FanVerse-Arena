import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { DebateCard } from '@/components/DebateCard';

function XPBar({ xp, level }: { xp: number; level: number }) {
  const colors = useColors();
  const nextLevelXp = level * 500;
  const progress = Math.min((xp % 500) / 500, 1);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Poppins_500Medium' }}>Level {level}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Poppins_500Medium' }}>{xp % 500}/{500} XP</Text>
      </View>
      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
        <View style={{ height: 4, width: `${progress * 100}%`, backgroundColor: colors.primary, borderRadius: 2 }} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { debates, voteDebate, onlineCount } = useApp();

  const topDebates = debates.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={topDebates}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, {
          paddingTop: Platform.OS === 'web' ? 67 : insets.top,
          paddingBottom: 20
        }]}
        ListHeaderComponent={() => (
          <View>
            {/* Hero Banner */}
            <LinearGradient
              colors={['#111827', '#0a0e1a']}
              style={styles.heroBanner}
            >
              {/* Live online indicator */}
              <View style={styles.onlinePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>
                  {onlineCount > 0 ? `${onlineCount.toLocaleString()} fan${onlineCount === 1 ? '' : 's'} online` : 'Connecting...'}
                </Text>
              </View>

              <View style={styles.heroContent}>
                <View>
                  <Text style={styles.heroGreeting}>Welcome back,</Text>
                  <Text style={styles.heroName}>{user?.username ?? 'Fan'} {user?.teamFlag ?? '⚽'}</Text>
                </View>
                <View style={[styles.xpCircle, { borderColor: colors.primary }]}>
                  <Text style={[styles.xpLevel, { color: colors.primary }]}>{user?.fanLevel ?? 1}</Text>
                  <Text style={[styles.xpLabel, { color: colors.muted }]}>LVL</Text>
                </View>
              </View>
              <View style={styles.heroBars}>
                <XPBar xp={user?.xp ?? 0} level={user?.fanLevel ?? 1} />
              </View>
              <View style={styles.heroStats}>
                {[
                  { label: 'Rep Score', value: user?.reputationScore ?? 0, icon: 'star' },
                  { label: 'Debate Wins', value: user?.debateWins ?? 0, icon: 'trophy' },
                  { label: 'Accuracy', value: `${user?.predictionAccuracy ?? 0}%`, icon: 'analytics' },
                ].map(stat => (
                  <View key={stat.label} style={styles.heroStat}>
                    <Ionicons name={stat.icon as any} size={18} color={colors.primary} />
                    <Text style={[styles.heroStatValue, { color: colors.foreground }]}>{stat.value}</Text>
                    <Text style={[styles.heroStatLabel, { color: colors.muted }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {[
                { icon: 'flame', label: 'Debate', color: '#ef4444', route: '/(tabs)/arena' },
                { icon: 'trophy', label: 'Predict', color: '#f5a623', route: '/(tabs)/predict' },
                { icon: 'people', label: 'Groups', color: '#3b82f6', route: '/(tabs)/communities' },
                { icon: 'podium', label: 'Ranks', color: '#a855f7', route: '/(tabs)/communities' },
              ].map(action => (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.quickBtn, { backgroundColor: action.color + '22', borderColor: action.color + '44' }]}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                  <Text style={[styles.quickLabel, { color: action.color }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hot Debates</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/arena')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <DebateCard
            debate={item}
            onVote={voteDebate}
            onPress={() => {}}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16 },
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e2d4a',
  },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroGreeting: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#64748b' },
  heroName: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#f1f5f9' },
  xpCircle: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  xpLevel: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  xpLabel: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, marginTop: -2 },
  heroBars: { marginBottom: 16 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around' },
  heroStat: { alignItems: 'center', gap: 2 },
  heroStatValue: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  heroStatLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    paddingVertical: 14, alignItems: 'center', gap: 6
  },
  quickLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  seeAll: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#22c55e',
  },
});
