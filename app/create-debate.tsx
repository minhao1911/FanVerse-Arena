import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

const POPULAR_TAGS = ['WorldCup', 'Tactics', 'Transfer', 'MatchDay', 'Prediction', 'GOAT', 'Analysis', 'Hot Take'];

export default function CreateDebateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addDebate } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    else if (title.trim().length < 10) errs.title = 'Title must be at least 10 characters';
    if (!content.trim()) errs.content = 'Your argument is required';
    else if (content.trim().length < 20) errs.content = 'Content must be at least 20 characters';
    return errs;
  };

  const handleAddTag = (tag: string) => {
    const t = tag.trim().replace(/\s+/g, '');
    if (!t || tags.includes(t) || tags.length >= 5) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags([...tags, t]);
    setCustomTag('');
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!user) return;
    setErrors({});
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      addDebate({
        authorId: user.id,
        authorName: user.username,
        authorTeam: user.teamName ?? '',
        authorTeamFlag: user.teamFlag ?? '⚽',
        authorLevel: user.fanLevel,
        title: title.trim(),
        content: content.trim(),
        tags,
        userVote: null,
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
        backgroundColor: colors.headerBg,
        borderBottomColor: colors.border
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Debate</Text>
        <TouchableOpacity
          style={[styles.postBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Author Preview */}
        <View style={[styles.authorRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.authorAvatar, { backgroundColor: colors.accent + '33' }]}>
            <Text style={styles.authorFlag}>{user?.teamFlag ?? '⚽'}</Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: colors.foreground }]}>{user?.username}</Text>
            <Text style={[styles.authorTeam, { color: colors.muted }]}>{user?.teamName} • Lv.{user?.fanLevel}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Debate Title <Text style={{ color: colors.danger }}>*</Text></Text>
          <TextInput
            style={[styles.titleInput, {
              color: colors.foreground, backgroundColor: colors.card,
              borderColor: errors.title ? colors.danger : colors.border
            }]}
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors(e => ({ ...e, title: '' })); }}
            placeholder="State your argument clearly..."
            placeholderTextColor={colors.muted}
            maxLength={120}
            multiline
          />
          {!!errors.title && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.title}</Text>}
        </View>

        {/* Content */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Your Argument <Text style={{ color: colors.danger }}>*</Text></Text>
          <TextInput
            style={[styles.contentInput, {
              color: colors.foreground, backgroundColor: colors.card,
              borderColor: errors.content ? colors.danger : colors.border
            }]}
            value={content}
            onChangeText={(v) => { setContent(v); setErrors(e => ({ ...e, content: '' })); }}
            placeholder="Make your case with facts and evidence..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
          />
          {!!errors.content && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.content}</Text>}
        </View>

        {/* Tags */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Tags <Text style={[styles.optional, { color: colors.muted }]}>(up to 5)</Text></Text>
          {tags.length > 0 && (
            <View style={styles.selectedTags}>
              {tags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.selectedTag, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}
                  onPress={() => setTags(tags.filter(t => t !== tag))}
                >
                  <Text style={[styles.selectedTagText, { color: colors.primary }]}>#{tag}</Text>
                  <Ionicons name="close" size={12} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {tags.length < 5 && (
            <View style={[styles.tagInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.tagInput, { color: colors.foreground }]}
                value={customTag}
                onChangeText={setCustomTag}
                placeholder="Add tag..."
                placeholderTextColor={colors.muted}
                onSubmitEditing={() => handleAddTag(customTag)}
                returnKeyType="done"
              />
              {!!customTag && (
                <TouchableOpacity
                  style={[styles.addTagBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleAddTag(customTag)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.popularTagsWrap}>
            {POPULAR_TAGS.filter(t => !tags.includes(t)).map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.popularTag, { backgroundColor: colors.cardAlt, borderColor: colors.border, opacity: tags.length >= 5 ? 0.5 : 1 }]}
                onPress={() => handleAddTag(tag)}
                disabled={tags.length >= 5}
              >
                <Text style={[styles.popularTagText, { color: colors.mutedForeground }]}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <View style={styles.submitRow}>
              <Ionicons name="flame" size={20} color="#000" />
              <Text style={styles.submitBtnText}>Post Debate</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  postBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  scroll: { padding: 16 },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 20,
  },
  authorAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  authorFlag: { fontSize: 24 },
  authorName: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  authorTeam: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, marginBottom: 10 },
  optional: { fontSize: 12, fontFamily: 'Poppins_400Regular', fontWeight: '400' as const },
  titleInput: {
    fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const,
    borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 70,
  },
  contentInput: {
    fontSize: 15, fontFamily: 'Poppins_400Regular',
    borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 130,
  },
  fieldError: { fontSize: 12, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const, marginTop: 6 },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  selectedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  selectedTagText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  tagInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 46, marginBottom: 12,
  },
  tagInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  addTagBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  popularTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  popularTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  popularTagText: { fontSize: 12, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const },
  submitBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
});
