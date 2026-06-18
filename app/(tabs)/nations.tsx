import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from 'react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import type { NationEntry } from '@/context/AppContext';

const TABS = ['Nation War', 'Rankings', 'My Nation'] as const;
type Tab = (typeof TABS)[number];

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

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}

function formatCountdown(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.4, duration: 700, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);
  return <Animated.View style={[warStyles.pulseDot, { transform: [{ scale }] }]} />;
}

function NationWarTab({ colors }: { colors: any }) {
  const { currentWar } = useApp();
  const total = currentWar.sideA.xp + currentWar.sideB.xp;
  const aFrac = total > 0 ? currentWar.sideA.xp / total : 0.5;
  const bFrac = 1 - aFrac;
  const aLeading = currentWar.sideA.xp > currentWar.sideB.xp;

  const barAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: aFrac, duration: 1200, useNativeDriver: false }).start();
  }, [aFrac]);
  const aBarWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
      {/* Hero War Card */}
      <View style={[warStyles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient colors={['#0d1829', colors.card]} style={warStyles.heroCardGrad}>
          <View style={warStyles.warTopRow}>
            <View style={warStyles.warLivePill}>
              <PulsingDot />
              <Text style={warStyles.warLiveText}>NATION WAR · WEEK {currentWar.week}</Text>
            </View>
            <View style={[warStyles.timerPill, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
              <Ionicons name="time" size={12} color={colors.primary} />
              <Text style={[warStyles.timerText, { color: colors.primary }]}>{formatCountdown(currentWar.endsAt)}</Text>
            </View>
          </View>

          <View style={warStyles.warTeamsRow}>
            {/* Side A */}
            <View style={[warStyles.warSide, aLeading && { opacity: 1 }, !aLeading && { opacity: 0.75 }]}>
              <Text style={warStyles.warFlag}>{currentWar.sideA.nationFlag}</Text>
              <Text style={[warStyles.warNationName, { color: colors.foreground }]}>{currentWar.sideA.nationName}</Text>
              <Text style={[warStyles.warXP, { color: currentWar.sideA.color }]}>{formatNumber(currentWar.sideA.xp)} XP</Text>
              <Text style={[warStyles.warMembers, { color: colors.muted }]}>{formatNumber(currentWar.sideA.members)} fans</Text>
              {aLeading && (
                <View style={[warStyles.leadingBadge, { backgroundColor: currentWar.sideA.color + '22' }]}>
                  <Text style={[warStyles.leadingText, { color: currentWar.sideA.color }]}>LEADING ▲</Text>
                </View>
              )}
            </View>

            {/* VS center */}
            <View style={warStyles.warVsCenter}>
              <LinearGradient colors={['#ef4444', '#f59e0b', '#ef4444']} style={warStyles.warVsBadge}>
                <Text style={warStyles.warVsText}>⚔️</Text>
              </LinearGradient>
              <Text style={[warStyles.warVsLabel, { color: colors.muted }]}>VS</Text>
            </View>

            {/* Side B */}
            <View style={[warStyles.warSide, { alignItems: 'flex-end' }, !aLeading && { opacity: 1 }, aLeading && { opacity: 0.75 }]}>
              <Text style={warStyles.warFlag}>{currentWar.sideB.nationFlag}</Text>
              <Text style={[warStyles.warNationName, { color: colors.foreground }]}>{currentWar.sideB.nationName}</Text>
              <Text style={[warStyles.warXP, { color: currentWar.sideB.color }]}>{formatNumber(currentWar.sideB.xp)} XP</Text>
              <Text style={[warStyles.warMembers, { color: colors.muted }]}>{formatNumber(currentWar.sideB.members)} fans</Text>
              {!aLeading && (
                <View style={[warStyles.leadingBadge, { backgroundColor: currentWar.sideB.color + '22' }]}>
                  <Text style={[warStyles.leadingText, { color: currentWar.sideB.color }]}>LEADING ▲</Text>
                </View>
              )}
            </View>
          </View>

          {/* Progress bar */}
          <View style={[warStyles.bigBar, { backgroundColor: currentWar.sideB.color + '40' }]}>
            <Animated.View style={[warStyles.bigBarFill, { width: aBarWidth, backgroundColor: currentWar.sideA.color }]} />
          </View>
          <View style={warStyles.barLabels}>
            <Text style={[warStyles.barLabel, { color: currentWar.sideA.color }]}>{Math.round(aFrac * 100)}%</Text>
            <Text style={[warStyles.barLabel, { color: currentWar.sideB.color }]}>{Math.round(bFrac * 100)}%</Text>
          </View>
        </LinearGradient>
      </View>

      {/* How to earn points */}
      <View style={[warStyles.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[warStyles.howTitle, { color: colors.foreground }]}>⚡ How to earn War XP</Text>
        {[
          { icon: '👍', action: 'Vote on debates', xp: '+5 XP per vote' },
          { icon: '🔥', action: 'Create a debate', xp: '+25 XP' },
          { icon: '🎯', action: 'Correct prediction', xp: '+50 XP' },
          { icon: '💬', action: 'Comment on matches', xp: '+10 XP' },
          { icon: '🎯', action: 'Complete daily mission', xp: '+30-100 XP' },
          { icon: '🔐', action: 'Daily login streak', xp: '+20 XP' },
        ].map(item => (
          <View key={item.action} style={[warStyles.howRow, { borderTopColor: colors.border }]}>
            <Text style={{ fontSize: 20, width: 32 }}>{item.icon}</Text>
            <Text style={[warStyles.howAction, { color: colors.foreground }]} >{item.action}</Text>
            <View style={[warStyles.howXP, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[warStyles.howXPText, { color: colors.primary }]}>{item.xp}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* War prizes */}
      <View style={[warStyles.prizeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient colors={['#1a0f00', colors.card]} style={warStyles.prizeGrad}>
          <Text style={[warStyles.prizeTitle, { color: colors.foreground }]}>🏆 War Prizes</Text>
          <Text style={[warStyles.prizeSub, { color: colors.muted }]}>Winning nation earns exclusive rewards</Text>
          <View style={warStyles.prizeGrid}>
            {[
              { icon: '🏆', label: 'War Trophy Badge', color: '#f5a623' },
              { icon: '⚡', label: '2× Bonus XP (48h)', color: '#22c55e' },
              { icon: '🌟', label: 'Hall of Fame', color: '#3b82f6' },
              { icon: '👑', label: 'Nation Crown', color: '#a855f7' },
            ].map(p => (
              <View key={p.label} style={[warStyles.prizeItem, { backgroundColor: p.color + '15', borderColor: p.color + '40' }]}>
                <Text style={{ fontSize: 26 }}>{p.icon}</Text>
                <Text style={[warStyles.prizeLabel, { color: p.color }]}>{p.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* Past wars */}
      <View style={[warStyles.pastCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[warStyles.howTitle, { color: colors.foreground }]}>📜 Recent Wars</Text>
        {[
          { sideA: '🇧🇷 Brazil', sideB: '🇪🇸 Spain', winner: 'Brazil', week: 24, xpA: 312000, xpB: 289000 },
          { sideA: '🇩🇪 Germany', sideB: '🇫🇷 France', winner: 'Germany', week: 23, xpA: 278000, xpB: 241000 },
          { sideA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', sideB: '🇮🇹 Italy', winner: 'Italy', week: 22, xpA: 198000, xpB: 221000 },
        ].map(war => (
          <View key={war.week} style={[warStyles.pastRow, { borderTopColor: colors.border }]}>
            <View style={warStyles.pastMeta}>
              <Text style={[warStyles.pastWeek, { color: colors.muted }]}>Week {war.week}</Text>
              <Text style={[warStyles.pastMatchup, { color: colors.foreground }]}>{war.sideA} vs {war.sideB}</Text>
            </View>
            <View style={[warStyles.winnerBadge, { backgroundColor: '#f5a623' + '20' }]}>
              <Text style={{ fontSize: 14 }}>🏆</Text>
              <Text style={[warStyles.winnerText, { color: '#f5a623' }]}>{war.winner}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function RankingsTab({ colors }: { colors: any }) {
  const { nations } = useApp();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
      <Text style={[rankStyles.tabTitle, { color: colors.foreground }]}>🌍 Nation Power Rankings</Text>
      <Text style={[rankStyles.tabSub, { color: colors.muted }]}>Updated in real-time by fan activity</Text>

      {nations.map((nation, index) => {
        const tierColor = getNationTierColor(nation.level);
        const isTop3 = index < 3;
        const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

        return (
          <View
            key={nation.rank}
            style={[
              rankStyles.nationRow,
              {
                backgroundColor: isTop3 ? colors.card : colors.cardAlt,
                borderColor: isTop3 ? tierColor + '50' : colors.border,
              }
            ]}
          >
            {isTop3 && (
              <LinearGradient
                colors={[tierColor + '18', 'transparent']}
                style={rankStyles.nationRowGrad}
              />
            )}
            <View style={rankStyles.rankWrap}>
              {medalEmoji ? (
                <Text style={{ fontSize: 20 }}>{medalEmoji}</Text>
              ) : (
                <Text style={[rankStyles.rankNum, { color: colors.muted }]}>{nation.rank}</Text>
              )}
            </View>
            <Text style={rankStyles.nationFlag}>{nation.flag}</Text>
            <View style={rankStyles.nationMeta}>
              <View style={rankStyles.nationNameRow}>
                <Text style={[rankStyles.nationName, { color: colors.foreground }]}>{nation.name}</Text>
                <View style={[rankStyles.levelChip, { backgroundColor: tierColor + '20', borderColor: tierColor + '40' }]}>
                  <Text style={[rankStyles.levelChipText, { color: tierColor }]}>Lv{nation.level} {getNationLevelName(nation.level)}</Text>
                </View>
              </View>
              <Text style={[rankStyles.nationSub, { color: colors.muted }]}>{formatNumber(nation.members)} fans · {nation.confederation}</Text>
            </View>
            <View style={rankStyles.xpWrap}>
              <Text style={[rankStyles.xpVal, { color: tierColor }]}>{formatNumber(nation.xp)}</Text>
              <Text style={[rankStyles.xpLabel, { color: colors.muted }]}>XP</Text>
              <Text style={[rankStyles.weekXP, { color: colors.muted }]}>+{formatNumber(nation.weeklyXp)}/wk</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function MyNationTab({ colors }: { colors: any }) {
  const { user } = useAuth();
  const { nations, missions } = useApp();

  const userNation = user?.teamName ? nations.find(n => n.name.toLowerCase() === user.teamName?.toLowerCase()) : null;

  if (!userNation || !user?.teamId) {
    return (
      <View style={myStyles.emptyWrap}>
        <Text style={{ fontSize: 48 }}>🌍</Text>
        <Text style={[myStyles.emptyTitle, { color: colors.foreground }]}>No Nation Selected</Text>
        <Text style={[myStyles.emptyText, { color: colors.muted }]}>Go to your profile to choose a nation and start contributing XP!</Text>
      </View>
    );
  }

  const tierColor = getNationTierColor(userNation.level);
  const nextLevelXp = userNation.xp + 500000;
  const xpProgress = (userNation.xp % 1000000) / 1000000;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
      {/* Nation hero */}
      <View style={[myStyles.nationHero, { backgroundColor: colors.card, borderColor: tierColor + '50' }]}>
        <LinearGradient colors={[tierColor + '25', colors.card]} style={myStyles.nationHeroGrad}>
          <View style={myStyles.nationTopRow}>
            <Text style={myStyles.nationHeroFlag}>{user.teamFlag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[myStyles.nationHeroName, { color: colors.foreground }]}>{userNation.name}</Text>
              <View style={[myStyles.nationLevelPill, { backgroundColor: tierColor + '20', borderColor: tierColor + '50' }]}>
                <Text style={[myStyles.nationLevelPillText, { color: tierColor }]}>Level {userNation.level} · {getNationLevelName(userNation.level)}</Text>
              </View>
            </View>
            <View style={[myStyles.rankCircle, { borderColor: tierColor }]}>
              <Ionicons name="earth" size={14} color={tierColor} />
              <Text style={[myStyles.rankNum, { color: tierColor }]}>#{userNation.rank}</Text>
            </View>
          </View>

          <View style={myStyles.nationLevelBarWrap}>
            <View style={myStyles.nationLevelBarLabels}>
              <Text style={[myStyles.nationLevelBarLabel, { color: colors.muted }]}>Nation XP Progress</Text>
              <Text style={[myStyles.nationLevelBarLabel, { color: tierColor }]}>{formatNumber(userNation.xp)} / {formatNumber(nextLevelXp)}</Text>
            </View>
            <View style={[myStyles.nationLevelBar, { backgroundColor: colors.border }]}>
              <View style={[myStyles.nationLevelFill, { width: `${xpProgress * 100}%`, backgroundColor: tierColor }]} />
            </View>
          </View>

          <View style={myStyles.nationStatsGrid}>
            {[
              { icon: '👥', label: 'Members', val: formatNumber(userNation.members) },
              { icon: '⚡', label: 'Total XP', val: formatNumber(userNation.xp) },
              { icon: '📈', label: 'Week XP', val: formatNumber(userNation.weeklyXp) },
              { icon: '🌐', label: 'Region', val: userNation.confederation },
            ].map(s => (
              <View key={s.label} style={[myStyles.nationStatBox, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                <Text style={[myStyles.nationStatVal, { color: colors.foreground }]}>{s.val}</Text>
                <Text style={[myStyles.nationStatLabel, { color: colors.muted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* Daily missions for nation */}
      <View style={[myStyles.missionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={myStyles.missionsHeader}>
          <Text style={[myStyles.missionsTitle, { color: colors.foreground }]}>🎯 Today's Nation Missions</Text>
          <Text style={[myStyles.missionCount, { color: colors.muted }]}>
            {missions.filter(m => m.completed).length}/{missions.length} done
          </Text>
        </View>
        {missions.map(m => (
          <View key={m.id} style={[myStyles.missionRow, { borderTopColor: colors.border }]}>
            <Text style={{ fontSize: 22, width: 32 }}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[myStyles.missionName, { color: colors.foreground }]}>{m.title}</Text>
              <View style={[myStyles.missionBar, { backgroundColor: colors.border }]}>
                <View style={[myStyles.missionFill, {
                  width: `${Math.min(m.progress / m.target, 1) * 100}%`,
                  backgroundColor: m.completed ? colors.success : colors.primary,
                }]} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={[myStyles.xpChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[myStyles.xpChipText, { color: colors.primary }]}>+{m.xpReward} XP</Text>
              </View>
              {m.completed
                ? <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                : <Text style={[myStyles.progressText, { color: colors.muted }]}>{m.progress}/{m.target}</Text>
              }
            </View>
          </View>
        ))}
      </View>

      {/* Nation leaderboard */}
      <View style={[myStyles.missionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[myStyles.missionsTitle, { color: colors.foreground }]}>👑 Top {userNation.name} Fans</Text>
        {[
          { name: 'SuperFan_1', xp: 12450, level: 25, flag: user.teamFlag },
          { name: 'NationLeader', xp: 10200, level: 22, flag: user.teamFlag },
          { name: user.username, xp: user.xp, level: user.fanLevel, flag: user.teamFlag, isMe: true },
        ].sort((a, b) => b.xp - a.xp).map((fan, i) => (
          <View key={fan.name} style={[myStyles.fanRow, { borderTopColor: colors.border, backgroundColor: (fan as any).isMe ? tierColor + '10' : 'transparent' }]}>
            <Text style={[myStyles.fanRank, { color: colors.muted }]}>#{i + 1}</Text>
            <Text style={{ fontSize: 20 }}>{fan.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[myStyles.fanName, { color: (fan as any).isMe ? tierColor : colors.foreground }]}>
                {fan.name} {(fan as any).isMe ? '(You)' : ''}
              </Text>
              <Text style={[myStyles.fanLevel, { color: colors.muted }]}>Level {fan.level}</Text>
            </View>
            <Text style={[myStyles.fanXP, { color: colors.primary }]}>{fan.xp.toLocaleString()} XP</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function NationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('Nation War');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#0d1829', '#111827']}
        style={[styles.header, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12 }]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>⚔️ FanVerse Nations</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>Fight for your nation. Earn glory.</Text>

        <View style={[styles.tabBar, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.card, borderRadius: 10 }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {activeTab === 'Nation War' && <NationWarTab colors={colors} />}
      {activeTab === 'Rankings' && <RankingsTab colors={colors} />}
      {activeTab === 'My Nation' && <MyNationTab colors={colors} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  headerSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, marginBottom: 14 },
  tabBar: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 0 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  tabText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
});

const warStyles = StyleSheet.create({
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  heroCardGrad: { padding: 18 },
  warTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  warLivePill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  warLiveText: { fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#ef4444', letterSpacing: 0.5 },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  timerText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  warTeamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  warSide: { flex: 1, gap: 5 },
  warFlag: { fontSize: 48 },
  warNationName: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  warXP: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  warMembers: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  leadingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  leadingText: { fontSize: 9, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, letterSpacing: 0.5 },
  warVsCenter: { alignItems: 'center', paddingHorizontal: 8, gap: 6 },
  warVsBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  warVsText: { fontSize: 22 },
  warVsLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, letterSpacing: 1 },
  bigBar: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  bigBarFill: { height: 12, borderRadius: 6 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  howCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  howTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, marginBottom: 10 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  howAction: { flex: 1, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  howXP: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  howXPText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  prizeCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  prizeGrad: { padding: 16 },
  prizeTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, marginBottom: 4 },
  prizeSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 14 },
  prizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prizeItem: { flexGrow: 1, minWidth: '45%', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 6 },
  prizeLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, textAlign: 'center' },
  pastCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  pastRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1 },
  pastMeta: { gap: 2 },
  pastWeek: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  pastMatchup: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  winnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  winnerText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
});

const rankStyles = StyleSheet.create({
  tabTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  tabSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: -8, marginBottom: 4 },
  nationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, overflow: 'hidden' },
  nationRowGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  rankWrap: { width: 28, alignItems: 'center' },
  rankNum: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationFlag: { fontSize: 28 },
  nationMeta: { flex: 1, gap: 3 },
  nationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  nationName: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  levelChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  levelChipText: { fontSize: 9, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationSub: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  xpWrap: { alignItems: 'flex-end', gap: 2 },
  xpVal: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  xpLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  weekXP: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
});

const myStyles = StyleSheet.create({
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, textAlign: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },
  nationHero: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  nationHeroGrad: { padding: 18, gap: 14 },
  nationTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nationHeroFlag: { fontSize: 52 },
  nationHeroName: { fontSize: 20, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationLevelPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  nationLevelPillText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  rankCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  rankNum: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationLevelBarWrap: { gap: 5 },
  nationLevelBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  nationLevelBarLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  nationLevelBar: { height: 7, borderRadius: 4 },
  nationLevelFill: { height: 7, borderRadius: 4 },
  nationStatsGrid: { flexDirection: 'row', gap: 8 },
  nationStatBox: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', gap: 4 },
  nationStatVal: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  nationStatLabel: { fontSize: 9, fontFamily: 'Poppins_400Regular' },
  missionsCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  missionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  missionsTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  missionCount: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1 },
  missionName: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, marginBottom: 5 },
  missionBar: { height: 4, borderRadius: 2 },
  missionFill: { height: 4, borderRadius: 2 },
  xpChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  xpChipText: { fontSize: 10, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  progressText: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  fanRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, paddingHorizontal: 4, borderRadius: 8 },
  fanRank: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, width: 24, textAlign: 'center' },
  fanName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  fanLevel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  fanXP: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
});
