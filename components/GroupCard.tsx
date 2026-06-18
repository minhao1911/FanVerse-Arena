import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Group } from '@/context/AppContext';

interface Props {
  group: Group;
  onJoin: (id: string) => void;
  onPress: (group: Group) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

export function GroupCard({ group, onJoin, onPress }: Props) {
  const colors = useColors();

  const handleJoin = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onJoin(group.id);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(group)}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#1a2236', '#0a0e1a']}
        style={styles.coverBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.flagBig}>{group.teamFlag}</Text>
        <View style={[styles.privacyBadge, { backgroundColor: group.privacy === 'public' ? colors.success + '33' : colors.warning + '33' }]}>
          <Ionicons name={group.privacy === 'public' ? 'globe-outline' : 'lock-closed-outline'} size={10} color={group.privacy === 'public' ? colors.success : colors.warning} />
          <Text style={[styles.privacyText, { color: group.privacy === 'public' ? colors.success : colors.warning }]}>
            {group.privacy}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{group.name}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{group.description}</Text>

        <View style={styles.tags}>
          {group.tags.slice(0, 3).map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.tagText, { color: colors.accent }]}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.stat}>
            <Ionicons name="people" size={14} color={colors.muted} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>{formatCount(group.memberCount)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: group.isJoined ? colors.cardAlt : colors.primary, borderColor: group.isJoined ? colors.border : 'transparent', borderWidth: group.isJoined ? 1 : 0 }]}
            onPress={handleJoin}
            activeOpacity={0.8}
          >
            <Text style={[styles.joinText, { color: group.isJoined ? colors.mutedForeground : '#000' }]}>
              {group.isJoined ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  coverBanner: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flagBig: {
    fontSize: 36,
  },
  privacyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  privacyText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  body: {
    padding: 14,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500' as const,
  },
  joinBtn: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
  },
  joinText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
  },
});
