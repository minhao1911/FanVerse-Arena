import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { DebatePost } from '@/context/AppContext';

interface Props {
  debate: DebatePost;
  onVote: (id: string, vote: 'up' | 'down') => void;
  onPress: (debate: DebatePost) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DebateCard({ debate, onVote, onPress }: Props) {
  const colors = useColors();

  const handleVote = (vote: 'up' | 'down') => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onVote(debate.id, vote);
  };

  const score = debate.upvotes - debate.downvotes;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(debate)}
      activeOpacity={0.88}
    >
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accent + '33' }]}>
            <Text style={styles.avatarFlag}>{debate.authorTeamFlag}</Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: colors.foreground }]}>{debate.authorName}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{debate.authorTeam} • Lv.{debate.authorLevel} • {timeAgo(debate.createdAt)}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>{debate.title}</Text>
      <Text style={[styles.content, { color: colors.mutedForeground }]} numberOfLines={2}>{debate.content}</Text>

      <View style={styles.tags}>
        {debate.tags.slice(0, 3).map(tag => (
          <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + '22' }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.voteBtn, { backgroundColor: debate.userVote === 'up' ? colors.success + '33' : colors.cardAlt }]}
          onPress={() => handleVote('up')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={16} color={debate.userVote === 'up' ? colors.success : colors.muted} />
          <Text style={[styles.voteCount, { color: debate.userVote === 'up' ? colors.success : colors.muted }]}>{debate.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voteBtn, { backgroundColor: debate.userVote === 'down' ? colors.danger + '33' : colors.cardAlt }]}
          onPress={() => handleVote('down')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-down" size={16} color={debate.userVote === 'down' ? colors.danger : colors.muted} />
          <Text style={[styles.voteCount, { color: debate.userVote === 'down' ? colors.danger : colors.muted }]}>{debate.downvotes}</Text>
        </TouchableOpacity>

        <View style={styles.actionRight}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.muted} />
          <Text style={[styles.voteCount, { color: colors.muted }]}>{debate.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  header: {
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFlag: {
    fontSize: 20,
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600' as const,
  },
  meta: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
    marginBottom: 6,
    lineHeight: 22,
  },
  content: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 19,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500' as const,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  voteCount: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600' as const,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },
});
