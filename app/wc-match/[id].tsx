import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getMatchById } from '@/data/worldcup2026';
import type { BetType, MatchComment } from '@/context/AppContext';

const BET_PRESETS = [50, 100, 200, 500];

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CommentItem({ comment, matchId }: { comment: MatchComment; matchId: string }) {
  const colors = useColors();
  const { likeComment } = useApp();
  return (
    <View style={[styles.commentItem, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <View style={[styles.commentAvatar, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 18 }}>{comment.authorTeamFlag}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.commentMetaRow}>
            <Text style={[styles.commentAuthor, { color: colors.foreground }]}>{comment.authorName}</Text>
            <View style={[styles.lvBadge, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.lvText, { color: colors.accent }]}>Lv {comment.authorLevel}</Text>
            </View>
          </View>
          <Text style={[styles.commentTime, { color: colors.muted }]}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); likeComment(matchId, comment.id); }}
          activeOpacity={0.7}
        >
          <Ionicons name={comment.userLiked ? 'heart' : 'heart-outline'} size={14} color={comment.userLiked ? '#ef4444' : colors.muted} />
          <Text style={[styles.likeCount, { color: comment.userLiked ? '#ef4444' : colors.muted }]}>{comment.likes}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.commentText, { color: colors.foreground }]}>{comment.text}</Text>
    </View>
  );
}

export default function WCMatchDetail() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coins, bets, placeBet, comments, addComment, debates } = useApp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'bet' | 'debate' | 'thread'>('bet');
  const [selectedBetType, setSelectedBetType] = useState<BetType | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [commentText, setCommentText] = useState('');

  const match = getMatchById(id ?? '');
  if (!match) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[styles.errorText, { color: colors.muted }]}>Match not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#000', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const existingBet = bets.find(b => b.matchId === match.id && b.status === 'pending');
  const matchComments = comments[match.id] ?? [];
  const matchDebates = debates.filter(d => d.matchId === match.id);

  const statusColor = match.status === 'live' ? '#ef4444' : match.status === 'finished' ? colors.muted : '#22c55e';
  const statusLabel = match.status === 'live'
    ? `🔴 LIVE ${match.minute}'`
    : match.status === 'finished'
    ? 'FULL TIME'
    : new Date(match.kickoff).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handlePlaceBet = () => {
    if (!selectedBetType) {
      Alert.alert('Select outcome', 'Choose Home Win, Draw or Away Win first.');
      return;
    }
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid number of FanCoins to stake.');
      return;
    }
    if (amount > coins) {
      Alert.alert('Insufficient FanCoins', `You only have 🪙 ${coins} FanCoins.`);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = placeBet(match, selectedBetType, amount);
    if (success) {
      const odds = selectedBetType === 'home' ? match.odds.home : selectedBetType === 'draw' ? match.odds.draw : match.odds.away;
      const potentialWin = Math.round(amount * odds);
      Alert.alert('Bet Placed! 🎉', `You staked 🪙 ${amount} on ${selectedBetType === 'home' ? match.homeTeam.name + ' Win' : selectedBetType === 'draw' ? 'Draw' : match.awayTeam.name + ' Win'} @ ${odds.toFixed(2)}\n\nPotential return: 🪙 ${potentialWin}`);
      setBetAmount('');
      setSelectedBetType(null);
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim() || !user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addComment(match.id, user.username, user.teamName ?? 'Neutral', user.teamFlag ?? '🌍', user.fanLevel, commentText.trim());
    setCommentText('');
  };

  const selectedOdds = selectedBetType === 'home' ? match.odds.home : selectedBetType === 'draw' ? match.odds.draw : selectedBetType === 'away' ? match.odds.away : null;
  const parsedAmount = parseInt(betAmount);
  const potentialReturn = selectedOdds && !isNaN(parsedAmount) ? Math.round(parsedAmount * selectedOdds) : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0a1628', colors.background]}
        style={[styles.hero, { paddingTop: Platform.OS === 'web' ? 56 : insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          <Text style={[styles.backLabel, { color: colors.foreground }]}>World Cup</Text>
        </TouchableOpacity>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { borderColor: statusColor + '60', backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={[styles.competitionLabel, { color: colors.muted }]}>{match.groupName} · Matchday {match.matchday}</Text>
        </View>

        <View style={styles.matchHero}>
          <View style={styles.heroTeam}>
            <Text style={styles.heroFlag}>{match.homeTeam.flag}</Text>
            <Text style={[styles.heroTeamName, { color: colors.foreground }]}>{match.homeTeam.name}</Text>
          </View>
          <View style={styles.heroCenter}>
            {match.status !== 'upcoming' ? (
              <Text style={[styles.heroScore, { color: match.status === 'live' ? '#ef4444' : colors.foreground }]}>
                {match.homeScore} — {match.awayScore}
              </Text>
            ) : (
              <Text style={[styles.heroVs, { color: colors.muted }]}>VS</Text>
            )}
            <Text style={[styles.heroVenue, { color: colors.muted }]} numberOfLines={1}>{match.venue}</Text>
          </View>
          <View style={[styles.heroTeam, { alignItems: 'flex-end' }]}>
            <Text style={styles.heroFlag}>{match.awayTeam.flag}</Text>
            <Text style={[styles.heroTeamName, { color: colors.foreground }]}>{match.awayTeam.name}</Text>
          </View>
        </View>

        <View style={[styles.subTabs, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          {(['bet', 'debate', 'thread'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.subTab, activeTab === t && { backgroundColor: t === 'bet' ? colors.primary : colors.card }]}
              onPress={() => setActiveTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.subTabText, { color: activeTab === t ? (t === 'bet' ? '#000' : colors.foreground) : colors.muted }]}>
                {t === 'bet' ? '💰 Bet' : t === 'debate' ? '🔥 Debates' : '💬 Thread'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* ─── BET TAB ─────────────────────────── */}
      {activeTab === 'bet' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.tabContent, { paddingBottom: 120 }]}>
          <View style={[styles.coinRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 20 }}>🪙</Text>
            <View>
              <Text style={[styles.coinBal, { color: colors.foreground }]}>{coins.toLocaleString()} FanCoins</Text>
              <Text style={[styles.coinSub, { color: colors.muted }]}>Your balance</Text>
            </View>
            {existingBet && (
              <View style={[styles.betPlacedBadge, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.betPlacedText, { color: colors.success }]}>Bet placed</Text>
              </View>
            )}
          </View>

          {existingBet ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Your Bet</Text>
              <View style={[styles.betConfirmBox, { backgroundColor: colors.cardAlt }]}>
                <View style={styles.betConfirmRow}>
                  <Text style={[styles.betConfirmLabel, { color: colors.muted }]}>Outcome</Text>
                  <Text style={[styles.betConfirmVal, { color: colors.foreground }]}>
                    {existingBet.betType === 'home' ? `${match.homeTeam.name} Win` : existingBet.betType === 'draw' ? 'Draw' : `${match.awayTeam.name} Win`}
                  </Text>
                </View>
                <View style={styles.betConfirmRow}>
                  <Text style={[styles.betConfirmLabel, { color: colors.muted }]}>Odds</Text>
                  <Text style={[styles.betConfirmVal, { color: colors.primary }]}>@ {existingBet.odds.toFixed(2)}</Text>
                </View>
                <View style={styles.betConfirmRow}>
                  <Text style={[styles.betConfirmLabel, { color: colors.muted }]}>Staked</Text>
                  <Text style={[styles.betConfirmVal, { color: colors.foreground }]}>🪙 {existingBet.amount.toLocaleString()}</Text>
                </View>
                <View style={[styles.betConfirmRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }]}>
                  <Text style={[styles.betConfirmLabel, { color: colors.muted }]}>Potential return</Text>
                  <Text style={[styles.betConfirmVal, { color: colors.success, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const }]}>🪙 {existingBet.potentialWin.toLocaleString()}</Text>
                </View>
              </View>
              <Text style={[styles.betNote, { color: colors.muted }]}>Settlement is automatic when the match finishes.</Text>
            </View>
          ) : match.status === 'finished' ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', gap: 8 }]}>
              <Text style={{ fontSize: 40 }}>⏱️</Text>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Match Finished</Text>
              <Text style={[styles.betNote, { color: colors.muted, textAlign: 'center' }]}>Betting was available before kick-off. Check upcoming matches to place bets.</Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Pick Outcome</Text>
              <Text style={[styles.cardSub, { color: colors.muted }]}>Choose who you think wins, then stake your FanCoins</Text>

              <View style={styles.outcomeRow}>
                {([ 'home', 'draw', 'away'] as BetType[]).map(type => {
                  const label = type === 'home' ? match.homeTeam.name : type === 'draw' ? 'Draw' : match.awayTeam.name;
                  const flag = type === 'home' ? match.homeTeam.flag : type === 'draw' ? '🤝' : match.awayTeam.flag;
                  const odds = type === 'home' ? match.odds.home : type === 'draw' ? match.odds.draw : match.odds.away;
                  const oddColor = type === 'home' ? colors.accent : type === 'draw' ? colors.warning : '#3b82f6';
                  const isSelected = selectedBetType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.outcomeBtn, {
                        backgroundColor: isSelected ? oddColor + '25' : colors.cardAlt,
                        borderColor: isSelected ? oddColor : colors.border,
                      }]}
                      onPress={() => { setSelectedBetType(type); if (Platform.OS !== 'web') Haptics.selectionAsync(); }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 24 }}>{flag}</Text>
                      <Text style={[styles.outcomeName, { color: colors.foreground }]} numberOfLines={1}>{label}</Text>
                      <Text style={[styles.outcomeOdds, { color: oddColor }]}>{odds.toFixed(2)}</Text>
                      <Text style={[styles.outcomeOddsLabel, { color: colors.muted }]}>odds</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Stake amount</Text>
              <View style={styles.presetRow}>
                {BET_PRESETS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.presetBtn, { backgroundColor: betAmount === String(p) ? colors.primary : colors.cardAlt, borderColor: betAmount === String(p) ? colors.primary : colors.border }]}
                    onPress={() => setBetAmount(String(p))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetBtnText, { color: betAmount === String(p) ? '#000' : colors.mutedForeground }]}>🪙{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.amountInputWrap, { backgroundColor: colors.cardAlt, borderColor: selectedBetType ? colors.primary : colors.border }]}>
                <Text style={{ fontSize: 18 }}>🪙</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.foreground }]}
                  value={betAmount}
                  onChangeText={setBetAmount}
                  placeholder="Custom amount"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {betAmount !== '' && (
                  <TouchableOpacity onPress={() => setBetAmount('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {potentialReturn !== null && selectedBetType && !isNaN(parsedAmount) && parsedAmount > 0 && (
                <View style={[styles.returnPreview, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
                  <Ionicons name="trending-up" size={16} color={colors.success} />
                  <Text style={[styles.returnText, { color: colors.success }]}>
                    Stake 🪙{parsedAmount.toLocaleString()} → Win 🪙{potentialReturn.toLocaleString()} ({selectedOdds?.toFixed(2)}x)
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.placeBtn, {
                  backgroundColor: colors.primary,
                  opacity: (!selectedBetType || !betAmount || parseInt(betAmount) <= 0) ? 0.45 : 1,
                }]}
                onPress={handlePlaceBet}
                disabled={!selectedBetType || !betAmount || parseInt(betAmount) <= 0}
                activeOpacity={0.8}
              >
                <Ionicons name="wallet" size={18} color="#000" />
                <Text style={styles.placeBtnText}>Place Bet</Text>
              </TouchableOpacity>
              <Text style={[styles.betDisclaimer, { color: colors.muted }]}>
                FanCoins are virtual currency for entertainment only.
              </Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Market Odds</Text>
            <View style={styles.oddsTableRow}>
              <View style={styles.oddsTableItem}>
                <Text style={{ fontSize: 24 }}>{match.homeTeam.flag}</Text>
                <Text style={[styles.oddsTableTeam, { color: colors.foreground }]} numberOfLines={1}>{match.homeTeam.name}</Text>
                <Text style={[styles.oddsTableVal, { color: colors.accent }]}>{match.odds.home.toFixed(2)}</Text>
                <Text style={[styles.oddsTableLabel, { color: colors.muted }]}>Home Win</Text>
              </View>
              <View style={styles.oddsTableItem}>
                <Text style={{ fontSize: 24 }}>🤝</Text>
                <Text style={[styles.oddsTableTeam, { color: colors.foreground }]}>Draw</Text>
                <Text style={[styles.oddsTableVal, { color: colors.warning }]}>{match.odds.draw.toFixed(2)}</Text>
                <Text style={[styles.oddsTableLabel, { color: colors.muted }]}>Draw</Text>
              </View>
              <View style={styles.oddsTableItem}>
                <Text style={{ fontSize: 24 }}>{match.awayTeam.flag}</Text>
                <Text style={[styles.oddsTableTeam, { color: colors.foreground }]} numberOfLines={1}>{match.awayTeam.name}</Text>
                <Text style={[styles.oddsTableVal, { color: '#3b82f6' }]}>{match.odds.away.toFixed(2)}</Text>
                <Text style={[styles.oddsTableLabel, { color: colors.muted }]}>Away Win</Text>
              </View>
            </View>
            <Text style={[styles.betsCount, { color: colors.muted }]}>
              {match.betsCount.toLocaleString()} total bets placed on this match
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ─── DEBATES TAB ─────────────────────── */}
      {activeTab === 'debate' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.tabContent, { paddingBottom: 120 }]}>
          {matchDebates.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Text style={{ fontSize: 40 }}>🔥</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No debates yet</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Start the first debate about this match!</Text>
              <TouchableOpacity
                style={[styles.startDebateBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/create-debate' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.startDebateBtnText}>Start a Debate</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {matchDebates.map(debate => (
                <View key={debate.id} style={[styles.debateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.debateAuthorRow}>
                    <Text style={{ fontSize: 22 }}>{debate.authorTeamFlag}</Text>
                    <View>
                      <Text style={[styles.debateAuthor, { color: colors.foreground }]}>{debate.authorName}</Text>
                      <Text style={[styles.debateTime, { color: colors.muted }]}>{formatRelativeTime(debate.createdAt)}</Text>
                    </View>
                    <View style={[styles.lvBadge, { backgroundColor: colors.accent + '22', marginLeft: 'auto' }]}>
                      <Text style={[styles.lvText, { color: colors.accent }]}>Lv {debate.authorLevel}</Text>
                    </View>
                  </View>
                  <Text style={[styles.debateTitle, { color: colors.foreground }]}>{debate.title}</Text>
                  <Text style={[styles.debateContent, { color: colors.mutedForeground }]} numberOfLines={3}>{debate.content}</Text>
                  <View style={styles.debateActions}>
                    <View style={styles.debateAction}>
                      <Ionicons name="arrow-up" size={14} color={colors.success} />
                      <Text style={[styles.debateActionText, { color: colors.success }]}>{debate.upvotes.toLocaleString()}</Text>
                    </View>
                    <View style={styles.debateAction}>
                      <Ionicons name="arrow-down" size={14} color={colors.danger} />
                      <Text style={[styles.debateActionText, { color: colors.danger }]}>{debate.downvotes.toLocaleString()}</Text>
                    </View>
                    <View style={styles.debateAction}>
                      <Ionicons name="chatbubble-outline" size={13} color={colors.muted} />
                      <Text style={[styles.debateActionText, { color: colors.muted }]}>{debate.commentCount}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.startDebateBtn, { backgroundColor: colors.primary, marginTop: 4 }]}
                onPress={() => router.push('/create-debate' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.startDebateBtnText}>+ Add Your Take</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* ─── MATCH THREAD TAB ────────────────── */}
      {activeTab === 'thread' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.tabContent, { paddingBottom: 120 }]}>
          {matchComments.length === 0 && (
            <View style={styles.emptyCenter}>
              <Ionicons name="chatbubble-outline" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No comments yet</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Be the first to join the match thread!</Text>
            </View>
          )}
          {matchComments.map(c => (
            <CommentItem key={c.id} comment={c} matchId={match.id} />
          ))}
        </ScrollView>
      )}

      {/* ─── COMMENT INPUT (thread only) ─────── */}
      {activeTab === 'thread' && (
        <View style={[styles.commentBar, {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'web' ? 20 : insets.bottom + 8,
        }]}>
          <View style={[styles.commentInputWrap, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={{ fontSize: 18 }}>{user?.teamFlag ?? '🌍'}</Text>
            <TextInput
              style={[styles.commentInput, { color: colors.foreground }]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add to the match thread..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={280}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: commentText.trim() ? 1 : 0.4 }]}
            onPress={handleSendComment}
            disabled={!commentText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingBottom: 0 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14, alignSelf: 'flex-start' },
  backLabel: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, letterSpacing: 0.5 },
  competitionLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  matchHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heroTeam: { flex: 1, alignItems: 'center', gap: 6 },
  heroFlag: { fontSize: 50 },
  heroTeamName: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, textAlign: 'center' },
  heroCenter: { alignItems: 'center', gap: 4, flex: 0.9 },
  heroScore: { fontSize: 28, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  heroVs: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  heroVenue: { fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  subTabs: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    padding: 4, marginHorizontal: 0, marginBottom: 0,
  },
  subTab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 11,
  },
  subTabText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  tabContent: { padding: 16, gap: 12 },
  coinRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  coinBal: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  coinSub: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  betPlacedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  betPlacedText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  cardSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: -6 },
  outcomeRow: { flexDirection: 'row', gap: 10 },
  outcomeBtn: {
    flex: 1, alignItems: 'center', gap: 4,
    padding: 12, borderRadius: 14, borderWidth: 2,
  },
  outcomeName: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, textAlign: 'center' },
  outcomeOdds: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  outcomeOddsLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  sectionLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  presetBtnText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  amountInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 12,
  },
  amountInput: {
    flex: 1, fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const,
  },
  returnPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  returnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, flex: 1 },
  placeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  placeBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  betDisclaimer: { fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  betConfirmBox: { borderRadius: 12, padding: 14, gap: 10 },
  betConfirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  betConfirmLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  betConfirmVal: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  betNote: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  oddsTableRow: { flexDirection: 'row', justifyContent: 'space-around' },
  oddsTableItem: { alignItems: 'center', gap: 4, flex: 1 },
  oddsTableTeam: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, textAlign: 'center' },
  oddsTableVal: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  oddsTableLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  betsCount: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 4 },
  debateCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  debateAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  debateAuthor: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  debateTime: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  debateTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, lineHeight: 20 },
  debateContent: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },
  debateActions: { flexDirection: 'row', gap: 16 },
  debateAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  debateActionText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  startDebateBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  startDebateBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  emptyCenter: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, textAlign: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  commentItem: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8, marginBottom: 8 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentAuthor: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  commentTime: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  likeCount: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  commentText: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },
  lvBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  lvText: { fontSize: 10, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  commentBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1 },
  commentInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  commentInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', maxHeight: 80 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, fontFamily: 'Poppins_400Regular', marginBottom: 20 },
  backBtnCenter: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});
