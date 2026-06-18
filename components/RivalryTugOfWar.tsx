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

export default function RivalryTugOfWar() {
  const [score, setScore] = useState(50);
  const [lastPull, setLastPull] = useState<'A' | 'B' | null>(null);
  const [cooldown, setCooldown] = useState(false);
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
    socket.on('tug_update', handleUpdate);
    return () => { socket.off('tug_update', handleUpdate); };
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
});
