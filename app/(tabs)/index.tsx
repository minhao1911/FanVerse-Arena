import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { DebateCard } from '@/components/DebateCard';
import type { DailyMission } from '@/context/AppContext';

function getNationTierColor(level: number): string {
  if (level >= 75) return '#f5a623';
  if (level >= 50) return '#a855f7';
  if (level >= 25) return '#3b82f6';
  if (level >= 10) return '#22c55e';
  return '#64748b';
}

function FanIQBar({ iq, colors }: { iq: number; colors: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: iq / 100, duration: 1200, useNativeDriver: false }).start();
  }, [iq]);
  const iqColor = iq >= 80 ? '#f5a623' : iq >= 60 ? '#3b82f6' : iq >= 40 ? '#22c55e' : '#64748b';
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 11, fontFamily: 'Poppins_500Medium' }}>Fan IQ</Text>
        <Text style={{ color: iqColor, fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const }}>{iq} / 100</Text>
      </View>
      <View style={{ height: 5, backgroundColor: colors.border, borderRadius: 3 }}>
        <Animated.View style={{ height: 5, width, backgroundColor: iqColor, borderRadius: 3 }} />
      </View>
    </View>
  );
}

function XPBar({ xp, level, colors }: { xp: number; level: number; colors: any }) {
  const progress = (xp % 500) / 500;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 900, useNativeDriver: false }).start();
  }, [progress]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.muted, fontSize: 11, fontFamily: 'Poppins_500Medium' }}>Level {level}</Text>
        <Text style={{ color: colors.muted, fontSize: 11, fontFamily: 'Poppins_500Medium' }}>{xp % 500} / 500 XP</Text>
      </View>
      <View style={{ height: 5, backgroundColor: colors.border, borderRadius: 3 }}>
        <Animated.View style={{ height: 5, width, borderRadius: 3, backgroundColor: colors.primary }} />
      </View>
    </View>
  );
}

function NationWarBanner({ colors }: { colors: any }) {
  const { currentWar } = useApp();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);

  const total = currentWar.sideA.xp + currentWar.sideB.xp;
  const aFrac = total > 0 ? currentWar.sideA.xp / total : 0.5;
  const bFrac = 1 - aFrac;
  const daysLeft = Math.max(0, Math.ceil((new Date(currentWar.endsAt).getTime() - Date.now()) / 86400000));

  return (
    <TouchableOpacity
      style={[styles.warCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push('/(tabs)/nations' as any)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#0f1f3d', colors.card]}
        style={styles.warCardGrad}
      >
        <View style={styles.warHeader}>
          <View style={styles.warLivePill}>
            <Animated.View style={[styles.warLiveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.warLiveText}>NATION WAR · WEEK {currentWar.week}</Text>
          </View>
          <View style={styles.warTimerPill}>
            <Ionicons name="time-outline" size={11} color={colors.muted} />
            <Text style={[styles.warTimerText, { color: colors.muted }]}>{daysLeft}d left</Text>
          </View>
        </View>

        <View style={styles.warTeams}>
          <View style={styles.warTeamSide}>
            <Text style={styles.warFlag}>{currentWar.sideA.nationFlag}</Text>
            <Text style={[styles.warTeamName, { color: colors.foreground }]}>{currentWar.sideA.nationName}</Text>
            <Text style={[styles.warXP, { color: currentWar.sideA.color }]}>{(currentWar.sideA.xp / 1000).toFixed(1)}k XP</Text>
          </View>
          <View style={styles.warVsWrap}>
            <LinearGradient colors={['#ef4444', '#f59e0b']} style={styles.warVsBadge}>
              <Text style={styles.warVsText}>WAR</Text>
            </LinearGradient>
          </View>
          <View style={[styles.warTeamSide, { alignItems: 'flex-end' }]}>
            <Text style={styles.warFlag}>{currentWar.sideB.nationFlag}</Text>
            <Text style={[styles.warTeamName, { color: colors.foreground }]}>{currentWar.sideB.nationName}</Text>
            <Text style={[styles.warXP, { color: currentWar.sideB.color }]}>{(currentWar.sideB.xp / 1000).toFixed(1)}k XP</Text>
          </View>
        </View>

        <View style={[styles.warBarBg, { backgroundColor: colors.border }]}>
          <View style={[styles.warBarA, { width: `${aFrac * 100}%`, backgroundColor: currentWar.sideA.color }]} />
          <View style={[styles.warBarB, { width: `${bFrac * 100}%`, backgroundColor: currentWar.sideB.color }]} />
        </View>
        <Text style={[styles.warCta, { color: colors.muted }]}>Earn XP to fight for your nation → tap to join</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function MissionCard({ mission, onComplete, colors }: { mission: DailyMission; onComplete: () => void; colors: any }) {
  const progress = mission.target > 0 ? mission.progress / mission.target : 0;
  return (
    <View style={[styles.missionCard, {
      backgroundColor: mission.completed ? colors.card : colors.cardAlt,
      borderColor: mission.completed ? colors.success + '50' : colors.border,
      opacity: mission.completed ? 0.75 : 1,
    }]}>
      <View style={styles.missionIconWrap}>
        <Text style={{ fontSize: 20 }}>{mission.icon}</Text>
      </View>
      <View style={styles.missionBody}>
        <Text style={[styles.missionTitle, { color: colors.foreground }]} numberOfLines={1}>{mission.title}</Text>
        <View style={[styles.missionBar, { backgroundColor: colors.border }]}>
          <View style={[styles.missionBarFill, { width: `${Math.min(progress, 1) * 100}%`, backgroundColor: mission.completed ? colors.success : colors.primary }]} />
        </View>
        <Text style={[styles.missionProgress, { color: colors.muted }]}>{mission.progress}/{mission.target}</Text>
      </View>
      <View style={styles.missionReward}>
        <View style={[styles.xpBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.xpBadgeText, { color: colors.primary }]}>+{mission.xpReward} XP</Text>
        </View>
        {mission.completed && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { debates, voteDebate, onlineCount, missions, completeMission, nations } = useApp();

  const topDebates = [...debates].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)).slice(0, 4);

  const fanIQ = Math.round(
    ((user?.predictionAccuracy ?? 0) * 0.4) +
    ((Math.min(user?.reputationScore ?? 0, 100)) * 0.3) +
    ((Math.min((user?.debateWins ?? 0) * 10, 100)) * 0.3)
  );

  const userNation = user?.teamName ? nations.find(n => n.name.toLowerCase() === user.teamName?.toLowerCase()) : null;
  const tierColor = userNation ? getNationTierColor(userNation.level) : colors.muted;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, {
        paddingTop: Platform.OS === 'web' ? 67 : insets.top + 8,
        paddingBottom: 32,
      }]}
    >
      {/* ── HERO ── */}
      <LinearGradient
        colors={['#0d1829', '#111827', colors.background]}
        style={styles.heroBanner}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>
              {onlineCount > 0 ? `${onlineCount.toLocaleString()} online` : 'Connecting...'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/notifications' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroUser}>
          <View style={[styles.heroAvatar, { borderColor: tierColor }]}>
            <Text style={{ fontSize: 34 }}>{user?.teamFlag ?? '⚽'}</Text>
            <View style={[styles.heroLvlBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.heroLvlText}>{user?.fanLevel ?? 1}</Text>
            </View>
          </View>
          <View style={styles.heroUserInfo}>
            <Text style={styles.heroName}>{user?.username ?? 'Fan'}</Text>
            <Text style={[styles.heroNation, { color: tierColor }]}>
              {user?.teamFlag} {user?.teamName ?? 'No Nation'} {userNation ? `· ${userNation.levelName}` : ''}
            </Text>
            <View style={styles.heroStatRow}>
              {[
                { icon: 'star', value: user?.reputationScore ?? 0, color: colors.primary },
                { icon: 'trophy', value: user?.debateWins ?? 0, color: '#a855f7' },
                { icon: 'flash', value: user?.xp ?? 0, color: '#22c55e' },
              ].map(s => (
                <View key={s.icon} style={styles.heroStatItem}>
                  <Ionicons name={s.icon as any} size={12} color={s.color} />
                  <Text style={[styles.heroStatVal, { color: colors.foreground }]}>{s.value.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.fanIQCircle, { borderColor: fanIQ >= 60 ? colors.primary : colors.border }]}>
            <Text style={[styles.fanIQScore, { color: fanIQ >= 60 ? colors.primary : colors.mutedForeground }]}>{fanIQ}</Text>
            <Text style={[styles.fanIQLabel, { color: colors.muted }]}>IQ</Text>
          </View>
        </View>

        <View style={styles.heroBars}>
          <XPBar xp={user?.xp ?? 0} level={user?.fanLevel ?? 1} colors={colors} />
          <View style={{ marginTop: 10 }}>
            <FanIQBar iq={fanIQ} colors={colors} />
          </View>
        </View>
      </LinearGradient>

      {/* ── NATION WAR BANNER ── */}
      <NationWarBanner colors={colors} />

      {/* ── QUICK ACTIONS ── */}
      <View style={styles.quickRow}>
        {[
          { icon: '⚽', label: 'World Cup', color: '#22c55e', route: '/(tabs)/worldcup' },
          { icon: '⚔️', label: 'Nation War', color: '#ef4444', route: '/(tabs)/nations' },
          { icon: '🔥', label: 'Debate', color: '#f59e0b', route: '/(tabs)/arena' },
          { icon: '👥', label: 'Groups', color: '#3b82f6', route: '/(tabs)/communities' },
        ].map(a => (
          <TouchableOpacity
            key={a.label}
            style={[styles.quickBtn, { backgroundColor: a.color + '18', borderColor: a.color + '40' }]}
            onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(a.route as any); }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 22 }}>{a.icon}</Text>
            <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── DAILY MISSIONS ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionEmoji}>🎯</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Missions</Text>
        </View>
        <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
            {missions.filter(m => m.completed).length}/{missions.length}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.missionsRow}>
        {missions.map(mission => (
          <View key={mission.id} style={{ width: 200, marginRight: 10 }}>
            <MissionCard mission={mission} onComplete={() => completeMission(mission.id)} colors={colors} />
          </View>
        ))}
      </ScrollView>

      {/* ── YOUR NATION ── */}
      {userNation && (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionEmoji}>{user?.teamFlag}</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Nation</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/nations' as any)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>View War →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.nationCard, { backgroundColor: colors.card, borderColor: tierColor + '50' }]}
            onPress={() => router.push('/(tabs)/nations' as any)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[tierColor + '15', colors.card]}
              style={styles.nationCardGrad}
            >
              <View style={styles.nationCardLeft}>
                <Text style={styles.nationCardFlag}>{user?.teamFlag}</Text>
                <View>
                  <Text style={[styles.nationCardName, { color: colors.foreground }]}>{userNation.name}</Text>
                  <View style={[styles.nationLevelBadge, { backgroundColor: tierColor + '25', borderColor: tierColor + '50' }]}>
                    <Text style={[styles.nationLevelText, { color: tierColor }]}>Lv {userNation.level} · {userNation.levelName}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.nationCardRight}>
                <View style={styles.nationStat}>
                  <Text style={[styles.nationStatVal, { color: colors.foreground }]}>#{userNation.rank}</Text>
                  <Text style={[styles.nationStatLabel, { color: colors.muted }]}>Global</Text>
                </View>
                <View style={styles.nationStat}>
                  <Text style={[styles.nationStatVal, { color: colors.foreground }]}>{(userNation.members / 1000).toFixed(0)}k</Text>
                  <Text style={[styles.nationStatLabel, { color: colors.muted }]}>Members</Text>
                </View>
                <View style={styles.nationStat}>
                  <Text style={[styles.nationStatVal, { color: tierColor }]}>{(userNation.weeklyXp / 1000).toFixed(0)}k</Text>
                  <Text style={[styles.nationStatLabel, { color: colors.muted }]}>Week XP</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}

      {/* ── HOT DEBATES ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionEmoji}>🔥</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hot Debates</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/arena')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
        </TouchableOpacity>
      </View>

      {topDebates.map(item => (
        <View key={item.id} style={{ marginBottom: 8 }}>
          <DebateCard debate={item} onVote={voteDebate} onPress={() => {}} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  heroBanner: { borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1e2d4a' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 6 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#22c55e' },
  notifBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroUser: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, backgroundColor: '#1a2236', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroLvlBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  heroLvlText: { fontSize: 10, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  heroUserInfo: { flex: 1, gap: 3 },
  heroName: { fontSize: 20, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#f1f5f9' },
  heroNation: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  heroStatRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  heroStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatVal: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  fanIQCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  fanIQScore: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, lineHeight: 20 },
  fanIQLabel: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  heroBars: { gap: 2 },
  warCard: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  warCardGrad: { padding: 16 },
  warHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  warLivePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  warLiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  warLiveText: { fontSize: 10, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#ef4444', letterSpacing: 0.5 },
  warTimerPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  warTimerText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  warTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  warTeamSide: { flex: 1, gap: 4 },
  warFlag: { fontSize: 36 },
  warTeamName: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  warXP: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  warVsWrap: { alignItems: 'center', paddingHorizontal: 12 },
  warVsBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  warVsText: { fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#fff', letterSpacing: 1 },
  warBarBg: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', marginBottom: 8 },
  warBarA: { height: 8 },
  warBarB: { height: 8 },
  warCta: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  quickBtn: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center', gap: 6 },
  quickLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  sectionBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  sectionBadgeText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  seeAll: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  missionsRow: { paddingBottom: 16 },
  missionCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  missionIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  missionBody: { gap: 5 },
  missionTitle: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  missionBar: { height: 4, borderRadius: 2 },
  missionBarFill: { height: 4, borderRadius: 2 },
  missionProgress: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  missionReward: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  xpBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 22 },
  nationCardGrad: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nationCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nationCardFlag: { fontSize: 44 },
  nationCardName: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationLevelBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, alignSelf: 'flex-start' },
  nationLevelText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  nationCardRight: { flexDirection: 'row', gap: 16 },
  nationStat: { alignItems: 'center', gap: 2 },
  nationStatVal: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationStatLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
});
