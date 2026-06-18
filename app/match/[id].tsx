import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
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
import type { MatchComment } from '@/context/AppContext';
import LiveChatRoom from '@/components/LiveChatRoom';

interface MatchMeta {
  venue: string;
  competition: string;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeForm: string[];
  awayForm: string[];
  homePercent: number;
  drawPercent: number;
  awayPercent: number;
}

const MATCH_META: Record<string, MatchMeta> = {
  p1: {
    venue: 'Maracanã, Rio de Janeiro',
    competition: 'CONMEBOL Qualifier',
    homeWins: 47, draws: 22, awayWins: 38,
    homeForm: ['W', 'W', 'D', 'W', 'W'],
    awayForm: ['W', 'W', 'W', 'D', 'W'],
    homePercent: 45, drawPercent: 21, awayPercent: 34,
  },
  p2: {
    venue: 'Wembley Stadium, London',
    competition: 'UEFA Nations League',
    homeWins: 19, draws: 9, awayWins: 17,
    homeForm: ['W', 'W', 'D', 'W', 'L'],
    awayForm: ['D', 'W', 'W', 'L', 'W'],
    homePercent: 52, drawPercent: 20, awayPercent: 28,
  },
  p3: {
    venue: 'Allianz Arena, Munich',
    competition: 'UEFA Nations League',
    homeWins: 14, draws: 5, awayWins: 12,
    homeForm: ['W', 'W', 'W', 'L', 'W'],
    awayForm: ['W', 'L', 'W', 'W', 'D'],
    homePercent: 38, drawPercent: 22, awayPercent: 40,
  },
};

const DEFAULT_META: MatchMeta = {
  venue: 'International Stadium',
  competition: 'International Friendly',
  homeWins: 10, draws: 4, awayWins: 8,
  homeForm: ['W', 'D', 'W', 'L', 'W'],
  awayForm: ['W', 'W', 'D', 'W', 'L'],
  homePercent: 45, drawPercent: 25, awayPercent: 30,
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function FormPip({ result }: { result: string }) {
  const colors = useColors();
  const bg = result === 'W' ? colors.success : result === 'L' ? colors.danger : colors.warning;
  return (
    <View style={[styles.formPip, { backgroundColor: bg }]}>
      <Text style={styles.formPipText}>{result}</Text>
    </View>
  );
}

function CommentItem({ comment, matchId }: { comment: MatchComment; matchId: string }) {
  const colors = useColors();
  const { likeComment } = useApp();

  const handleLike = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeComment(matchId, comment.id);
  };

  return (
    <View style={[styles.commentItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <View style={[styles.commentAvatar, { backgroundColor: colors.cardAlt }]}>
          <Text style={styles.commentAvatarFlag}>{comment.authorTeamFlag}</Text>
        </View>
        <View style={styles.commentMeta}>
          <View style={styles.commentMetaRow}>
            <Text style={[styles.commentAuthor, { color: colors.foreground }]}>{comment.authorName}</Text>
            <View style={[styles.lvBadge, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.lvText, { color: colors.accent }]}>Lv {comment.authorLevel}</Text>
            </View>
          </View>
          <Text style={[styles.commentTime, { color: colors.muted }]}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.likeBtn} onPress={handleLike} activeOpacity={0.7}>
          <Ionicons
            name={comment.userLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={comment.userLiked ? colors.danger : colors.muted}
          />
          <Text style={[styles.likeCount, { color: comment.userLiked ? colors.danger : colors.muted }]}>
            {comment.likes}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.commentText, { color: colors.foreground }]}>{comment.text}</Text>
    </View>
  );
}

export default function MatchDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { predictions, submitPrediction, comments, addComment } = useApp();
  const { user } = useAuth();
  const [screenMode, setScreenMode] = useState<'overview' | 'warroom'>('overview');
  const [commentText, setCommentText] = useState('');
  const [homeInput, setHomeInput] = useState('');
  const [awayInput, setAwayInput] = useState('');

  const prediction = predictions.find(p => p.id === id);
  const meta = (id && MATCH_META[id]) ? MATCH_META[id] : DEFAULT_META;
  const matchComments = (id && comments[id]) ? comments[id] : [];

  if (!prediction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text style={[styles.errorText, { color: colors.muted }]}>Match not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#000', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = prediction.status === 'live' ? colors.danger : prediction.status === 'finished' ? colors.muted : colors.success;
  const statusLabel = prediction.status === 'live' ? '🔴 LIVE' : prediction.status === 'finished' ? 'FULL TIME' : 'UPCOMING';

  const h2hTotal = meta.homeWins + meta.draws + meta.awayWins;
  const homeH2HPct = Math.round((meta.homeWins / h2hTotal) * 100);
  const drawH2HPct = Math.round((meta.draws / h2hTotal) * 100);

  const handleSubmitPrediction = () => {
    const h = parseInt(homeInput);
    const a = parseInt(awayInput);
    if (isNaN(h) || isNaN(a)) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitPrediction(prediction.id, h, a);
    setHomeInput('');
    setAwayInput('');
  };

  const handleSendComment = () => {
    if (!commentText.trim() || !user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addComment(
      prediction.id,
      user.username,
      user.teamName ?? 'Neutral',
      user.teamFlag ?? '🌍',
      user.fanLevel,
      commentText.trim(),
    );
    setCommentText('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={['#111827', colors.background]}
        style={[styles.heroGradient, { paddingTop: Platform.OS === 'web' ? 56 : insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          <Text style={[styles.backLabel, { color: colors.foreground }]}>Predictions</Text>
        </TouchableOpacity>

        <View style={[styles.statusRow]}>
          <View style={[styles.statusBadge, { borderColor: statusColor + '60', backgroundColor: statusColor + '15' }]}>
            {prediction.status === 'live' && <View style={[styles.liveDot, { backgroundColor: colors.danger }]} />}
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={[styles.competition, { color: colors.muted }]}>{meta.competition}</Text>
        </View>

        <View style={styles.matchHero}>
          <View style={styles.heroTeam}>
            <Text style={styles.heroFlag}>{prediction.homeFlag}</Text>
            <Text style={[styles.heroTeamName, { color: colors.foreground }]}>{prediction.homeTeam}</Text>
          </View>

          <View style={styles.heroCenter}>
            {prediction.status === 'finished' ? (
              <Text style={[styles.heroScore, { color: colors.foreground }]}>
                {prediction.homeScore} — {prediction.awayScore}
              </Text>
            ) : prediction.status === 'live' ? (
              <Text style={[styles.heroScore, { color: colors.danger }]}>? — ?</Text>
            ) : (
              <Text style={[styles.heroVs, { color: colors.muted }]}>VS</Text>
            )}
            <Text style={[styles.heroVenue, { color: colors.muted }]} numberOfLines={1}>{meta.venue}</Text>
          </View>

          <View style={[styles.heroTeam, styles.heroTeamRight]}>
            <Text style={styles.heroFlag}>{prediction.awayFlag}</Text>
            <Text style={[styles.heroTeamName, { color: colors.foreground }]}>{prediction.awayTeam}</Text>
          </View>
        </View>

        {/* Mode toggle */}
        <View style={[styles.modeTabs, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.modeTab, screenMode === 'overview' && { backgroundColor: colors.card }]}
            onPress={() => setScreenMode('overview')}
            activeOpacity={0.8}
          >
            <Ionicons name="stats-chart" size={14} color={screenMode === 'overview' ? colors.foreground : colors.muted} />
            <Text style={[styles.modeTabText, { color: screenMode === 'overview' ? colors.foreground : colors.muted }]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, screenMode === 'warroom' && { backgroundColor: colors.primary + '22' }]}
            onPress={() => setScreenMode('warroom')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13 }}>⚡</Text>
            <Text style={[styles.modeTabText, { color: screenMode === 'warroom' ? colors.primary : colors.muted }]}>
              War Room
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {screenMode === 'warroom' ? (
        <LiveChatRoom
          roomId={prediction.id}
          roomName={`${prediction.homeTeam} vs ${prediction.awayTeam}`}
        />
      ) : null}

      {screenMode === 'overview' && <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Head-to-Head</Text>
          <Text style={[styles.cardSub, { color: colors.muted }]}>All-time record</Text>

          <View style={styles.h2hRow}>
            <View style={styles.h2hSide}>
              <Text style={[styles.h2hNum, { color: colors.accent }]}>{meta.homeWins}</Text>
              <Text style={[styles.h2hLabel, { color: colors.muted }]}>{prediction.homeTeam}</Text>
            </View>
            <View style={styles.h2hSide}>
              <Text style={[styles.h2hNum, { color: colors.muted }]}>{meta.draws}</Text>
              <Text style={[styles.h2hLabel, { color: colors.muted }]}>Draws</Text>
            </View>
            <View style={styles.h2hSide}>
              <Text style={[styles.h2hNum, { color: colors.primary }]}>{meta.awayWins}</Text>
              <Text style={[styles.h2hLabel, { color: colors.muted }]}>{prediction.awayTeam}</Text>
            </View>
          </View>

          <View style={[styles.h2hBar, { backgroundColor: colors.cardAlt }]}>
            <View style={[styles.h2hBarHome, { width: `${homeH2HPct}%` as any, backgroundColor: colors.accent }]} />
            <View style={[styles.h2hBarDraw, { width: `${drawH2HPct}%` as any, backgroundColor: colors.muted }]} />
            <View style={[styles.h2hBarAway, { flex: 1, backgroundColor: colors.primary }]} />
          </View>

          <View style={styles.formSection}>
            <View style={styles.formRow}>
              <Text style={[styles.formTeamLabel, { color: colors.muted }]}>{prediction.homeTeam}</Text>
              <View style={styles.formPips}>
                {meta.homeForm.map((r, i) => <FormPip key={i} result={r} />)}
              </View>
            </View>
            <View style={styles.formRow}>
              <Text style={[styles.formTeamLabel, { color: colors.muted }]}>{prediction.awayTeam}</Text>
              <View style={styles.formPips}>
                {meta.awayForm.map((r, i) => <FormPip key={i} result={r} />)}
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.communityHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Community Predictions</Text>
            <Text style={[styles.predCount, { color: colors.muted }]}>
              {prediction.totalPredictions.toLocaleString()} fans
            </Text>
          </View>

          <View style={styles.voteBarWrap}>
            <View style={[styles.voteBar, { backgroundColor: colors.cardAlt }]}>
              <View style={[styles.voteBarHome, { width: `${meta.homePercent}%` as any, backgroundColor: colors.accent }]} />
              <View style={[styles.voteBarDraw, { width: `${meta.drawPercent}%` as any, backgroundColor: colors.warning }]} />
              <View style={[styles.voteBarAway, { flex: 1, backgroundColor: colors.primary }]} />
            </View>
          </View>

          <View style={styles.voteLabels}>
            <View style={styles.voteLabel}>
              <View style={[styles.voteDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.voteLabelTeam, { color: colors.foreground }]}>{prediction.homeTeam}</Text>
              <Text style={[styles.voteLabelPct, { color: colors.accent }]}>{meta.homePercent}%</Text>
            </View>
            <View style={styles.voteLabel}>
              <View style={[styles.voteDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.voteLabelTeam, { color: colors.foreground }]}>Draw</Text>
              <Text style={[styles.voteLabelPct, { color: colors.warning }]}>{meta.drawPercent}%</Text>
            </View>
            <View style={styles.voteLabel}>
              <View style={[styles.voteDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.voteLabelTeam, { color: colors.foreground }]}>{prediction.awayTeam}</Text>
              <Text style={[styles.voteLabelPct, { color: colors.primary }]}>{meta.awayPercent}%</Text>
            </View>
          </View>

          {prediction.status === 'finished' && (
            <View style={[styles.accuracyRow, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.accuracyText, { color: colors.success }]}>
                {Math.round((prediction.correctPredictions / prediction.totalPredictions) * 100)}% of fans predicted the correct result
              </Text>
            </View>
          )}
        </View>

        {prediction.status === 'upcoming' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Your Prediction</Text>
            {prediction.userPrediction ? (
              <View style={[styles.submittedWrap, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.submittedLabel, { color: colors.success }]}>Prediction locked in!</Text>
                <Text style={[styles.submittedScore, { color: colors.foreground }]}>
                  {prediction.homeTeam} {prediction.userPrediction.home} — {prediction.userPrediction.away} {prediction.awayTeam}
                </Text>
                <Text style={[styles.submittedXP, { color: colors.primary }]}>+200 XP if correct</Text>
              </View>
            ) : (
              <View>
                <Text style={[styles.cardSub, { color: colors.muted }]}>Enter your score prediction to earn XP</Text>
                <View style={styles.predInputRow}>
                  <View style={styles.predTeamInput}>
                    <Text style={[styles.predTeamFlag]}>{prediction.homeFlag}</Text>
                    <TextInput
                      style={[styles.predInput, { color: colors.foreground, backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                      value={homeInput}
                      onChangeText={setHomeInput}
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text style={[styles.predDash, { color: colors.muted }]}>—</Text>
                  <View style={styles.predTeamInput}>
                    <TextInput
                      style={[styles.predInput, { color: colors.foreground, backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                      value={awayInput}
                      onChangeText={setAwayInput}
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={[styles.predTeamFlag]}>{prediction.awayFlag}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.predSubmitBtn, { backgroundColor: colors.primary, opacity: (!homeInput || !awayInput) ? 0.5 : 1 }]}
                  onPress={handleSubmitPrediction}
                  disabled={!homeInput || !awayInput}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trophy" size={16} color="#000" />
                  <Text style={styles.predSubmitText}>Lock In Prediction (+200 XP)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={[styles.commentsSection]}>
          <View style={styles.commentsSectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Match Thread
            </Text>
            <View style={[styles.commentCount, { backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.commentCountText, { color: colors.muted }]}>{matchComments.length}</Text>
            </View>
          </View>
          <Text style={[styles.cardSub, { color: colors.muted }]}>Join the conversation</Text>

          {matchComments.length === 0 && (
            <View style={styles.noComments}>
              <Ionicons name="chatbubble-outline" size={32} color={colors.muted} />
              <Text style={[styles.noCommentsText, { color: colors.muted }]}>Be the first to comment!</Text>
            </View>
          )}

          {matchComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} matchId={prediction.id} />
          ))}
        </View>
      </ScrollView>}

      {screenMode === 'overview' && (
        <View style={[
          styles.commentInputBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'web' ? 20 : insets.bottom + 8,
          }
        ]}>
          <View style={[styles.commentInputWrap, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={styles.userFlag}>{user?.teamFlag ?? '🌍'}</Text>
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
  heroGradient: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modeTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginTop: 12,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeTabText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600' as const,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  competition: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTeam: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  heroTeamRight: {
    alignItems: 'center',
  },
  heroFlag: {
    fontSize: 52,
  },
  heroTeamName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroCenter: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  heroScore: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroVs: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroVenue: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 120,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    marginBottom: 16,
  },
  h2hRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    marginTop: 8,
  },
  h2hSide: {
    alignItems: 'center',
    gap: 4,
  },
  h2hNum: {
    fontSize: 28,
    fontWeight: '800',
  },
  h2hLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  h2hBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  h2hBarHome: { borderRadius: 0 },
  h2hBarDraw: {},
  h2hBarAway: {},
  formSection: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formTeamLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 72,
  },
  formPips: {
    flexDirection: 'row',
    gap: 4,
  },
  formPip: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formPipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  predCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  voteBarWrap: {
    marginTop: 12,
    marginBottom: 12,
  },
  voteBar: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  voteBarHome: { borderRadius: 0 },
  voteBarDraw: {},
  voteBarAway: {},
  voteLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voteLabel: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  voteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  voteLabelTeam: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  voteLabelPct: {
    fontSize: 14,
    fontWeight: '800',
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  accuracyText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  submittedWrap: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  submittedLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  submittedScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  submittedXP: {
    fontSize: 13,
    fontWeight: '600',
  },
  predInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 16,
  },
  predTeamInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predTeamFlag: {
    fontSize: 28,
  },
  predInput: {
    width: 60,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
  },
  predDash: {
    fontSize: 24,
    fontWeight: '800',
  },
  predSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  predSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  commentsSection: {
    marginBottom: 4,
    gap: 10,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentCount: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  commentCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noCommentsText: {
    fontSize: 14,
  },
  commentItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarFlag: {
    fontSize: 18,
  },
  commentMeta: {
    flex: 1,
    gap: 2,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  lvBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lvText: {
    fontSize: 10,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 11,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  commentInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
  },
  userFlag: {
    fontSize: 18,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  backBtnCenter: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
