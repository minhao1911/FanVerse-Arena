import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp, AppNotification } from '@/context/AppContext';

const TYPE_CONFIG: Record<AppNotification['type'], { icon: string; color: string; label: string }> = {
  vote:       { icon: 'thumbs-up',        color: '#3b82f6', label: 'Vote'       },
  debate:     { icon: 'flame',            color: '#ef4444', label: 'Debate'     },
  prediction: { icon: 'trophy',           color: '#f5a623', label: 'Prediction' },
  comment:    { icon: 'chatbubble',       color: '#22c55e', label: 'Comment'    },
  group:      { icon: 'people',           color: '#a855f7', label: 'Group'      },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationRow({ item }: { item: AppNotification }) {
  const colors = useColors();
  const cfg = TYPE_CONFIG[item.type];

  return (
    <View style={[styles.row, { backgroundColor: item.read ? colors.card : colors.cardAlt, borderColor: colors.border }]}>
      {/* Unread dot */}
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}

      {/* Type icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + '22' }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.messageRow}>
          {item.fromTeamFlag ? (
            <Text style={styles.flag}>{item.fromTeamFlag}</Text>
          ) : null}
          <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        <View style={styles.meta}>
          <View style={[styles.typePill, { backgroundColor: cfg.color + '22' }]}>
            <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={[styles.time, { color: colors.muted }]}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markAllRead } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
        backgroundColor: colors.headerBg,
        borderBottomColor: colors.border,
      }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markReadBtn, { borderColor: colors.border }]}
              onPress={markAllRead}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={15} color={colors.primary} />
              <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
        renderItem={({ item }) => <NotificationRow item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications yet</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              When fans vote, comment, or create debates, you'll see it here in real time.
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markReadText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 6 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' },
  flag: { fontSize: 16, lineHeight: 22 },
  message: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20, flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  typeLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  time: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 14, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, textAlign: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },
});
