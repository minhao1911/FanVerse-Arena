import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  teamId: string | null;
  teamName: string | null;
  teamFlag: string | null;
  fanLevel: number;
  xp: number;
  reputationScore: number;
  debateWins: number;
  predictionAccuracy: number;
  bio: string;
  avatarUrl: string | null;
  teamChangedAt: string | null;
  badges: string[];
  createdAt: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  selectTeam: (teamId: string, teamName: string, teamFlag: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'fanverse_user';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setUser(JSON.parse(data));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const saveUser = async (profile: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setUser(profile);
  };

  const login = async (email: string, _password: string) => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      if (profile.email === email) {
        setUser(profile);
        return;
      }
    }
    throw new Error('Invalid credentials');
  };

  const register = async (email: string, username: string, _password: string) => {
    const profile: UserProfile = {
      id: generateId(),
      username,
      email,
      teamId: null,
      teamName: null,
      teamFlag: null,
      fanLevel: 1,
      xp: 0,
      reputationScore: 0,
      debateWins: 0,
      predictionAccuracy: 0,
      bio: '',
      avatarUrl: null,
      teamChangedAt: null,
      badges: ['newcomer'],
      createdAt: new Date().toISOString(),
    };
    await saveUser(profile);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await saveUser(updated);
  };

  const selectTeam = async (teamId: string, teamName: string, teamFlag: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    if (user.teamId && user.teamChangedAt) {
      const daysSince = (Date.now() - new Date(user.teamChangedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 90) {
        throw new Error(`You can change your team in ${Math.ceil(90 - daysSince)} days`);
      }
    }
    const updated = { ...user, teamId, teamName, teamFlag, teamChangedAt: now };
    await saveUser(updated);
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    selectTeam,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
