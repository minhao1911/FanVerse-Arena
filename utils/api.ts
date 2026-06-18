import { Platform } from 'react-native';

function getBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
}

const BASE_URL = getBaseUrl();

export async function fetchInitialData(): Promise<{ tugScore: number }> {
  try {
    const res = await fetch(`${BASE_URL}/api/initial-data`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { tugScore: 50 };
  }
}

export async function syncUserToServer(user: {
  id: string;
  username: string;
  country?: string | null;
  level?: number;
  xp?: number;
}): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        username: user.username,
        country: user.country ?? null,
        level: user.level ?? 1,
        xp: user.xp ?? 0,
      }),
    });
  } catch {
  }
}

export async function fetchUserFromServer(id: string): Promise<null | {
  id: string;
  username: string;
  country: string | null;
  level: number;
  xp: number;
}> {
  try {
    const res = await fetch(`${BASE_URL}/api/user/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
