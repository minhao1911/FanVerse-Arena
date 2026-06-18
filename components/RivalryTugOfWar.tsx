import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { getSocket, emitEvent } from '@/utils/socket';

const TEAM_A = { name: 'Argentina', flag: '🇦🇷', color: '#74b9ff', light: '#74b9ff22' };
const TEAM_B = { name: 'Brazil',    flag: '🇧🇷', color: '#fdcb6e', light: '#fdcb6e22' };

function formatPulls(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function PullButton({
  color,
  flag,
  name,
  onPress,
  disabled,
}: {
  color: string;
  flag: string;
  name: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: disabled ? 0.45 : 1,
      duration: disabled ? 60 : 220,
      useNativeDriver: useNative,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [disabled]);

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.86, duration: 90, useNativeDriver: useNative, easing: Easing.out(Easing.quad) }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: useNative, tension: 180, friction: 6 }),
    ]).start();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], opacity, flex: 1 }}>
      <TouchableOpacity
        style={[styles.pullBtn, { backgroundColor: color + '22', borderColor: color }]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <Text style={styles.pullFlag}>{flag}</Text>
        <Text style={[styles.pullTeamName, { color }]}>{name}</Text>
        <View style={[styles.pullBadge, { backgroundColor: disabled ? color + '80' : color }]}>
          <Text style={styles.pullLabel}>{disabled ? '⏳' : 'PULL'}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function LeaderboardRow({
  flag,
  name,
  color,
  pulls,
  totalPulls,
  rank,
}: {
  flag: string;
  name: string;
  color: string;
  pulls: number;
  totalPulls: number;
  rank: number;
}) {
  const pct = totalPulls > 0 ? pulls / totalPulls : 0.5;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: pct,
      useNativeDriver: false,
      tension: 40,
      friction: 10,
    }).start();
  }, [pct]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.lbRow}>
      <View style={styles.lbMeta}>
        <Text style={styles.lbRank}>#{rank}</Text>
        <Text style={styles.lbFlag}>{flag}</Text>
        <Text style={[styles.lbName, { color }]}>{name}</Text>
        <Text style={styles.lbPulls}>{formatPulls(pulls)} pulls</Text>
      </View>
      <View style={styles.lbBarTrack}>
        <Animated.View style={[styles.lbBarFill, { width: barWidth, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function RivalryTugOfWar() {
  const [score, setScore] = useState(50);
  const [lastPull, setLastPull] = useState<'A' | 'B' | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [teamPulls, setTeamPulls] = useState<{ A: number; B: number }>({ A: 0, B: 0 });
  const barAnim = useRef(new Animated.Value(50)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = (data: { score: number }) => {
      setScore(data.score);
      Animated.spring(barAnim, {
        toValue: data.score,
        useNativeDriver: false,
        tension: 28,
        friction: 12,
        restDisplacementThreshold: 0.1,
        restSpeedThreshold: 0.1,
      }).start();
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 120, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start();
    };

    const handleLeaderboard = (data: { teamPulls: { A: number; B: number } }) => {
      setTeamPulls(data.teamPulls);
    };

    socket.on('tug_update', handleUpdate);
    socket.on('tug_leaderboard', handleLeaderboard);

    return () => {
      socket.off('tug_update', handleUpdate);
      socket.off('tug_leaderboard', handleLeaderboard);
    };
  }, []);

  const handlePull = (team: 'A' | 'B') => {
    if (cooldown) return;
    setLastPull(team);
    setCooldown(true);
    emitEvent('tug_pull', { team });
    setTimeout(() => setCooldown(false), 500);
  };

  const teamAWidth = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const teamBWidth = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['100%', '0%'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  const aLeading = score > 55;
  const bLeading = score < 45;
  const tied = !aLeading && !bLeading;

  const statusText = tied
    ? '⚖️  Too close to call'
    : aLeading
    ? `🇦🇷 Argentina dominating! (${score}%)`
    : `🇧🇷 Brazil dominating! (${100 - score}%)`;
  const statusColor = tied ? '#94a3b8' : aLeading ? TEAM_A.color : TEAM_B.color;

  const totalPulls = teamPulls.A + teamPulls.B;

  const entries = [
    { team: 'A' as const, ...TEAM_A, pulls: teamPulls.A },
    { team: 'B' as const, ...TEAM_B, pulls: teamPulls.B },
  ].sort((a, b) => b.pulls - a.pulls);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>⚔️  Rivalry Tug-of-War</Text>
          <Text style={styles.subtitle}>Pull for your nation. Powered by live fans.</Text>
        </View>
        <View style={[styles.livePill]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>

      {/* Progress bar */}
      <View style={styles.barContainer}>
        <Animated.View style={[
          styles.glowOverlay,
          {
            opacity: glowOpacity,
            backgroundColor: lastPull === 'A' ? TEAM_A.color : TEAM_B.color,
          }
        ]} />
        <Animated.View style={[styles.barA, { width: teamAWidth, backgroundColor: TEAM_A.color }]} />
        <Animated.View style={[styles.barB, { width: teamBWidth, backgroundColor: TEAM_B.color }]} />
        <View style={styles.barDivider} />
        <View style={[styles.scoreChip]}>
          <Text style={styles.scoreText}>{score} – {100 - score}</Text>
        </View>
      </View>

      <View style={styles.barLabels}>
        <Text style={[styles.barLabel, { color: TEAM_A.color }]}>🇦🇷  {score}%</Text>
        <Text style={[styles.barLabel, { color: TEAM_B.color }]}>🇧🇷  {100 - score}%</Text>
      </View>

      {/* Pull buttons */}
      <View style={styles.btnRow}>
        <PullButton
          color={TEAM_A.color}
          flag={TEAM_A.flag}
          name={TEAM_A.name}
          onPress={() => handlePull('A')}
          disabled={cooldown}
        />
        <View style={styles.vsWrap}>
          <Text style={styles.vs}>VS</Text>
        </View>
        <PullButton
          color={TEAM_B.color}
          flag={TEAM_B.flag}
          name={TEAM_B.name}
          onPress={() => handlePull('B')}
          disabled={cooldown}
        />
      </View>

      <Text style={styles.hint}>One pull per 500ms · fair play enforced server-side</Text>

      {/* All-time leaderboard */}
      <View style={styles.lbCard}>
        <View style={styles.lbHeader}>
          <Text style={styles.lbTitle}>🏆 All-Time Leaderboard</Text>
          <Text style={styles.lbTotal}>{formatPulls(totalPulls)} total pulls</Text>
        </View>
        {entries.map((entry, i) => (
          <LeaderboardRow
            key={entry.team}
            flag={entry.flag}
            name={entry.name}
            color={entry.color}
            pulls={entry.pulls}
            totalPulls={totalPulls}
            rank={i + 1}
          />
        ))}
        {totalPulls === 0 && (
          <Text style={styles.lbEmpty}>Be the first to pull! Results persist forever.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f1623',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e2d4a',
    padding: 18,
    marginBottom: 16,
    gap: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: { flex: 1, gap: 2 },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748b',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444440',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#ef4444',
    letterSpacing: 0.8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  barContainer: {
    height: 28,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1e2d4a',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    borderRadius: 14,
  },
  barA: {
    height: '100%',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  barB: {
    height: '100%',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  barDivider: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#0f1623',
    zIndex: 2,
    marginLeft: -1,
  },
  scoreChip: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  scoreText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 0,
    alignItems: 'center',
  },
  vsWrap: {
    width: 36,
    alignItems: 'center',
  },
  vs: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#475569',
  },
  pullBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  pullFlag: { fontSize: 28 },
  pullTeamName: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  pullBadge: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  pullLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#000',
    letterSpacing: 1,
  },
  hint: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#334155',
    marginTop: -4,
  },

  /* ── All-time leaderboard ── */
  lbCard: {
    backgroundColor: '#080d18',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2d4a',
    padding: 14,
    gap: 10,
  },
  lbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lbTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#f1f5f9',
  },
  lbTotal: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#475569',
  },
  lbRow: {
    gap: 5,
  },
  lbMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lbRank: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#f5a623',
    width: 20,
  },
  lbFlag: {
    fontSize: 16,
  },
  lbName: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  lbPulls: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#94a3b8',
  },
  lbBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1e2d4a',
    overflow: 'hidden',
  },
  lbBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  lbEmpty: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#475569',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
