import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { getSocket, emitEvent } from '@/utils/socket';

export interface ChatMessage {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  authorFlag: string;
  authorLevel: number;
  text: string;
  createdAt: string;
}

interface TypingUser {
  userId: string;
  username: string;
  flag: string;
  roomId: string;
}

interface ReactionCounts {
  [emoji: string]: { count: number; reacted: boolean };
}

interface Props {
  roomId: string;
  roomName?: string;
}

const QUICK_EMOJIS = ['🔥', '💯', '😤', '🤣', '👏', '❤️'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  p1: [
    { id: 'seed-1', roomId: 'p1', authorId: 'sys1', authorName: 'BrazilKing', authorFlag: '🇧🇷', authorLevel: 25, text: "Vinicius Jr is going to tear this defence apart 🔥", createdAt: new Date(Date.now() - 8 * 60000).toISOString() },
    { id: 'seed-2', roomId: 'p1', authorId: 'sys2', authorName: 'LaAlbiceleste', authorFlag: '🇦🇷', authorLevel: 19, text: "Argentina's defence held Mbappé last month. Vini is no different 💪", createdAt: new Date(Date.now() - 6 * 60000).toISOString() },
    { id: 'seed-3', roomId: 'p1', authorId: 'sys3', authorName: 'TacticalEye', authorFlag: '🇫🇷', authorLevel: 18, text: "This is literally the El Clásico of international football 🍿", createdAt: new Date(Date.now() - 3 * 60000).toISOString() },
  ],
  p2: [
    { id: 'seed-4', roomId: 'p2', authorId: 'sys4', authorName: 'LesBleus', authorFlag: '🇫🇷', authorLevel: 19, text: "Bellingham is the best midfielder in the world right now, change my mind", createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'seed-5', roomId: 'p2', authorId: 'sys5', authorName: 'ThreeLions', authorFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', authorLevel: 18, text: "IT'S COMING HOME 🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿", createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
  ],
};

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -4, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: useNative }),
          Animated.timing(dot, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: useNative }),
          Animated.delay(600 - delay),
        ])
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 140);
    const a3 = animate(dot3, 280);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={dotStyles.row}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[dotStyles.dot, { transform: [{ translateY: dot }] }]} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#9ca3af' },
});

function TypingIndicator({ typers }: { typers: TypingUser[] }) {
  const colors = useColors();
  if (typers.length === 0) return null;
  const label =
    typers.length === 1
      ? `${typers[0].flag} ${typers[0].username} is typing`
      : typers.length === 2
      ? `${typers[0].flag} ${typers[0].username} & ${typers[1].username} are typing`
      : `${typers[0].flag} ${typers[0].username} & ${typers.length - 1} others are typing`;

  return (
    <View style={[indicatorStyles.row, { backgroundColor: colors.cardAlt }]}>
      <TypingDots />
      <Text style={[indicatorStyles.label, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  label: { fontSize: 12, fontFamily: 'Poppins_400Regular', fontStyle: 'italic' },
});

function ReactionPicker({
  visible,
  isOwn,
  onSelect,
  onClose,
}: {
  visible: boolean;
  isOwn: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.6);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={pickerStyles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View style={[
              pickerStyles.tray,
              { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale }], opacity },
              isOwn ? pickerStyles.trayRight : pickerStyles.trayLeft,
            ]}>
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={pickerStyles.emojiBtn}
                  onPress={() => onSelect(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={pickerStyles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center' },
  tray: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginHorizontal: 48,
    borderRadius: 36,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  trayRight: { alignSelf: 'flex-end' },
  trayLeft: { alignSelf: 'flex-start' },
  emojiBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
  },
  emoji: { fontSize: 22 },
});

export default function LiveChatRoom({ roomId, roomName }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES[roomId] ?? []);
  const [inputText, setInputText] = useState('');
  const [typers, setTypers] = useState<TypingUser[]>([]);
  const [reactions, setReactions] = useState<Record<string, ReactionCounts>>({});
  const [pickerMsgId, setPickerMsgId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    const handleIncoming = (msg: ChatMessage) => {
      if (msg.roomId !== roomId) return;
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleReact = (data: { messageId: string; emoji: string; userId: string; roomId: string }) => {
      if (data.roomId !== roomId) return;
      setReactions(prev => {
        const msgReactions = { ...(prev[data.messageId] ?? {}) };
        const existing = msgReactions[data.emoji];
        msgReactions[data.emoji] = {
          count: (existing?.count ?? 0) + 1,
          reacted: existing?.reacted ?? false,
        };
        return { ...prev, [data.messageId]: msgReactions };
      });
    };

    const handleTypingStart = (data: TypingUser) => {
      if (data.roomId !== roomId || data.userId === user?.id) return;
      setTypers(prev => prev.find(t => t.userId === data.userId) ? prev : [...prev, data]);
    };

    const handleTypingStop = (data: { userId: string; roomId: string }) => {
      if (data.roomId !== roomId) return;
      setTypers(prev => prev.filter(t => t.userId !== data.userId));
    };

    socket.on('receive_chat_message', handleIncoming);
    socket.on('message:react', handleReact);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('receive_chat_message', handleIncoming);
      socket.off('message:react', handleReact);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [roomId, user?.id]);

  const emitTypingStop = () => {
    if (isTypingRef.current && user) {
      emitEvent('typing:stop', { userId: user.id, roomId });
      isTypingRef.current = false;
    }
  };

  const handleChangeText = (text: string) => {
    setInputText(text);
    if (!user) return;
    if (text.length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        emitEvent('typing:start', { userId: user.id, username: user.username, flag: user.teamFlag ?? '🌍', roomId });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(emitTypingStop, 2500);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTypingStop();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTypingStop();

    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      roomId,
      authorId: user.id,
      authorName: user.username,
      authorFlag: user.teamFlag ?? '🌍',
      authorLevel: user.fanLevel,
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    emitEvent('send_chat_message', msg);
    setInputText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const handleLongPress = (msgId: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPickerMsgId(msgId);
  };

  const handleSelectReaction = (emoji: string) => {
    if (!pickerMsgId || !user) return;
    const msgId = pickerMsgId;
    setPickerMsgId(null);

    setReactions(prev => {
      const msgReactions = { ...(prev[msgId] ?? {}) };
      const existing = msgReactions[emoji];
      if (existing?.reacted) {
        msgReactions[emoji] = { count: Math.max(0, existing.count - 1), reacted: false };
        if (msgReactions[emoji].count === 0) delete msgReactions[emoji];
      } else {
        msgReactions[emoji] = { count: (existing?.count ?? 0) + 1, reacted: true };
      }
      return { ...prev, [msgId]: msgReactions };
    });

    emitEvent('message:react', { messageId: msgId, emoji, userId: user.id, roomId });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTapReaction = (msgId: string, emoji: string) => {
    if (!user) return;
    setReactions(prev => {
      const msgReactions = { ...(prev[msgId] ?? {}) };
      const existing = msgReactions[emoji];
      if (existing?.reacted) {
        msgReactions[emoji] = { count: Math.max(0, existing.count - 1), reacted: false };
        if (msgReactions[emoji].count === 0) delete msgReactions[emoji];
      } else {
        msgReactions[emoji] = { count: (existing?.count ?? 0) + 1, reacted: true };
      }
      return { ...prev, [msgId]: msgReactions };
    });
    emitEvent('message:react', { messageId: msgId, emoji, userId: user.id, roomId });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwn = item.authorId === user?.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const isGrouped = prevMsg?.authorId === item.authorId;
    const msgReactions = reactions[item.id] ?? {};
    const reactionEntries = Object.entries(msgReactions).filter(([, v]) => v.count > 0);

    return (
      <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
        {!isOwn && (
          <View style={[styles.avatar, { backgroundColor: colors.cardAlt }, isGrouped && styles.avatarHidden]}>
            {!isGrouped && <Text style={styles.avatarFlag}>{item.authorFlag}</Text>}
          </View>
        )}

        <View style={styles.bubbleCol}>
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => handleLongPress(item.id)}
            delayLongPress={350}
          >
            <View style={[styles.bubble, isOwn
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }
            ]}>
              {!isGrouped && !isOwn && (
                <View style={styles.bubbleHeader}>
                  <Text style={[styles.authorName, { color: colors.foreground }]}>{item.authorName}</Text>
                  <View style={[styles.lvPill, { backgroundColor: colors.cardAlt }]}>
                    <Text style={[styles.lvText, { color: colors.muted }]}>Lv {item.authorLevel}</Text>
                  </View>
                </View>
              )}
              <Text style={[styles.msgText, { color: isOwn ? '#000' : colors.foreground }]}>{item.text}</Text>
              <Text style={[styles.msgTime, { color: isOwn ? 'rgba(0,0,0,0.5)' : colors.muted }]}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>

          {reactionEntries.length > 0 && (
            <View style={[styles.reactionRow, isOwn && styles.reactionRowOwn]}>
              {reactionEntries.map(([emoji, { count, reacted }]) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.reactionPill,
                    {
                      backgroundColor: reacted ? colors.primary + '28' : colors.cardAlt,
                      borderColor: reacted ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => handleTapReaction(item.id, emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={[styles.reactionCount, { color: reacted ? colors.primary : colors.muted }]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.addReactionBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                onPress={() => handleLongPress(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.addReactionText, { color: colors.muted }]}>＋</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isOwn && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '33' }, isGrouped && styles.avatarHidden]}>
            {!isGrouped && <Text style={styles.avatarFlag}>{item.authorFlag}</Text>}
          </View>
        )}
      </View>
    );
  };

  const pickerMsg = messages.find(m => m.id === pickerMsgId);
  const pickerIsOwn = pickerMsg?.authorId === user?.id;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
    >
      <View style={[styles.liveBar, { backgroundColor: colors.cardAlt, borderBottomColor: colors.border }]}>
        <View style={styles.liveDot} />
        <Text style={[styles.liveText, { color: colors.muted }]}>Live War Room</Text>
        {roomName && (
          <>
            <Text style={[styles.liveSep, { color: colors.border }]}>•</Text>
            <Text style={[styles.liveRoom, { color: colors.foreground }]} numberOfLines={1}>{roomName}</Text>
          </>
        )}
        <View style={styles.liveRight}>
          <Ionicons name="flash" size={13} color={colors.primary} />
          <Text style={[styles.liveCount, { color: colors.primary }]}>{messages.length} messages</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚡</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>War Room is open</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Be the first to fire a take</Text>
          </View>
        )}
      />

      <TypingIndicator typers={typers} />

      <View style={[
        styles.inputBar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'web' ? 20 : insets.bottom + 8,
        }
      ]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <Text style={styles.inputFlag}>{user?.teamFlag ?? '🌍'}</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={inputText}
            onChangeText={handleChangeText}
            placeholder="Drop your take..."
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            maxLength={200}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: inputText.trim() ? 1 : 0.4 }]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      <ReactionPicker
        visible={pickerMsgId !== null}
        isOwn={pickerIsOwn ?? false}
        onSelect={handleSelectReaction}
        onClose={() => setPickerMsgId(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  liveText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  liveSep: { fontSize: 11 },
  liveRoom: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  liveRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  liveCount: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  listContent: { padding: 12, gap: 4, flexGrow: 1, justifyContent: 'flex-end' },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  msgRowOwn: { flexDirection: 'row-reverse' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarHidden: { opacity: 0 },
  avatarFlag: { fontSize: 16 },
  bubbleCol: { flexShrink: 1, maxWidth: '72%', gap: 4 },
  bubble: {
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  authorName: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  lvPill: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  lvText: { fontSize: 10, fontFamily: 'Poppins_500Medium' },
  msgText: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  msgTime: { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 2, alignSelf: 'flex-end' },
  reactionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  reactionRowOwn: { alignSelf: 'flex-end' },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  addReactionBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReactionText: { fontSize: 13, lineHeight: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    minHeight: 44,
  },
  inputFlag: { fontSize: 18 },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    maxHeight: 80,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
