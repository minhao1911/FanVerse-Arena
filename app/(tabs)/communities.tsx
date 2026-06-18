import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { GroupCard } from '@/components/GroupCard';

const TABS = ['All', 'Joined', 'Popular'];

export default function CommunitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { groups, joinGroup } = useApp();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeTab === 'Joined') return g.isJoined;
    if (activeTab === 'Popular') return g.memberCount > 10000;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
        backgroundColor: colors.headerBg,
        borderBottomColor: colors.border
      }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Communities</Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/create-group')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={17} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search groups..."
            placeholderTextColor={colors.muted}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, { borderBottomColor: activeTab === tab ? colors.primary : 'transparent' }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onJoin={joinGroup}
            onPress={() => {}}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {activeTab === 'Joined' ? 'No groups joined yet' : 'No groups found'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {activeTab === 'Joined' ? 'Join a group to get started!' : 'Be the first to create one!'}
            </Text>
            {activeTab === 'Joined' && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab('All')}
              >
                <Text style={styles.emptyBtnText}>Browse Groups</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: { fontSize: 13, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' as const },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  emptyBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', fontWeight: '700' as const, color: '#000' },
});
