import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRef, useEffect } from 'react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

const ACHIEVEMENTS = [
  { id: 'rookie', icon: '🌟', label: 'Rookie Fan', desc: 'Joined FanVerse Nations', color: '#94a3b8', earned: true },
  { id: 'debater', icon: '🔥', label: 'Debater', desc: 'Participated in first debate', color: '#ef4444', earned: true },
  { id: 'predictor', icon: '🎯', label: 'Predictor', desc: 'Made first match prediction', color: '#f59e0b', earned: true },
  { id: 'nation_hero', icon: '⚔️', label: 'Nation Hero', desc: 'Contribute 1000 XP to Nation War', color: '#3b82f6', earned: false },
  { id: 'debate_champ', icon: '🏆', label: 'Debate Champion', desc: 'Win 10 debates', color: '#a855f7', earned: false },
  { id: 'prediction_master', icon: '🔮', label: 'Prediction Master', desc: 'Reach 80% prediction accuracy', color: '#22c55e', earned: false },
  { id: 'legendary', icon: '👑', label: 'Legendary Supporter', desc: 'Reach Fan Level 50', color: '#f5a623', earned: false },
  { id: 'wc_expert', icon: '⭐', label: 'World Cup Expert', desc: 'Correctly predict 20 WC matches', color: '#06b6d4', earned: false },
];

function getNationLevelName(level: number): string {
  if (level >= 100) return 'Global Superpower';
  if (level >= 75) return 'Empire';
  if (level >= 50) return 'Kingdom';
  if (level >= 25) return 'City';
  if (level >= 10) return 'Village';
  return 'Camp';
}

function getNationTierColor(level: number): string {
  if (level >= 75) return '#f5a623';
  if (level >= 50) return '#a855f7';
  if (level >= 25) return '#3b82f6';
  if (level >= 10) return '#22c55e';
  return '#64748b';
}

function AnimatedXPBar({ progress, color }: { progress: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 1000, delay: 300, useNativeDriver: false }).start();
  }, [progress]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
      <Animated.View style={{ height: 7, width, backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { nations, missions, coins, bets } = useApp();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!user) return null;

  const xpProgress = (user.xp % 500) / 500;
  const fanIQ = Math.round(
    ((user.predictionAccuracy) * 0.4) +
    ((Math.min(user.reputationScore, 100)) * 0.3) +
    ((Math.min(user.debateWins * 10, 100)) * 0.3)
  );
  const fanIQLabel = fanIQ >= 80 ? 'Elite' : fanIQ >= 60 ? 'Advanced' : fanIQ >= 40 ? 'Intermediate' : 'Rising';
  const fanIQColor = fanIQ >= 80 ? '#f5a623' : fanIQ >= 60 ? '#3b82f6' : fanIQ >= 40 ? '#22c55e' : '#64748b';

  const userNation = user.teamName ? nations.find(n => n.name.toLowerCase() === user.teamName?.toLowerCase()) : null;
  const nationLevel = userNation?.level ?? 1;
  const tierColor = getNationTierColor(nationLevel);

  const earnedBadges = ACHIEVEMENTS.filter(a => {
    if (a.id === 'rookie') return true;
    if (a.id === 'debater') return user.debateWins > 0;
    if (a.id === 'predictor') return user.predictionAccuracy > 0;
    if (a.id === 'debate_champ') return user.debateWins >= 10;
    if (a.id === 'prediction_master') return user.predictionAccuracy >= 80;
    if (a.id === 'legendary') return user.fanLevel >= 50;
    return false;
  });

  const pendingBets = bets.filter(b => b.status === 'pending').length;
  const missionsCompleted = missions.filter(m => m.completed).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 60 : 30 }}
    >
      {/* ── PROFILE HERO ── */}
      <LinearGradient
        colors={['#0a1628', '#111827', colors.background]}
        style={[styles.hero, { paddingTop: Platform.OS === 'web' ? 72 : insets.top + 20 }]}
      >
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: tierColor }]}>
            <View style={[styles.avatar, { borderColor: tierColor + '60' }]}>
              <Text style={styles.avatarEmoji}>{user.teamFlag ?? '⚽'}</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.levelBadgeText}>{user.fanLevel}</Text>
            </View>
          </View>

          <Text style={styles.username}>{user.username}</Text>
          <View style={[styles.nationPill, { backgroundColor: tierColor + '20', borderColor: tierColor + '50' }]}>
            <Text style={{ fontSize: 14 }}>{user.teamFlag}</Text>
            <Text style={[styles.nationPillText, { color: tierColor }]}>
              {user.teamName ?? 'No Nation'} {userNation ? `· ${getNationLevelName(nationLevel)}` : ''}
            </Text>
          </View>

          <View style={styles.xpSection}>
            <View style={styles.xpLabelRow}>
              <Text style={[styles.xpLabel, { color: colors.muted }]}>Level {user.fanLevel} · {user.xp % 500}/500 XP</Text>
              <Text style={[styles.xpLabel, { color: colors.primary }]}>+{500 - (user.xp % 500)} to Level {user.fanLevel + 1}</Text>
            </View>
            <AnimatedXPBar progress={xpProgress} color={colors.primary} />
          </View>
        </View>
      </LinearGradient>

      {/* ── FAN IQ CARD ── */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: -1 }]}>
        <View style={styles.fanIQRow}>
          <View style={[styles.fanIQCircle, { borderColor: fanIQColor }]}>
            <Text style={[styles.fanIQScore, { color: fanIQColor }]}>{fanIQ}</Text>
            <Text style={[styles.fanIQUnit, { color: colors.muted }]}>IQ</Text>
          </View>
          <View style={styles.fanIQInfo}>
            <View style={styles.fanIQTitleRow}>
              <Text style={[styles.fanIQTitle, { color: colors.foreground }]}>Fan IQ Score</Text>
              <View style={[styles.fanIQBadge, { backgroundColor: fanIQColor + '20' }]}>
                <Text style={[styles.fanIQBadgeText, { color: fanIQColor }]}>{fanIQLabel}</Text>
              </View>
            </View>
            <Text style={[styles.fanIQDesc, { color: colors.muted }]}>Based on predictions, debate quality & reputation</Text>
            <View style={{ marginTop: 8, gap: 4 }}>
              {[
                { label: 'Prediction Accuracy', val: user.predictionAccuracy, max: 100, color: '#22c55e' },
                { label: 'Reputation Score', val: Math.min(user.reputationScore, 100), max: 100, color: '#3b82f6' },
                { label: 'Debate Wins', val: Math.min(user.debateWins * 10, 100), max: 100, color: '#a855f7' },
              ].map(s => (
                <View key={s.label} style={styles.iqSubRow}>
                  <Text style={[styles.iqSubLabel, { color: colors.muted }]}>{s.label}</Text>
                  <View style={styles.iqSubBarWrap}>
                    <View style={[styles.iqSubBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.iqSubFill, { width: `${(s.val / s.max) * 100}%`, backgroundColor: s.color }]} />
                    </View>
                    <Text style={[styles.iqSubVal, { color: s.color }]}>{s.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ── STATS GRID ── */}
      <View style={styles.statsGrid}>
        {[
          { icon: 'star', label: 'Reputation', value: user.reputationScore.toLocaleString(), color: colors.primary },
          { icon: 'trophy', label: 'Debate Wins', value: user.debateWins, color: '#a855f7' },
          { icon: 'analytics', label: 'Prediction %', value: `${user.predictionAccuracy}%`, color: '#22c55e' },
          { icon: 'flash', label: 'Total XP', value: user.xp.toLocaleString(), color: '#3b82f6' },
          { icon: 'wallet', label: 'FanCoins', value: `🪙 ${coins.toLocaleString()}`, color: '#f59e0b' },
          { icon: 'checkmark-circle', label: 'Missions Today', value: `${missionsCompleted}/${missions.length}`, color: '#ef4444' },
        ].map(stat => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconWrap, { backgroundColor: stat.color + '18' }]}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── ACHIEVEMENTS ── */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🏅 Achievements</Text>
          <Text style={[styles.sectionSub, { color: colors.muted }]}>{earnedBadges.length}/{ACHIEVEMENTS.length}</Text>
        </View>
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map(a => (
            <View key={a.id} style={[styles.achieveCard, {
              backgroundColor: a.earned ? a.color + '15' : colors.cardAlt,
              borderColor: a.earned ? a.color + '50' : colors.border,
              opacity: a.earned ? 1 : 0.55,
            }]}>
              <Text style={[styles.achieveEmoji, { opacity: a.earned ? 1 : 0.4 }]}>{a.icon}</Text>
              <Text style={[styles.achieveLabel, { color: a.earned ? colors.foreground : colors.muted }]} numberOfLines={1}>{a.label}</Text>
              {!a.earned && <Ionicons name="lock-closed" size={10} color={colors.muted} style={{ marginTop: 2 }} />}
            </View>
          ))}
        </View>
      </View>

      {/* ── PREMIUM TEASER ── */}
      <TouchableOpacity activeOpacity={0.9} style={styles.premiumCard}>
        <LinearGradient
          colors={['#1a0a3d', '#2d1265', '#1a0a3d']}
          style={styles.premiumGrad}
        >
          <View style={styles.premiumTop}>
            <Text style={styles.premiumCrown}>👑</Text>
            <View>
              <Text style={styles.premiumTitle}>Fan Pass Premium</Text>
              <Text style={styles.premiumSub}>Unlock 5,000 XP/day + Elite Badge</Text>
            </View>
          </View>
          <View style={styles.premiumFeatures}>
            {['5× higher XP cap', 'Premium Badge & Frame', 'Nation Leadership', 'AI Fan Insights', 'Exclusive Events'].map(f => (
              <View key={f} style={styles.premiumFeatureRow}>
                <Ionicons name="checkmark-circle" size={14} color="#a855f7" />
                <Text style={styles.premiumFeatureText}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={styles.premiumBtnRow}>
            <View style={[styles.premiumBtn, { backgroundColor: '#a855f7' }]}>
              <Text style={styles.premiumBtnText}>Fan Pass — Coming Soon</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── YOUR NATION ── */}
      {userNation && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⚔️ Your Nation</Text>
          </View>
          <View style={[styles.nationCard, { backgroundColor: colors.cardAlt, borderColor: tierColor + '40' }]}>
            <LinearGradient colors={[tierColor + '18', 'transparent']} style={styles.nationCardInner}>
              <View style={styles.nationCardTopRow}>
                <Text style={{ fontSize: 48 }}>{user.teamFlag}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.nationName, { color: colors.foreground }]}>{userNation.name}</Text>
                  <View style={[styles.nationLevelChip, { backgroundColor: tierColor + '25', borderColor: tierColor + '50' }]}>
                    <Text style={[styles.nationLevelChipText, { color: tierColor }]}>Level {userNation.level} · {userNation.levelName}</Text>
                  </View>
                </View>
                <View style={[styles.rankCircle, { borderColor: tierColor }]}>
                  <Text style={[styles.rankNumber, { color: tierColor }]}>#{userNation.rank}</Text>
                </View>
              </View>
              <View style={styles.nationStatsRow}>
                {[
                  { label: 'Members', val: `${(userNation.members / 1000).toFixed(0)}k` },
                  { label: 'Total XP', val: `${(userNation.xp / 1000000).toFixed(1)}M` },
                  { label: 'Week XP', val: `${(userNation.weeklyXp / 1000).toFixed(0)}k` },
                  { label: 'Region', val: userNation.confederation },
                ].map(s => (
                  <View key={s.label} style={styles.nationStatItem}>
                    <Text style={[styles.nationStatVal, { color: colors.foreground }]}>{s.val}</Text>
                    <Text style={[styles.nationStatLabel, { color: colors.muted }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
              {user.teamChangedAt && (
                <Text style={[styles.nationChangeTip, { color: colors.muted }]}>
                  Next nation change: {new Date(new Date(user.teamChangedAt).getTime() + 90 * 86400000).toLocaleDateString()}
                </Text>
              )}
            </LinearGradient>
          </View>
        </View>
      )}

      {/* ── ACCOUNT ── */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⚙️ Account</Text>
        {[
          { icon: 'mail-outline', label: user.email, color: colors.mutedForeground },
          { icon: 'calendar-outline', label: `Joined ${new Date(user.createdAt).toLocaleDateString()}`, color: colors.mutedForeground },
        ].map(item => (
          <View key={item.label} style={[styles.accountRow, { borderTopColor: colors.border }]}>
            <Ionicons name={item.icon as any} size={16} color={colors.muted} />
            <Text style={[styles.accountRowText, { color: item.color }]}>{item.label}</Text>
          </View>
        ))}
        <TouchableOpacity style={[styles.accountRow, { borderTopColor: colors.border }]} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color={colors.danger} />
          <Text style={[styles.accountRowText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  avatarSection: { alignItems: 'center', gap: 10 },
  avatarRing: { width: 108, height: 108, borderRadius: 54, borderWidth: 3, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, backgroundColor: '#1a2236', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 50 },
  levelBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  username: { fontSize: 26, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#f1f5f9', marginTop: 4 },
  nationPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  nationPillText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  xpSection: { width: '100%', gap: 6 },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  section: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, borderWidth: 1, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  sectionSub: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  fanIQRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  fanIQCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  fanIQScore: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, lineHeight: 26 },
  fanIQUnit: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  fanIQInfo: { flex: 1 },
  fanIQTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  fanIQTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  fanIQBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  fanIQBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  fanIQDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  iqSubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  iqSubLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', width: 120 },
  iqSubBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  iqSubBar: { flex: 1, height: 4, borderRadius: 2 },
  iqSubFill: { height: 4, borderRadius: 2 },
  iqSubVal: { fontSize: 10, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, width: 24, textAlign: 'right' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { width: '30%', flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
  statIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  statLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achieveCard: { borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', gap: 3, minWidth: 76, flexGrow: 1 },
  achieveEmoji: { fontSize: 24 },
  achieveLabel: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, textAlign: 'center' },
  premiumCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden' },
  premiumGrad: { padding: 20 },
  premiumTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  premiumCrown: { fontSize: 36 },
  premiumTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#e2d4f8' },
  premiumSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#a78bca', marginTop: 2 },
  premiumFeatures: { gap: 7, marginBottom: 16 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  premiumFeatureText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#c4b5fd' },
  premiumBtnRow: { flexDirection: 'row' },
  premiumBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  premiumBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#fff' },
  nationCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  nationCardInner: { padding: 14, gap: 12 },
  nationCardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nationName: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationLevelChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  nationLevelChipText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  rankCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rankNumber: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  nationStatItem: { alignItems: 'center', gap: 2 },
  nationStatVal: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationStatLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  nationChangeTip: { fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: 1 },
  accountRowText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
});
