import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const CATEGORIES = [
  { key: 'fans', label: 'Top Fans', icon: 'star' },
  { key: 'countries', label: 'Countries', icon: 'earth' },
  { key: 'predictors', label: 'Predictors', icon: 'analytics' },
  { key: 'debaters', label: 'Debaters', icon: 'flame' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

interface UnifiedEntry {
  rank: number;
  name: string;
  sub: string;
  flag: string;
  score: number;
  scoreLabel: string;
  detail: string;
  level?: number;
}

const TOP_COUNTRIES: UnifiedEntry[] = [
  { rank: 1, name: 'Brazil', sub: 'South America', flag: '🇧🇷', score: 4820000, scoreLabel: 'XP', detail: '194k fans', level: 28 },
  { rank: 2, name: 'Argentina', sub: 'South America', flag: '🇦🇷', score: 4350000, scoreLabel: 'XP', detail: '178k fans', level: 26 },
  { rank: 3, name: 'Spain', sub: 'Europe', flag: '🇪🇸', score: 3980000, scoreLabel: 'XP', detail: '161k fans', level: 25 },
  { rank: 4, name: 'Germany', sub: 'Europe', flag: '🇩🇪', score: 3650000, scoreLabel: 'XP', detail: '148k fans', level: 24 },
  { rank: 5, name: 'France', sub: 'Europe', flag: '🇫🇷', score: 3420000, scoreLabel: 'XP', detail: '139k fans', level: 23 },
  { rank: 6, name: 'England', sub: 'Europe', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: 3100000, scoreLabel: 'XP', detail: '126k fans', level: 22 },
  { rank: 7, name: 'Portugal', sub: 'Europe', flag: '🇵🇹', score: 2870000, scoreLabel: 'XP', detail: '116k fans', level: 21 },
  { rank: 8, name: 'Italy', sub: 'Europe', flag: '🇮🇹', score: 2640000, scoreLabel: 'XP', detail: '107k fans', level: 20 },
  { rank: 9, name: 'Netherlands', sub: 'Europe', flag: '🇳🇱', score: 2310000, scoreLabel: 'XP', detail: '94k fans', level: 19 },
  { rank: 10, name: 'Japan', sub: 'Asia', flag: '🇯🇵', score: 2080000, scoreLabel: 'XP', detail: '84k fans', level: 18 },
];

const TOP_PREDICTORS: UnifiedEntry[] = [
  { rank: 1, name: 'OracleFC', sub: 'Brazil', flag: '🇧🇷', score: 94, scoreLabel: '%', detail: '188/200 correct', level: 22 },
  { rank: 2, name: 'StatGuru99', sub: 'Germany', flag: '🇩🇪', score: 91, scoreLabel: '%', detail: '182/200 correct', level: 20 },
  { rank: 3, name: 'ScoreProphet', sub: 'Spain', flag: '🇪🇸', score: 89, scoreLabel: '%', detail: '178/200 correct', level: 19 },
  { rank: 4, name: 'TacticalEye', sub: 'France', flag: '🇫🇷', score: 87, scoreLabel: '%', detail: '174/200 correct', level: 18 },
  { rank: 5, name: 'DataDribbler', sub: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: 85, scoreLabel: '%', detail: '170/200 correct', level: 17 },
  { rank: 6, name: 'PredictorX', sub: 'Argentina', flag: '🇦🇷', score: 83, scoreLabel: '%', detail: '166/200 correct', level: 16 },
  { rank: 7, name: 'FootballWiz', sub: 'Portugal', flag: '🇵🇹', score: 81, scoreLabel: '%', detail: '162/200 correct', level: 15 },
  { rank: 8, name: 'AlgoKing', sub: 'Netherlands', flag: '🇳🇱', score: 79, scoreLabel: '%', detail: '158/200 correct', level: 14 },
  { rank: 9, name: 'ScoutMaster', sub: 'Italy', flag: '🇮🇹', score: 77, scoreLabel: '%', detail: '154/200 correct', level: 13 },
  { rank: 10, name: 'MatchMind', sub: 'Japan', flag: '🇯🇵', score: 75, scoreLabel: '%', detail: '150/200 correct', level: 12 },
];

const TOP_DEBATERS: UnifiedEntry[] = [
  { rank: 1, name: 'BrazilKing', sub: 'Brazil', flag: '🇧🇷', score: 24800, scoreLabel: 'votes', detail: '142 debates', level: 25 },
  { rank: 2, name: 'TikiTaka', sub: 'Spain', flag: '🇪🇸', score: 21400, scoreLabel: 'votes', detail: '128 debates', level: 23 },
  { rank: 3, name: 'DieManschaft', sub: 'Germany', flag: '🇩🇪', score: 19600, scoreLabel: 'votes', detail: '119 debates', level: 21 },
  { rank: 4, name: 'LesBleus', sub: 'France', flag: '🇫🇷', score: 17200, scoreLabel: 'votes', detail: '104 debates', level: 19 },
  { rank: 5, name: 'ThreeLions', sub: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: 15800, scoreLabel: 'votes', detail: '96 debates', level: 18 },
  { rank: 6, name: 'AzurriForever', sub: 'Italy', flag: '🇮🇹', score: 14300, scoreLabel: 'votes', detail: '87 debates', level: 17 },
  { rank: 7, name: 'SambaStar', sub: 'Brazil', flag: '🇧🇷', score: 12900, scoreLabel: 'votes', detail: '78 debates', level: 16 },
  { rank: 8, name: 'OrangeLion', sub: 'Netherlands', flag: '🇳🇱', score: 11400, scoreLabel: 'votes', detail: '69 debates', level: 15 },
  { rank: 9, name: 'CristianoFan7', sub: 'Portugal', flag: '🇵🇹', score: 9800, scoreLabel: 'votes', detail: '60 debates', level: 14 },
  { rank: 10, name: 'SamuraiBlue', sub: 'Japan', flag: '🇯🇵', score: 8200, scoreLabel: 'votes', detail: '50 debates', level: 13 },
];

function formatScore(score: number, label: string) {
  if (label === '%') return `${score}%`;
  if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return score.toLocaleString();
}

function MedalIcon({ rank, size = 18 }: { rank: number; size?: number }) {
  const colors = useColors();
  if (rank === 1) return <Ionicons name="trophy" size={size} color={colors.gold} />;
  if (rank === 2) return <Ionicons name="medal" size={size} color={colors.silver} />;
  if (rank === 3) return <Ionicons name="medal" size={size} color={colors.bronze} />;
  return null;
}

function PodiumCard({
  entry,
  position,
  anim,
}: {
  entry: UnifiedEntry;
  position: 'first' | 'second' | 'third';
  anim: Animated.Value;
}) {
  const colors = useColors();
  const isFirst = position === 'first';
  const isSecond = position === 'second';

  const podiumColor =
    position === 'first' ? colors.gold :
    position === 'second' ? colors.silver :
    colors.bronze;

  const podiumHeight = isFirst ? 72 : isSecond ? 52 : 40;
  const avatarSize = isFirst ? 64 : 52;
  const crownSize = isFirst ? 22 : 18;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  return (
    <Animated.View
      style={[
        styles.podiumSlot,
        isFirst && styles.podiumSlotFirst,
        { opacity: anim, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.avatarRing, { borderColor: podiumColor, width: avatarSize + 8, height: avatarSize + 8, borderRadius: (avatarSize + 8) / 2 }]}>
        <View style={[styles.avatarInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.cardAlt }]}>
          <Text style={{ fontSize: isFirst ? 28 : 22 }}>{entry.flag}</Text>
        </View>
      </View>
      <View style={styles.podiumInfo}>
        <MedalIcon rank={entry.rank} size={crownSize} />
        <Text style={[styles.podiumName, { color: colors.foreground, fontSize: isFirst ? 14 : 12 }]} numberOfLines={1}>{entry.name}</Text>
        <Text style={[styles.podiumSub, { color: colors.muted, fontSize: 10 }]} numberOfLines={1}>{entry.sub}</Text>
        <Text style={[styles.podiumScore, { color: podiumColor, fontSize: isFirst ? 15 : 13 }]}>
          {formatScore(entry.score, entry.scoreLabel)}
        </Text>
      </View>
      <LinearGradient
        colors={[podiumColor + '60', podiumColor + '20']}
        style={[styles.podiumBase, { height: podiumHeight, borderColor: podiumColor + '40' }]}
      >
        <Text style={[styles.podiumRank, { color: podiumColor }]}>#{entry.rank}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function RankRow({ entry, index }: { entry: UnifiedEntry; index: number }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX }] }}>
      <View style={[styles.rankRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rankNumWrap}>
          <Text style={[styles.rankNum, { color: colors.muted }]}>{entry.rank}</Text>
        </View>
        <View style={[styles.rankFlagWrap, { backgroundColor: colors.cardAlt }]}>
          <Text style={styles.rankFlag}>{entry.flag}</Text>
        </View>
        <View style={styles.rankMeta}>
          <Text style={[styles.rankName, { color: colors.foreground }]} numberOfLines={1}>{entry.name}</Text>
          <Text style={[styles.rankDetail, { color: colors.muted }]}>{entry.detail}</Text>
        </View>
        <View style={styles.rankScoreWrap}>
          <Text style={[styles.rankScore, { color: colors.primary }]}>
            {formatScore(entry.score, entry.scoreLabel)}
          </Text>
          {entry.level !== undefined && (
            <View style={[styles.levelBadge, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.levelText, { color: colors.accent }]}>Lv {entry.level}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { leaderboard } = useApp();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('fans');

  const p1Anim = useRef(new Animated.Value(0)).current;
  const p2Anim = useRef(new Animated.Value(0)).current;
  const p3Anim = useRef(new Animated.Value(0)).current;

  const topFansData: UnifiedEntry[] = leaderboard.map(e => ({
    rank: e.rank,
    name: e.username,
    sub: e.teamName,
    flag: e.teamFlag,
    score: e.score,
    scoreLabel: 'XP',
    detail: `Level ${e.level}`,
    level: e.level,
  }));

  const dataMap: Record<CategoryKey, UnifiedEntry[]> = {
    fans: topFansData,
    countries: TOP_COUNTRIES,
    predictors: TOP_PREDICTORS,
    debaters: TOP_DEBATERS,
  };

  const data = dataMap[activeCategory];
  const [first, second, third] = [data[0], data[1], data[2]];
  const rest = data.slice(3);

  useEffect(() => {
    p1Anim.setValue(0);
    p2Anim.setValue(0);
    p3Anim.setValue(0);
    Animated.stagger(80, [
      Animated.timing(p2Anim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(p1Anim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(p3Anim, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [activeCategory]);

  const catMeta = {
    fans: { label: 'Global Fan Rankings', sub: 'Top fans by total XP earned' },
    countries: { label: 'Country Power Rankings', sub: 'Nations ranked by fan activity' },
    predictors: { label: 'Prediction Masters', sub: 'Best match predictors by accuracy' },
    debaters: { label: 'Debate Champions', sub: 'Top debaters by community votes' },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#111827', colors.background]}
        style={[styles.header, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12 }]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>🏆 Leaderboard</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>{catMeta[activeCategory].sub}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catTabs}
        >
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.catTab,
                  {
                    backgroundColor: active ? colors.primary : colors.cardAlt,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={active ? '#000' : colors.muted}
                />
                <Text style={[styles.catTabText, { color: active ? '#000' : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 34 : 20 }]}
      >
        <View style={[styles.podiumSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>{catMeta[activeCategory].label}</Text>
          <View style={styles.podiumRow}>
            {second && <PodiumCard entry={second} position="second" anim={p2Anim} />}
            {first && <PodiumCard entry={first} position="first" anim={p1Anim} />}
            {third && <PodiumCard entry={third} position="third" anim={p3Anim} />}
          </View>
        </View>

        <View style={styles.restList}>
          {rest.map((entry, idx) => (
            <RankRow key={`${activeCategory}-${entry.rank}`} entry={entry} index={idx} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 14,
  },
  catTabs: {
    gap: 8,
    paddingBottom: 4,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  podiumSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    maxWidth: 120,
  },
  podiumSlotFirst: {
    marginBottom: 0,
  },
  avatarRing: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumInfo: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  podiumName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  podiumSub: {
    textAlign: 'center',
  },
  podiumScore: {
    fontWeight: '700',
  },
  podiumBase: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginTop: 4,
  },
  podiumRank: {
    fontSize: 13,
    fontWeight: '800',
  },
  restList: {
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankNumWrap: {
    width: 24,
    alignItems: 'center',
  },
  rankNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  rankFlagWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankFlag: {
    fontSize: 20,
  },
  rankMeta: {
    flex: 1,
    gap: 2,
  },
  rankName: {
    fontSize: 14,
    fontWeight: '600',
  },
  rankDetail: {
    fontSize: 12,
  },
  rankScoreWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rankScore: {
    fontSize: 14,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
