import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, ActivityIndicator, FlatList, Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { NATIONAL_TEAMS } from '@/data/teams';

const POPULAR_TAGS = ['WorldCup', 'Tactics', 'Transfer', 'MatchDay', 'EURO', 'Champions', 'Highlights', 'Debate', 'Predictions', 'Goals'];

export default function CreateGroupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createGroup } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [selectedTeam, setSelectedTeam] = useState(
    user?.teamId ? NATIONAL_TEAMS.find(t => t.id === user.teamId) ?? null : null
  );
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Group name is required';
    else if (name.trim().length < 3) errs.name = 'Name must be at least 3 characters';
    else if (name.trim().length > 50) errs.name = 'Name must be under 50 characters';
    if (!description.trim()) errs.description = 'Description is required';
    else if (description.trim().length < 10) errs.description = 'Description must be at least 10 characters';
    if (!selectedTeam) errs.team = 'Please select a team';
    return errs;
  };

  const handleAddTag = (tag: string) => {
    const t = tag.trim().replace(/\s+/g, '');
    if (!t || tags.includes(t) || tags.length >= 5) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags([...tags, t]);
    setCustomTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleCreate = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim(),
        privacy,
        teamId: selectedTeam!.id,
        teamName: selectedTeam!.name,
        teamFlag: selectedTeam!.flag,
        coverImage: null,
        createdBy: user?.id ?? '',
        tags,
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      setErrors({ general: e.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = NATIONAL_TEAMS.filter(t =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
        backgroundColor: colors.headerBg,
        borderBottomColor: colors.border
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create Group</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveBtnText}>Create</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* General Error */}
        {!!errors.general && (
          <View style={[styles.errorBanner, { backgroundColor: colors.danger + '22', borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errors.general}</Text>
          </View>
        )}

        {/* Group Banner Preview */}
        <LinearGradient
          colors={selectedTeam ? ['#1a2236', '#0a0e1a'] : ['#1a1a1a', '#111111']}
          style={styles.bannerPreview}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.bannerFlag}>{selectedTeam?.flag ?? '🏟️'}</Text>
          <View style={styles.bannerOverlay}>
            <Text style={[styles.bannerName, { color: '#f1f5f9' }]} numberOfLines={1}>
              {name.trim() || 'Group Name'}
            </Text>
            <Text style={[styles.bannerTeam, { color: '#94a3b8' }]}>
              {selectedTeam?.name ?? 'Select a team'}
            </Text>
          </View>
          <View style={[styles.privacyPreviewBadge, {
            backgroundColor: privacy === 'public' ? '#22c55e33' : '#f59e0b33'
          }]}>
            <Ionicons
              name={privacy === 'public' ? 'globe-outline' : 'lock-closed-outline'}
              size={12}
              color={privacy === 'public' ? '#22c55e' : '#f59e0b'}
            />
          </View>
        </LinearGradient>

        {/* Group Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Group Name <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <View style={[styles.inputWrap, {
            backgroundColor: colors.card,
            borderColor: errors.name ? colors.danger : colors.border
          }]}>
            <Ionicons name="people-outline" size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={name}
              onChangeText={(v) => { setName(v); setErrors(e => ({ ...e, name: '' })); }}
              placeholder="e.g. Brazil Ultras Global"
              placeholderTextColor={colors.muted}
              maxLength={50}
            />
            <Text style={[styles.charCount, { color: colors.muted }]}>{name.length}/50</Text>
          </View>
          {!!errors.name && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.name}</Text>}
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Description <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <View style={[styles.textAreaWrap, {
            backgroundColor: colors.card,
            borderColor: errors.description ? colors.danger : colors.border
          }]}>
            <TextInput
              style={[styles.textArea, { color: colors.foreground }]}
              value={description}
              onChangeText={(v) => { setDescription(v); setErrors(e => ({ ...e, description: '' })); }}
              placeholder="What is this group about? What makes it unique?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={[styles.charCountBottom, { color: colors.muted }]}>{description.length}/300</Text>
          </View>
          {!!errors.description && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.description}</Text>}
        </View>

        {/* Team Selection */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            National Team <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.teamSelector, {
              backgroundColor: colors.card,
              borderColor: errors.team ? colors.danger : colors.border
            }]}
            onPress={() => setShowTeamPicker(true)}
            activeOpacity={0.8}
          >
            {selectedTeam ? (
              <View style={styles.selectedTeamRow}>
                <Text style={styles.selectedTeamFlag}>{selectedTeam.flag}</Text>
                <View>
                  <Text style={[styles.selectedTeamName, { color: colors.foreground }]}>{selectedTeam.name}</Text>
                  <Text style={[styles.selectedTeamConfed, { color: colors.muted }]}>{selectedTeam.confederation}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.teamPlaceholder, { color: colors.muted }]}>Select a national team</Text>
            )}
            <Ionicons name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
          {!!errors.team && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.team}</Text>}
        </View>

        {/* Privacy */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Privacy</Text>
          <View style={styles.privacyRow}>
            {(['public', 'private'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.privacyOption, {
                  backgroundColor: privacy === p ? (p === 'public' ? colors.success + '22' : colors.warning + '22') : colors.card,
                  borderColor: privacy === p ? (p === 'public' ? colors.success : colors.warning) : colors.border,
                  flex: 1,
                }]}
                onPress={() => {
                  setPrivacy(p);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={p === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                  size={22}
                  color={privacy === p ? (p === 'public' ? colors.success : colors.warning) : colors.muted}
                />
                <Text style={[styles.privacyLabel, {
                  color: privacy === p ? (p === 'public' ? colors.success : colors.warning) : colors.foreground
                }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
                <Text style={[styles.privacyDesc, { color: colors.muted }]}>
                  {p === 'public' ? 'Anyone can join' : 'Invite only'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Tags <Text style={[styles.optional, { color: colors.muted }]}>(up to 5)</Text></Text>

          {/* Selected Tags */}
          {tags.length > 0 && (
            <View style={styles.selectedTags}>
              {tags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.selectedTag, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}
                  onPress={() => handleRemoveTag(tag)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectedTagText, { color: colors.primary }]}>#{tag}</Text>
                  <Ionicons name="close" size={12} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Custom Tag Input */}
          {tags.length < 5 && (
            <View style={[styles.tagInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.tagInput, { color: colors.foreground }]}
                value={customTag}
                onChangeText={setCustomTag}
                placeholder="Add a custom tag..."
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

          {/* Popular Tags */}
          <Text style={[styles.popularTagsLabel, { color: colors.muted }]}>Popular</Text>
          <View style={styles.popularTagsWrap}>
            {POPULAR_TAGS.filter(t => !tags.includes(t)).map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.popularTag, {
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                  opacity: tags.length >= 5 ? 0.5 : 1
                }]}
                onPress={() => handleAddTag(tag)}
                disabled={tags.length >= 5}
                activeOpacity={0.8}
              >
                <Text style={[styles.popularTagText, { color: colors.mutedForeground }]}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Button (bottom) */}
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <View style={styles.createBtnRow}>
              <Ionicons name="people" size={20} color="#000" />
              <Text style={styles.createBtnText}>Create Group</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Team Picker Modal */}
      <Modal
        visible={showTeamPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTeamPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Team</Text>
            <TouchableOpacity onPress={() => setShowTeamPicker(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={[styles.modalSearch, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={17} color={colors.muted} />
            <TextInput
              style={[styles.modalSearchInput, { color: colors.foreground }]}
              value={teamSearch}
              onChangeText={setTeamSearch}
              placeholder="Search teams..."
              placeholderTextColor={colors.muted}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredTeams}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => {
              const isSelected = selectedTeam?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.teamOption, {
                    backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
                    borderBottomColor: colors.border
                  }]}
                  onPress={() => {
                    setSelectedTeam(item);
                    setErrors(e => ({ ...e, team: '' }));
                    setShowTeamPicker(false);
                    setTeamSearch('');
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.teamOptionFlag}>{item.flag}</Text>
                  <View style={styles.teamOptionInfo}>
                    <Text style={[styles.teamOptionName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.teamOptionConfed, { color: colors.muted }]}>{item.confederation}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  scroll: { padding: 16 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16,
  },
  errorBannerText: { fontSize: 13, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const, flex: 1 },
  bannerPreview: {
    height: 110, borderRadius: 16, marginBottom: 24,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', borderWidth: 1, borderColor: '#1e2d4a',
  },
  bannerFlag: { fontSize: 44 },
  bannerOverlay: { alignItems: 'center', marginTop: 4 },
  bannerName: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  bannerTeam: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  privacyPreviewBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  field: { marginBottom: 22 },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const, marginBottom: 10 },
  optional: { fontSize: 12, fontFamily: 'Poppins_400Regular', fontWeight: '400' as const },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  charCount: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  textAreaWrap: {
    borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 110,
  },
  textArea: { fontSize: 15, fontFamily: 'Poppins_400Regular', minHeight: 80 },
  charCountBottom: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'right', marginTop: 4 },
  fieldError: { fontSize: 12, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const, marginTop: 6 },
  teamSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 64,
  },
  selectedTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedTeamFlag: { fontSize: 28 },
  selectedTeamName: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  selectedTeamConfed: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  teamPlaceholder: { fontSize: 15, fontFamily: 'Poppins_400Regular' },
  privacyRow: { flexDirection: 'row', gap: 12 },
  privacyOption: {
    borderRadius: 14, borderWidth: 1.5, padding: 16,
    alignItems: 'center', gap: 4,
  },
  privacyLabel: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  privacyDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
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
  popularTagsLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const, marginBottom: 8 },
  popularTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  popularTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  popularTagText: { fontSize: 12, fontFamily: 'Poppins_500Medium', fontWeight: '500' as const },
  createBtn: {
    height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  createBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  createBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 46,
  },
  modalSearchInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  teamOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  teamOptionFlag: { fontSize: 30 },
  teamOptionInfo: { flex: 1 },
  teamOptionName: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  teamOptionConfed: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
});
