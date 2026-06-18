import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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

interface Props {
  roomId: string;
  roomName?: string;
}

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

export default function LiveChatRoom({ roomId, roomName }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES[roomId] ?? []);
  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleIncoming = (msg: ChatMessage) => {
      if (msg.roomId !== roomId) return;
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('receive_chat_message', handleIncoming);
    return () => {
      socket.off('receive_chat_message', handleIncoming);
    };
  }, [roomId]);

  const handleSend = () => {
    if (!inputText.trim() || !user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwn = item.authorId === user?.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const isGrouped = prevMsg?.authorId === item.authorId;

    return (
      <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
        {!isOwn && (
          <View style={[
            styles.avatar,
            { backgroundColor: colors.cardAlt },
            isGrouped && styles.avatarHidden,
          ]}>
            {!isGrouped && <Text style={styles.avatarFlag}>{item.authorFlag}</Text>}
          </View>
        )}

        <View style={[styles.bubble, isOwn
          ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
          : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }
        ]}>
          {!isGrouped && !isOwn && (
            <View style={styles.bubbleHeader}>
              <Text style={[styles.authorName, { color: isOwn ? '#000' : colors.foreground }]}>
                {item.authorName}
              </Text>
              <View style={[styles.lvPill, { backgroundColor: isOwn ? 'rgba(0,0,0,0.15)' : colors.cardAlt }]}>
                <Text style={[styles.lvText, { color: isOwn ? '#000' : colors.muted }]}>Lv {item.authorLevel}</Text>
              </View>
            </View>
          )}
          <Text style={[styles.msgText, { color: isOwn ? '#000' : colors.foreground }]}>
            {item.text}
          </Text>
          <Text style={[styles.msgTime, { color: isOwn ? 'rgba(0,0,0,0.5)' : colors.muted }]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>

        {isOwn && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '33' }, isGrouped && styles.avatarHidden]}>
            {!isGrouped && <Text style={styles.avatarFlag}>{item.authorFlag}</Text>}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
    >
      {/* Live indicator */}
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

      {/* Message list */}
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

      {/* Input bar */}
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
            onChangeText={setInputText}
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
  liveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#ef4444',
  },
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
  bubble: {
    maxWidth: '72%',
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
