import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { FanLevelBadge } from '@/components/FanLevelBadge';

const BADGES: Record<string, { icon: string; label: string; color: string }> = {
  newcomer: { icon: 'star-outline', label: 'Newcomer', color: '#94a3b8' },
  first_debate: { icon: 'flame', label: 'Debater', color: '#ef4444' },
  predictor: { icon: 'trophy', label: 'Predictor', color: '#f5a623' },
  top_fan: { icon: 'ribbon', label: 'Top Fan', color: '#a855f7' },
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  if (!user) return null;

  const xpProgress = (user.xp % 500) / 500;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 20 }}
    >
      {/* Header */}
      <LinearGradient
        colors={['#111827', '#0a0e1a']}
        style={[styles.profileHeader, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16 }]}
      >
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { borderColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user.teamFlag ?? '⚽'}</Text>
          </View>
          <View style={[styles.levelBadgeWrap, { backgroundColor: colors.primary }]}>
            <Text style={styles.levelBadgeText}>{user.fanLevel}</Text>
          </View>
        </View>

        <Text style={styles.username}>{user.username}</Text>
        <Text style={[styles.team, { color: colors.muted }]}>{user.teamName ?? 'No team selected'}</Text>
        <FanLevelBadge level={user.fanLevel} size="md" />

        {/* XP Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpLabelRow}>
            <Text style={[styles.xpText, { color: colors.muted }]}>XP Progress</Text>
            <Text style={[styles.xpText, { color: colors.muted }]}>{user.xp % 500}/500</Text>
          </View>
          <View style={[styles.xpBarBg, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Reputation', value: user.reputationScore, icon: 'star', color: colors.primary },
          { label: 'Debate Wins', value: user.debateWins, icon: 'trophy', color: colors.accent },
          { label: 'Prediction %', value: `${user.predictionAccuracy}%`, icon: 'analytics', color: colors.success },
          { label: 'Total XP', value: user.xp, icon: 'flash', color: '#a855f7' },
        ].map(stat => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name={stat.icon as any} size={22} color={stat.color} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Badges */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Badges</Text>
        <View style={styles.badgesRow}>
          {user.badges.map(badge => {
            const info = BADGES[badge] ?? { icon: 'ribbon', label: badge, color: colors.primary };
            return (
              <View key={badge} style={[styles.badge, { backgroundColor: info.color + '22', borderColor: info.color + '44' }]}>
                <Ionicons name={info.icon as any} size={24} color={info.color} />
                <Text style={[styles.badgeLabel, { color: info.color }]}>{info.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Team Info */}
      {user.teamId && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.teamRow}>
            <Text style={styles.teamFlagLarge}>{user.teamFlag}</Text>
            <View style={styles.teamInfo}>
              <Text style={[styles.teamNameText, { color: colors.foreground }]}>{user.teamName}</Text>
              <Text style={[styles.teamSub, { color: colors.muted }]}>Your nation</Text>
              {user.teamChangedAt && (
                <Text style={[styles.teamSub, { color: colors.muted }]}>
                  Next change: {new Date(new Date(user.teamChangedAt).getTime() + 90 * 86400000).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Settings */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        {[
          { icon: 'mail-outline', label: user.email },
          { icon: 'calendar-outline', label: `Joined ${new Date(user.createdAt).toLocaleDateString()}` },
        ].map(item => (
          <View key={item.label} style={[styles.settingRow, { borderTopColor: colors.border }]}>
            <Ionicons name={item.icon as any} size={18} color={colors.muted} />
            <Text style={[styles.settingText, { color: colors.mutedForeground }]}>{item.label}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.settingRow, { borderTopColor: colors.border }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.settingText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 8,
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 3,
    backgroundColor: '#1a2236', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 44 },
  levelBadgeWrap: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  levelBadgeText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  username: { fontSize: 24, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#f1f5f9' },
  team: { fontSize: 14, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const },
  xpSection: { width: '100%', marginTop: 8 },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpText: { fontSize: 11, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const },
  xpBarBg: { height: 6, borderRadius: 3, width: '100%' },
  xpBarFill: { height: 6, borderRadius: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard: {
    flex: 1, minWidth: '45%', borderRadius: 14, borderWidth: 1,
    padding: 16, alignItems: 'center', gap: 4
  },
  statValue: { fontSize: 20, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  statLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  section: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16,
    borderWidth: 1, padding: 16,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, marginBottom: 12 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', gap: 4 },
  badgeLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  teamFlagLarge: { fontSize: 44 },
  teamInfo: { gap: 2 },
  teamNameText: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  teamSub: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1 },
  settingText: { fontSize: 14, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const },
});
