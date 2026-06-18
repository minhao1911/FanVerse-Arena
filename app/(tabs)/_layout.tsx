import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: string }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

function NotifIcon({ focused, color }: { focused: boolean; color: string }) {
  const { unreadCount } = useApp();
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={22} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 84 : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="arena"
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'flame' : 'flame-outline'} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="predict"
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused, color }) => <NotifIcon focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'podium' : 'podium-outline'} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
  },
  badgeWrap: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
    color: '#fff',
  },
});
