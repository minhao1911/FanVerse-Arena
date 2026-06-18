import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import {
  WC_MATCHES, WC_GROUPS, getLiveMatches, getUpcomingMatches, getFinishedMatches,
  type WCMatch, type WCGroup,
} from '@/data/worldcup2026';

const TABS = ['Live', 'Schedule', 'Results', 'Groups', 'My Bets'] as const;
type Tab = typeof TABS[number];

function StatusDot() {
  return <View style={styles.livePulse} />;
}

function OddsBar({ match }: { match: WCMatch }) {
  const colors = useColors();
  const total = 1 / match.odds.home + 1 / match.odds.draw + 1 / match.odds.away;
  const homePct = Math.round((1 / match.odds.home / total) * 100);
  const drawPct = Math.round((1 / match.odds.draw / total) * 100);
  const awayPct = 100 - homePct - drawPct;
  return (
    <View style={styles.oddsBarWrap}>
      <View style={[styles.oddsBarFill, { width: `${homePct}%` as any, backgroundColor: colors.accent }]} />
      <View style={[styles.oddsBarFill, { width: `${drawPct}%` as any, backgroundColor: colors.warning }]} />
      <View style={[styles.oddsBarFill, { flex: 1, backgroundColor: '#3b82f6' }]} />
    </View>
  );
}

function MatchCard({ match, showBetButton = true }: { match: WCMatch; showBetButton?: boolean }) {
  const colors = useColors();
  const { bets } = useApp();
  const hasBet = bets.find(b => b.matchId === match.id && b.status === 'pending');

  const statusColor =
    match.status === 'live' ? colors.danger :
    match.status === 'finished' ? colors.muted : colors.success;

  const kickoffDate = new Date(match.kickoff);
  const timeLabel = match.status === 'live'
    ? `${match.minute}'`
    : match.status === 'finished'
    ? 'FT'
    : kickoffDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const dateLabel = kickoffDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      style={[styles.matchCard, { backgroundColor: colors.card, borderColor: match.status === 'live' ? colors.danger + '60' : colors.border }]}
      onPress={() => router.push(`/wc-match/${match.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={styles.matchCardTop}>
        <View style={styles.matchMeta}>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
            {match.status === 'live' && <StatusDot />}
            <Text style={[styles.statusPillText, { color: statusColor }]}>
              {match.status === 'live' ? `LIVE ${timeLabel}` : match.status === 'finished' ? 'FT' : `${dateLabel} · ${timeLabel}`}
            </Text>
          </View>
          <Text style={[styles.groupLabel, { color: colors.muted }]}>{match.groupName} · MD{match.matchday}</Text>
        </View>
        {hasBet && (
          <View style={[styles.betBadge, { backgroundColor: colors.primary + '25' }]}>
            <Ionicons name="wallet" size={10} color={colors.primary} />
            <Text style={[styles.betBadgeText, { color: colors.primary }]}>Bet placed</Text>
          </View>
        )}
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.teamCol}>
          <Text style={styles.teamFlagLg}>{match.homeTeam.flag}</Text>
          <Text style={[styles.teamNameMd, { color: colors.foreground }]} numberOfLines={1}>{match.homeTeam.name}</Text>
        </View>

        <View style={styles.scoreCol}>
          {match.status !== 'upcoming' ? (
            <Text style={[styles.scoreText, { color: match.status === 'live' ? colors.danger : colors.foreground }]}>
              {match.homeScore} — {match.awayScore}
            </Text>
          ) : (
            <Text style={[styles.vsText, { color: colors.muted }]}>VS</Text>
          )}
          <Text style={[styles.venueText, { color: colors.muted }]} numberOfLines={1}>{match.city}</Text>
        </View>

        <View style={[styles.teamCol, styles.teamColRight]}>
          <Text style={styles.teamFlagLg}>{match.awayTeam.flag}</Text>
          <Text style={[styles.teamNameMd, { color: colors.foreground }]} numberOfLines={1}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {match.status !== 'finished' && (
        <>
          <OddsBar match={match} />
          <View style={styles.oddsRow}>
            <View style={styles.oddItem}>
              <Text style={[styles.oddLabel, { color: colors.muted }]}>1</Text>
              <Text style={[styles.oddVal, { color: colors.accent }]}>{match.odds.home.toFixed(2)}</Text>
            </View>
            <View style={styles.oddItem}>
              <Text style={[styles.oddLabel, { color: colors.muted }]}>X</Text>
              <Text style={[styles.oddVal, { color: colors.warning }]}>{match.odds.draw.toFixed(2)}</Text>
            </View>
            <View style={styles.oddItem}>
              <Text style={[styles.oddLabel, { color: colors.muted }]}>2</Text>
              <Text style={[styles.oddVal, { color: '#3b82f6' }]}>{match.odds.away.toFixed(2)}</Text>
            </View>
          </View>
          {showBetButton && !hasBet && (
            <TouchableOpacity
              style={[styles.betBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/wc-match/${match.id}` as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet-outline" size={14} color="#000" />
              <Text style={styles.betBtnText}>Place Bet</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={styles.matchFooter}>
        <View style={styles.footerStat}>
          <Ionicons name="chatbubble-outline" size={11} color={colors.muted} />
          <Text style={[styles.footerStatText, { color: colors.muted }]}>{match.debateCount} debates</Text>
        </View>
        <View style={styles.footerStat}>
          <Ionicons name="wallet-outline" size={11} color={colors.muted} />
          <Text style={[styles.footerStatText, { color: colors.muted }]}>{match.betsCount.toLocaleString()} bets</Text>
        </View>
        <Ionicons name="chevron-forward" size={13} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

function GroupCard({ group }: { group: WCGroup }) {
  const colors = useColors();
  return (
    <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.groupCardTitle, { color: colors.foreground }]}>{group.name}</Text>
      <View style={styles.groupTable}>
        <View style={[styles.groupTableHeader, { borderBottomColor: colors.border }]}>
          {['Team', 'P', 'W', 'D', 'L', 'GD', 'Pts'].map(h => (
            <Text key={h} style={[styles.groupTableHead, { color: colors.muted, flex: h === 'Team' ? 3 : 1 }]}>{h}</Text>
          ))}
        </View>
        {group.standings.map((s, i) => (
          <View
            key={s.team.id}
            style={[
              styles.groupTableRow,
              i < 2 && { borderLeftWidth: 3, borderLeftColor: i === 0 ? colors.primary : colors.accent },
            ]}
          >
            <View style={[styles.groupTeamCell, { flex: 3 }]}>
              <Text style={[styles.rankNum, { color: i < 2 ? colors.primary : colors.muted }]}>{i + 1}</Text>
              <Text style={styles.groupFlag}>{s.team.flag}</Text>
              <Text style={[styles.groupTeamName, { color: colors.foreground }]} numberOfLines={1}>{s.team.name}</Text>
            </View>
            {[s.played, s.won, s.drawn, s.lost, s.gd, s.points].map((v, vi) => (
              <Text
                key={vi}
                style={[styles.groupTableCell, {
                  flex: 1,
                  color: vi === 5 ? colors.primary : colors.foreground,
                  fontFamily: vi === 5 ? 'Poppins_700Bold' : 'Poppins_400Regular',
                  fontWeight: vi === 5 ? '700' : '400',
                }]}
              >
                {v > 0 ? `+${v}` : v}
              </Text>
            ))}
          </View>
        ))}
      </View>
      <Text style={[styles.qualNote, { color: colors.muted }]}>
        <Text style={{ color: colors.primary }}>■</Text> Advancing · <Text style={{ color: colors.accent }}>■</Text> In contention
      </Text>
    </View>
  );
}

function MyBetsView() {
  const colors = useColors();
  const { bets, coins } = useApp();

  if (bets.length === 0) {
    return (
      <View style={styles.emptyCenter}>
        <Text style={{ fontSize: 48 }}>💰</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No bets placed yet</Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>Go to a match and place your first bet!</Text>
      </View>
    );
  }

  const pending = bets.filter(b => b.status === 'pending');
  const settled = bets.filter(b => b.status !== 'pending');
  const totalStaked = bets.reduce((sum, b) => sum + b.amount, 0);
  const totalWon = settled.filter(b => b.status === 'won').reduce((sum, b) => sum + b.potentialWin, 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <View style={[styles.betSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.betSummaryItem}>
          <Text style={[styles.betSummaryVal, { color: colors.primary }]}>🪙 {coins.toLocaleString()}</Text>
          <Text style={[styles.betSummaryLabel, { color: colors.muted }]}>Balance</Text>
        </View>
        <View style={[styles.betSumDivider, { backgroundColor: colors.border }]} />
        <View style={styles.betSummaryItem}>
          <Text style={[styles.betSummaryVal, { color: colors.warning }]}>{pending.length}</Text>
          <Text style={[styles.betSummaryLabel, { color: colors.muted }]}>Pending</Text>
        </View>
        <View style={[styles.betSumDivider, { backgroundColor: colors.border }]} />
        <View style={styles.betSummaryItem}>
          <Text style={[styles.betSummaryVal, { color: colors.success }]}>🪙 {totalWon.toLocaleString()}</Text>
          <Text style={[styles.betSummaryLabel, { color: colors.muted }]}>Won</Text>
        </View>
      </View>

      {bets.map(bet => {
        const statusColor = bet.status === 'won' ? colors.success : bet.status === 'lost' ? colors.danger : colors.warning;
        const typeLabel = bet.betType === 'home' ? 'Home Win' : bet.betType === 'draw' ? 'Draw' : 'Away Win';
        return (
          <View key={bet.id} style={[styles.betCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
            <View style={styles.betCardHeader}>
              <Text style={[styles.betCardMatch, { color: colors.foreground }]} numberOfLines={1}>{bet.matchLabel}</Text>
              <View style={[styles.betStatusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.betStatusText, { color: statusColor }]}>
                  {bet.status === 'pending' ? '⏳ Pending' : bet.status === 'won' ? '✅ Won' : '❌ Lost'}
                </Text>
              </View>
            </View>
            <View style={styles.betCardRow}>
              <Text style={[styles.betCardType, { color: colors.foreground }]}>{typeLabel}</Text>
              <Text style={[styles.betCardOdds, { color: colors.primary }]}>@ {bet.odds.toFixed(2)}</Text>
            </View>
            <View style={styles.betCardRow}>
              <Text style={[styles.betCardStake, { color: colors.muted }]}>🪙 {bet.amount} staked</Text>
              <Text style={[styles.betCardWin, { color: colors.success }]}>→ 🪙 {bet.potentialWin} potential</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function WorldCupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coins, bets } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Live');

  const liveMatches = getLiveMatches();
  const upcomingMatches = getUpcomingMatches();
  const finishedMatches = getFinishedMatches();
  const pendingBets = bets.filter(b => b.status === 'pending').length;

  const renderContent = () => {
    if (activeTab === 'Groups') {
      return (
        <FlatList
          data={WC_GROUPS}
          keyExtractor={g => g.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
          renderItem={({ item }) => <GroupCard group={item} />}
        />
      );
    }
    if (activeTab === 'My Bets') {
      return <MyBetsView />;
    }

    const data =
      activeTab === 'Live' ? liveMatches :
      activeTab === 'Schedule' ? upcomingMatches :
      finishedMatches;

    return (
      <FlatList
        data={data}
        keyExtractor={m => m.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
        renderItem={({ item }) => <MatchCard match={item} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyCenter}>
            <Text style={{ fontSize: 40 }}>⚽</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {activeTab === 'Live' ? 'No live matches right now' : activeTab === 'Schedule' ? 'No upcoming matches' : 'No finished matches'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Check back soon!</Text>
          </View>
        )}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#0a1628', '#0a0e1a']}
        style={[styles.header, { paddingTop: Platform.OS === 'web' ? 60 : insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.trophy}>🏆</Text>
              <View>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>World Cup 2026</Text>
                <Text style={[styles.headerSub, { color: colors.muted }]}>USA · Canada · Mexico · Jun–Jul 2026</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={[styles.coinBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={[styles.coinAmount, { color: colors.primary }]}>{coins.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {liveMatches.length > 0 && (
          <View style={[styles.liveBanner, { backgroundColor: colors.danger + '18', borderColor: colors.danger + '40' }]}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveBannerText, { color: colors.danger }]}>
              {liveMatches.length} match{liveMatches.length > 1 ? 'es' : ''} LIVE now — tap to bet & debate
            </Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabs}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                {tab === 'Live' && liveMatches.length > 0 && (
                  <View style={[styles.tabDot, { backgroundColor: activeTab === 'Live' ? '#000' : colors.danger }]} />
                )}
                {tab === 'My Bets' && pendingBets > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: activeTab === 'My Bets' ? '#000' : colors.primary }]}>
                    <Text style={[styles.tabBadgeText, { color: activeTab === 'My Bets' ? colors.primary : '#fff' }]}>{pendingBets}</Text>
                  </View>
                )}
                <Text style={[styles.tabText, { color: activeTab === tab ? '#000' : colors.mutedForeground }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 12, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trophy: { fontSize: 32 },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  headerSub: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  coinIcon: { fontSize: 16 },
  coinAmount: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  liveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveBannerText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  tabsScroll: { marginHorizontal: -4 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingBottom: 4 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  tabBadge: {
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  tabText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  listContent: { padding: 16, gap: 12 },
  matchCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  matchCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  statusPillText: { fontSize: 10, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, letterSpacing: 0.4 },
  groupLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  betBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  betBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamCol: { flex: 1, alignItems: 'center', gap: 4 },
  teamColRight: { alignItems: 'center' },
  teamFlagLg: { fontSize: 40 },
  teamNameMd: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, textAlign: 'center' },
  scoreCol: { alignItems: 'center', gap: 2, flex: 0.8 },
  scoreText: { fontSize: 24, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  vsText: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  venueText: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  oddsBarWrap: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden' },
  oddsBarFill: { height: '100%' },
  oddsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  oddItem: { alignItems: 'center', gap: 2 },
  oddLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  oddVal: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  betBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12,
  },
  betBtnText: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  matchFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  footerStatText: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  groupCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  groupCardTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  groupTable: { gap: 0 },
  groupTableHeader: {
    flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, marginBottom: 6,
  },
  groupTableHead: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, textAlign: 'center' },
  groupTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: 4 },
  groupTeamCell: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankNum: { fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, width: 16 },
  groupFlag: { fontSize: 18 },
  groupTeamName: { fontSize: 12, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const },
  groupTableCell: { textAlign: 'center', fontSize: 12 },
  qualNote: { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, textAlign: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  betSummary: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16,
    marginBottom: 16, alignItems: 'center',
  },
  betSummaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  betSummaryVal: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  betSummaryLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  betSumDivider: { width: 1, height: 36, marginHorizontal: 8 },
  betCard: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10, gap: 6,
  },
  betCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  betCardMatch: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, flex: 1 },
  betStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  betStatusText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  betCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  betCardType: { fontSize: 13, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const },
  betCardOdds: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  betCardStake: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  betCardWin: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
});
