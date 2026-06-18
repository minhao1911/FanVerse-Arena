import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, emitEvent } from '../utils/socket';
import { fetchInitialData } from '../utils/api';
import type { WCMatch } from '../data/worldcup2026';

export interface AppNotification {
  id: string;
  type: 'vote' | 'debate' | 'prediction' | 'comment' | 'group' | 'bet_won' | 'bet_lost' | 'war' | 'mission';
  message: string;
  fromUser?: string;
  fromTeamFlag?: string;
  targetId?: string;
  read: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  teamId: string;
  teamName: string;
  teamFlag: string;
  coverImage: string | null;
  privacy: 'public' | 'private';
  memberCount: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
  isJoined?: boolean;
}

export interface DebatePost {
  id: string;
  authorId: string;
  authorName: string;
  authorTeam: string;
  authorTeamFlag: string;
  authorLevel: number;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  tags: string[];
  createdAt: string;
  userVote?: 'up' | 'down' | null;
  matchId?: string;
  category?: string;
}

export interface Prediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDate: string;
  homeScore: number | null;
  awayScore: number | null;
  userPrediction: { home: number; away: number } | null;
  status: 'upcoming' | 'live' | 'finished';
  correctPredictions: number;
  totalPredictions: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  teamFlag: string;
  teamName: string;
  score: number;
  level: number;
}

export interface MatchComment {
  id: string;
  matchId: string;
  authorName: string;
  authorTeam: string;
  authorTeamFlag: string;
  authorLevel: number;
  text: string;
  likes: number;
  createdAt: string;
  userLiked?: boolean;
}

export type BetType = 'home' | 'draw' | 'away';
export type BetStatus = 'pending' | 'won' | 'lost' | 'void';

export interface WCBet {
  id: string;
  matchId: string;
  matchLabel: string;
  betType: BetType;
  amount: number;
  odds: number;
  potentialWin: number;
  status: BetStatus;
  placedAt: string;
  settledAt?: string;
}

export interface DailyMission {
  id: string;
  icon: string;
  title: string;
  description: string;
  xpReward: number;
  tokenReward: number;
  type: 'vote' | 'predict' | 'comment' | 'debate' | 'login';
  target: number;
  progress: number;
  completed: boolean;
}

export interface NationWarSide {
  nationName: string;
  nationFlag: string;
  xp: number;
  members: number;
  color: string;
}

export interface NationWar {
  id: string;
  sideA: NationWarSide;
  sideB: NationWarSide;
  endsAt: string;
  week: number;
  status: 'active' | 'ended';
  winner?: 'A' | 'B' | 'draw';
}

export interface NationEntry {
  rank: number;
  name: string;
  flag: string;
  xp: number;
  level: number;
  levelName: string;
  members: number;
  weeklyXp: number;
  confederation: string;
}

interface AppContextValue {
  groups: Group[];
  debates: DebatePost[];
  predictions: Prediction[];
  leaderboard: LeaderboardEntry[];
  comments: Record<string, MatchComment[]>;
  onlineCount: number;
  notifications: AppNotification[];
  unreadCount: number;
  coins: number;
  bets: WCBet[];
  missions: DailyMission[];
  currentWar: NationWar;
  nations: NationEntry[];
  markAllRead: () => void;
  sendRealTimeNotification: (data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  createGroup: (group: Omit<Group, 'id' | 'createdAt' | 'memberCount'>) => Promise<void>;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  addDebate: (debate: Omit<DebatePost, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'commentCount'>) => void;
  voteDebate: (debateId: string, vote: 'up' | 'down') => void;
  submitPrediction: (predictionId: string, home: number, away: number) => void;
  addComment: (matchId: string, authorName: string, authorTeam: string, authorTeamFlag: string, authorLevel: number, text: string) => void;
  likeComment: (matchId: string, commentId: string) => void;
  placeBet: (match: WCMatch, betType: BetType, amount: number) => boolean;
  completeMission: (missionId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const GROUPS_KEY = 'fanverse_groups';
const DEBATES_KEY = 'fanverse_debates';
const COINS_KEY = 'fanverse_coins';
const BETS_KEY = 'fanverse_bets';
const MISSIONS_KEY = 'fanverse_missions_v2';

const STARTING_COINS = 1000;

function getNationLevel(xp: number): { level: number; name: string } {
  if (xp >= 10000000) return { level: 100, name: 'Global Superpower' };
  if (xp >= 7500000) return { level: 75, name: 'Empire' };
  if (xp >= 5000000) return { level: 50, name: 'Kingdom' };
  if (xp >= 2500000) return { level: 25, name: 'City' };
  if (xp >= 1000000) return { level: 10, name: 'Village' };
  return { level: 1, name: 'Camp' };
}

const NATIONS_DATA: NationEntry[] = [
  { rank: 1, name: 'Brazil', flag: '🇧🇷', xp: 4820000, ...getNationLevel(4820000), members: 194200, weeklyXp: 284000, confederation: 'CONMEBOL' },
  { rank: 2, name: 'Argentina', flag: '🇦🇷', xp: 4350000, ...getNationLevel(4350000), members: 178400, weeklyXp: 261000, confederation: 'CONMEBOL' },
  { rank: 3, name: 'Spain', flag: '🇪🇸', xp: 3980000, ...getNationLevel(3980000), members: 161000, weeklyXp: 238000, confederation: 'UEFA' },
  { rank: 4, name: 'Germany', flag: '🇩🇪', xp: 3650000, ...getNationLevel(3650000), members: 148000, weeklyXp: 219000, confederation: 'UEFA' },
  { rank: 5, name: 'France', flag: '🇫🇷', xp: 3420000, ...getNationLevel(3420000), members: 139000, weeklyXp: 205000, confederation: 'UEFA' },
  { rank: 6, name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', xp: 3100000, ...getNationLevel(3100000), members: 126000, weeklyXp: 188000, confederation: 'UEFA' },
  { rank: 7, name: 'Portugal', flag: '🇵🇹', xp: 2870000, ...getNationLevel(2870000), members: 116000, weeklyXp: 172000, confederation: 'UEFA' },
  { rank: 8, name: 'Italy', flag: '🇮🇹', xp: 2640000, ...getNationLevel(2640000), members: 107000, weeklyXp: 158000, confederation: 'UEFA' },
  { rank: 9, name: 'Netherlands', flag: '🇳🇱', xp: 2310000, ...getNationLevel(2310000), members: 94000, weeklyXp: 139000, confederation: 'UEFA' },
  { rank: 10, name: 'Japan', flag: '🇯🇵', xp: 2080000, ...getNationLevel(2080000), members: 84000, weeklyXp: 125000, confederation: 'AFC' },
  { rank: 11, name: 'Morocco', flag: '🇲🇦', xp: 1890000, ...getNationLevel(1890000), members: 77000, weeklyXp: 113000, confederation: 'CAF' },
  { rank: 12, name: 'USA', flag: '🇺🇸', xp: 1720000, ...getNationLevel(1720000), members: 70000, weeklyXp: 103000, confederation: 'CONCACAF' },
];

const CURRENT_WAR: NationWar = {
  id: 'war_w25_2026',
  sideA: { nationName: 'Argentina', nationFlag: '🇦🇷', xp: 284600, members: 178400, color: '#74b9ff' },
  sideB: { nationName: 'Brazil', nationFlag: '🇧🇷', xp: 261400, members: 194200, color: '#55efc4' },
  endsAt: new Date(Date.now() + 4 * 86400000).toISOString(),
  week: 25,
  status: 'active',
};

function getDefaultMissions(): DailyMission[] {
  return [
    {
      id: 'm1',
      icon: '👍',
      title: 'Vote on Debates',
      description: 'Cast your vote on 5 debates',
      xpReward: 50,
      tokenReward: 10,
      type: 'vote',
      target: 5,
      progress: 0,
      completed: false,
    },
    {
      id: 'm2',
      icon: '🎯',
      title: 'Make a Prediction',
      description: 'Predict the outcome of 1 match',
      xpReward: 75,
      tokenReward: 15,
      type: 'predict',
      target: 1,
      progress: 0,
      completed: false,
    },
    {
      id: 'm3',
      icon: '💬',
      title: 'Join the Conversation',
      description: 'Comment on 3 debates or matches',
      xpReward: 30,
      tokenReward: 5,
      type: 'comment',
      target: 3,
      progress: 0,
      completed: false,
    },
    {
      id: 'm4',
      icon: '🔥',
      title: 'Start a Debate',
      description: 'Create 1 original debate post',
      xpReward: 100,
      tokenReward: 25,
      type: 'debate',
      target: 1,
      progress: 0,
      completed: false,
    },
  ];
}

const SAMPLE_DEBATES: DebatePost[] = [
  {
    id: 'd1',
    authorId: 'u1',
    authorName: 'BrazilKing',
    authorTeam: 'Brazil',
    authorTeamFlag: '🇧🇷',
    authorLevel: 12,
    title: '🇧🇷 Brazil look UNSTOPPABLE at WC 2026 — 3-0 in their opener!',
    content: 'Vinicius Jr with 2 goals and a direct assist in the first game. The Seleção have never looked this clinical. Lamine Yamal who?',
    upvotes: 847,
    downvotes: 89,
    commentCount: 243,
    tags: ['Brazil', 'WorldCup2026', 'HotTake'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    userVote: null,
    matchId: 'b1',
    category: 'WC 2026',
  },
  {
    id: 'd2',
    authorId: 'u2',
    authorName: 'ArgentinaUltra',
    authorTeam: 'Argentina',
    authorTeamFlag: '🇦🇷',
    authorLevel: 19,
    title: '🇦🇷 USA holding Argentina 1-1 — biggest SHOCK at WC2026?',
    content: "I cannot believe this is happening. Messi's boys being held at home by the USA. Christian Pulisic is genuinely world class. This group is chaos.",
    upvotes: 1240,
    downvotes: 340,
    commentCount: 512,
    tags: ['Argentina', 'USA', 'WorldCup2026', 'Upset'],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    userVote: null,
    matchId: 'a3',
    category: 'WC 2026',
  },
  {
    id: 'd3',
    authorId: 'u3',
    authorName: 'ThreeLions99',
    authorTeam: 'England',
    authorTeamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    authorLevel: 15,
    title: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England vs Senegal — can the lions finally step up?',
    content: "England are STILL drawing 0-0 vs Senegal. Bellingham is invisible. Saka keeps getting doubled. If they don't score soon, group qualification gets messy.",
    upvotes: 678,
    downvotes: 122,
    commentCount: 301,
    tags: ['England', 'Senegal', 'WorldCup2026'],
    createdAt: new Date(Date.now() - 900000).toISOString(),
    userVote: null,
    matchId: 'd3',
    category: 'WC 2026',
  },
  {
    id: 'd4',
    authorId: 'u4',
    authorName: 'GermanMachine',
    authorTeam: 'Germany',
    authorTeamFlag: '🇩🇪',
    authorLevel: 21,
    title: '🇩🇪 Germany 4-0 Iran — Nagelsmann has BUILT something special',
    content: 'Four different scorers. Complete tactical dominance. Wirtz, Musiala, Havertz, Kroos. Germany look like genuine contenders for the trophy this time.',
    upvotes: 534,
    downvotes: 67,
    commentCount: 189,
    tags: ['Germany', 'WorldCup2026', 'Tactics'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    userVote: null,
    category: 'WC 2026',
  },
  {
    id: 'd5',
    authorId: 'u5',
    authorName: 'FrenchFan',
    authorTeam: 'France',
    authorTeamFlag: '🇫🇷',
    authorLevel: 17,
    title: 'Who is the GREATEST footballer of all time — Messi or Ronaldo?',
    content: "It's 2026, Messi just won his second World Cup. Does this settle the GOAT debate forever? Ronaldo never won it. Surely this puts Messi ahead?",
    upvotes: 2140,
    downvotes: 891,
    commentCount: 1204,
    tags: ['GOAT', 'Messi', 'Ronaldo', 'Debate'],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    userVote: null,
    category: 'GOAT',
  },
  {
    id: 'd6',
    authorId: 'u6',
    authorName: 'IbericaFan',
    authorTeam: 'Portugal',
    authorTeamFlag: '🇵🇹',
    authorLevel: 14,
    title: 'Should VAR be abolished from football entirely?',
    content: 'Three different controversial VAR decisions at WC2026 already. The game was better without it. Unpopular opinion: get rid of VAR permanently.',
    upvotes: 1567,
    downvotes: 734,
    commentCount: 678,
    tags: ['VAR', 'Football', 'Controversy'],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    userVote: null,
    category: 'Football',
  },
];

const SAMPLE_PREDICTIONS: Prediction[] = [
  {
    id: 'p1',
    homeTeam: 'Brazil',
    awayTeam: 'Argentina',
    homeFlag: '🇧🇷',
    awayFlag: '🇦🇷',
    matchDate: new Date(Date.now() + 86400000).toISOString(),
    homeScore: null,
    awayScore: null,
    userPrediction: null,
    status: 'upcoming',
    correctPredictions: 0,
    totalPredictions: 1247,
  },
  {
    id: 'p2',
    homeTeam: 'France',
    awayTeam: 'England',
    homeFlag: '🇫🇷',
    awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    matchDate: new Date(Date.now() + 172800000).toISOString(),
    homeScore: null,
    awayScore: null,
    userPrediction: null,
    status: 'upcoming',
    correctPredictions: 0,
    totalPredictions: 892,
  },
  {
    id: 'p3',
    homeTeam: 'Germany',
    awayTeam: 'Spain',
    homeFlag: '🇩🇪',
    awayFlag: '🇪🇸',
    matchDate: new Date(Date.now() - 86400000).toISOString(),
    homeScore: 2,
    awayScore: 1,
    userPrediction: null,
    status: 'finished',
    correctPredictions: 312,
    totalPredictions: 1089,
  },
];

const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', username: 'BrazilKing', teamFlag: '🇧🇷', teamName: 'Brazil', score: 12450, level: 25 },
  { rank: 2, userId: 'u2', username: 'TikiTaka', teamFlag: '🇪🇸', teamName: 'Spain', score: 11200, level: 23 },
  { rank: 3, userId: 'u3', username: 'DieManschaft', teamFlag: '🇩🇪', teamName: 'Germany', score: 10800, level: 21 },
  { rank: 4, userId: 'u4', username: 'LesBleus', teamFlag: '🇫🇷', teamName: 'France', score: 9750, level: 19 },
  { rank: 5, userId: 'u5', username: 'ThreeLions', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', teamName: 'England', score: 9200, level: 18 },
  { rank: 6, userId: 'u6', username: 'AzurriForever', teamFlag: '🇮🇹', teamName: 'Italy', score: 8900, level: 17 },
  { rank: 7, userId: 'u7', username: 'SambaStar', teamFlag: '🇧🇷', teamName: 'Brazil', score: 8400, level: 16 },
  { rank: 8, userId: 'u8', username: 'OrangeLion', teamFlag: '🇳🇱', teamName: 'Netherlands', score: 7800, level: 15 },
];

const SAMPLE_COMMENTS: Record<string, MatchComment[]> = {
  p1: [
    { id: 'c1', matchId: 'p1', authorName: 'SambaStar', authorTeam: 'Brazil', authorTeamFlag: '🇧🇷', authorLevel: 16, text: "Brazil's front three is just unstoppable right now. Vinicius Jr alone will cause nightmares.", likes: 47, createdAt: new Date(Date.now() - 7200000).toISOString(), userLiked: false },
    { id: 'c2', matchId: 'p1', authorName: 'LaAlbiceleste', authorTeam: 'Argentina', authorTeamFlag: '🇦🇷', authorLevel: 19, text: "Argentina have been incredible since the World Cup. Martinez in goal, De Paul in midfield.", likes: 39, createdAt: new Date(Date.now() - 5400000).toISOString(), userLiked: false },
  ],
  a3: [
    { id: 'wc1', matchId: 'a3', authorName: 'PulisicFan', authorTeam: 'USA', authorTeamFlag: '🇺🇸', authorLevel: 11, text: "PULISIC IS WORLD CLASS. USA holding Argentina 1-1 at the World Cup. This is history!", likes: 234, createdAt: new Date(Date.now() - 1200000).toISOString(), userLiked: false },
    { id: 'wc2', matchId: 'a3', authorName: 'ArgentinaUltra', authorTeam: 'Argentina', authorTeamFlag: '🇦🇷', authorLevel: 19, text: "Messi WILL score in the second half. He always comes up big. Don't panic yet.", likes: 156, createdAt: new Date(Date.now() - 800000).toISOString(), userLiked: false },
  ],
  b3: [
    { id: 'wc4', matchId: 'b3', authorName: 'SambaStar2', authorTeam: 'Brazil', authorTeamFlag: '🇧🇷', authorLevel: 20, text: "Rodrygo off the bench and scoring immediately. Brazil's squad depth is insane!", likes: 187, createdAt: new Date(Date.now() - 2000000).toISOString(), userLiked: false },
  ],
  d3: [
    { id: 'wc6', matchId: 'd3', authorName: 'ThreeLions', authorTeam: 'England', authorTeamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', authorLevel: 18, text: "Bellingham NEEDS to wake up. Saka is trying but getting doubled.", likes: 312, createdAt: new Date(Date.now() - 600000).toISOString(), userLiked: false },
  ],
};

const SAMPLE_GROUPS: Group[] = [
  { id: 'g1', name: 'Brazil Ultras Global', description: 'The biggest Brazil fan community. Unite all Seleção fans worldwide!', teamId: 'brazil', teamName: 'Brazil', teamFlag: '🇧🇷', coverImage: null, privacy: 'public', memberCount: 24800, createdBy: 'u1', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), tags: ['Brazil', 'Seleção', 'WorldCup'], isJoined: false },
  { id: 'g2', name: 'Tiki-Taka Masters', description: "Tactical analysis and deep dives into Spain's possession game.", teamId: 'spain', teamName: 'Spain', teamFlag: '🇪🇸', coverImage: null, privacy: 'public', memberCount: 18200, createdBy: 'u2', createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), tags: ['Spain', 'Tactics', 'LaRoja'], isJoined: false },
  { id: 'g3', name: 'Premier League Debate Club', description: 'All things England and Premier League. Hot takes welcome!', teamId: 'england', teamName: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', coverImage: null, privacy: 'public', memberCount: 15600, createdBy: 'u5', createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), tags: ['England', 'Premier League', 'ThreeLions'], isJoined: false },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(SAMPLE_GROUPS);
  const [debates, setDebates] = useState<DebatePost[]>(SAMPLE_DEBATES);
  const [predictions, setPredictions] = useState<Prediction[]>(SAMPLE_PREDICTIONS);
  const [comments, setComments] = useState<Record<string, MatchComment[]>>(SAMPLE_COMMENTS);
  const [onlineCount, setOnlineCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [coins, setCoins] = useState<number>(STARTING_COINS);
  const [bets, setBets] = useState<WCBet[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>(getDefaultMissions());
  const leaderboard = SAMPLE_LEADERBOARD;
  const nations = NATIONS_DATA;
  const currentWar = CURRENT_WAR;

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const sendRealTimeNotification = (data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    const notification: AppNotification = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      read: false,
      createdAt: new Date().toISOString(),
    };
    emitEvent('trigger_notification', notification);
  };

  useEffect(() => {
    fetchInitialData().then(({ tugScore }) => {
      console.log('[AppContext] Initial tug score from backend:', tugScore);
    });

    AsyncStorage.getItem(GROUPS_KEY).then((data) => {
      if (data) {
        try {
          const saved = JSON.parse(data) as Group[];
          setGroups([...SAMPLE_GROUPS, ...saved.filter(g => !SAMPLE_GROUPS.find(s => s.id === g.id))]);
        } catch {}
      }
    });

    AsyncStorage.getItem(DEBATES_KEY).then((data) => {
      if (data) {
        try {
          const saved = JSON.parse(data) as DebatePost[];
          setDebates([...SAMPLE_DEBATES, ...saved.filter(d => !SAMPLE_DEBATES.find(s => s.id === d.id))]);
        } catch {}
      }
    });

    AsyncStorage.getItem(COINS_KEY).then((data) => {
      if (data) {
        try { setCoins(JSON.parse(data)); } catch {}
      } else {
        AsyncStorage.setItem(COINS_KEY, JSON.stringify(STARTING_COINS));
      }
    });

    AsyncStorage.getItem(BETS_KEY).then((data) => {
      if (data) {
        try { setBets(JSON.parse(data)); } catch {}
      }
    });

    AsyncStorage.getItem(MISSIONS_KEY).then((data) => {
      if (data) {
        try {
          const saved = JSON.parse(data) as { date: string; missions: DailyMission[] };
          const today = new Date().toDateString();
          if (saved.date === today) {
            setMissions(saved.missions);
          } else {
            const fresh = getDefaultMissions();
            setMissions(fresh);
            AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify({ date: today, missions: fresh }));
          }
        } catch {}
      }
    });

    const socket = getSocket();

    socket.on('presence:update', ({ onlineCount: count }: { onlineCount: number }) => {
      setOnlineCount(count);
    });

    socket.on('debate:new', (debate: DebatePost) => {
      setDebates(prev => {
        if (prev.find(d => d.id === debate.id)) return prev;
        return [debate, ...prev];
      });
    });

    socket.on('debate:vote', ({ debateId, vote, upvotes, downvotes }: { debateId: string; vote: 'up' | 'down'; upvotes: number; downvotes: number }) => {
      setDebates(prev => prev.map(d =>
        d.id === debateId ? { ...d, upvotes, downvotes } : d
      ));
    });

    socket.on('comment:new', (comment: MatchComment) => {
      setComments(prev => {
        const existing = prev[comment.matchId] ?? [];
        if (existing.find(c => c.id === comment.id)) return prev;
        return { ...prev, [comment.matchId]: [comment, ...existing] };
      });
    });

    socket.on('comment:like', ({ matchId, commentId, likes }: { matchId: string; commentId: string; likes: number }) => {
      setComments(prev => ({
        ...prev,
        [matchId]: (prev[matchId] ?? []).map(c =>
          c.id === commentId ? { ...c, likes } : c
        ),
      }));
    });

    socket.on('group:memberUpdate', ({ groupId, delta }: { groupId: string; delta: number }) => {
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount + delta) } : g
      ));
    });

    socket.on('receive_notification', (notification: AppNotification) => {
      setNotifications(prev => {
        if (prev.find(n => n.id === notification.id)) return prev;
        return [{ ...notification, read: false }, ...prev];
      });
    });

    return () => {
      socket.off('presence:update');
      socket.off('debate:new');
      socket.off('debate:vote');
      socket.off('comment:new');
      socket.off('comment:like');
      socket.off('group:memberUpdate');
      socket.off('receive_notification');
    };
  }, []);

  const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'memberCount'>) => {
    const newGroup: Group = {
      ...groupData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      memberCount: 1,
      isJoined: true,
    };
    const updated = [newGroup, ...groups];
    setGroups(updated);
    const userGroups = updated.filter(g => !SAMPLE_GROUPS.find(s => s.id === g.id));
    await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(userGroups));
  };

  const joinGroup = (groupId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const joining = !g.isJoined;
      emitEvent('group:join', { groupId, delta: joining ? 1 : -1 });
      return { ...g, isJoined: joining, memberCount: joining ? g.memberCount + 1 : g.memberCount - 1 };
    }));
  };

  const leaveGroup = (groupId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      emitEvent('group:join', { groupId, delta: -1 });
      return { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) };
    }));
  };

  const addDebate = (debateData: Omit<DebatePost, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'commentCount'>) => {
    const newDebate: DebatePost = {
      ...debateData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    };
    const updated = [newDebate, ...debates];
    setDebates(updated);
    emitEvent('debate:new', newDebate);
    AsyncStorage.setItem(DEBATES_KEY, JSON.stringify(updated.filter(d => !SAMPLE_DEBATES.find(s => s.id === d.id))));
    setMissions(prev => prev.map(m => m.type === 'debate' && !m.completed ? { ...m, progress: Math.min(m.target, m.progress + 1), completed: m.progress + 1 >= m.target } : m));
  };

  const voteDebate = (debateId: string, vote: 'up' | 'down') => {
    setDebates(prev => prev.map(d => {
      if (d.id !== debateId) return d;
      const prev_vote = d.userVote;
      let upvotes = d.upvotes;
      let downvotes = d.downvotes;
      let userVote: 'up' | 'down' | null;
      if (prev_vote === vote) {
        userVote = null;
        if (vote === 'up') upvotes -= 1; else downvotes -= 1;
      } else {
        userVote = vote;
        if (vote === 'up') { upvotes += 1; if (prev_vote === 'down') downvotes -= 1; }
        else { downvotes += 1; if (prev_vote === 'up') upvotes -= 1; }
      }
      emitEvent('debate:vote', { debateId, vote: userVote, upvotes, downvotes });
      return { ...d, userVote, upvotes, downvotes };
    }));
    if (vote === 'up') {
      setMissions(prev => prev.map(m => m.type === 'vote' && !m.completed ? { ...m, progress: Math.min(m.target, m.progress + 1), completed: m.progress + 1 >= m.target } : m));
    }
  };

  const submitPrediction = (predictionId: string, home: number, away: number) => {
    setPredictions(prev => prev.map(p =>
      p.id === predictionId ? { ...p, userPrediction: { home, away } } : p
    ));
    emitEvent('prediction:submit', { predictionId, home, away });
    setMissions(prev => prev.map(m => m.type === 'predict' && !m.completed ? { ...m, progress: Math.min(m.target, m.progress + 1), completed: m.progress + 1 >= m.target } : m));
  };

  const addComment = (matchId: string, authorName: string, authorTeam: string, authorTeamFlag: string, authorLevel: number, text: string) => {
    const newComment: MatchComment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      matchId,
      authorName,
      authorTeam,
      authorTeamFlag,
      authorLevel,
      text,
      likes: 0,
      createdAt: new Date().toISOString(),
      userLiked: false,
    };
    setComments(prev => ({
      ...prev,
      [matchId]: [newComment, ...(prev[matchId] ?? [])],
    }));
    emitEvent('comment:new', newComment);
    setMissions(prev => prev.map(m => m.type === 'comment' && !m.completed ? { ...m, progress: Math.min(m.target, m.progress + 1), completed: m.progress + 1 >= m.target } : m));
  };

  const likeComment = (matchId: string, commentId: string) => {
    setComments(prev => {
      const updated = {
        ...prev,
        [matchId]: (prev[matchId] ?? []).map(c => {
          if (c.id !== commentId) return c;
          const likes = c.userLiked ? c.likes - 1 : c.likes + 1;
          emitEvent('comment:like', { matchId, commentId, likes });
          return { ...c, likes, userLiked: !c.userLiked };
        }),
      };
      return updated;
    });
  };

  const placeBet = (match: WCMatch, betType: BetType, amount: number): boolean => {
    if (amount <= 0 || amount > coins) return false;
    const alreadyBet = bets.find(b => b.matchId === match.id && b.status === 'pending');
    if (alreadyBet) return false;
    const odds = betType === 'home' ? match.odds.home : betType === 'draw' ? match.odds.draw : match.odds.away;
    const newBet: WCBet = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      matchId: match.id,
      matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      betType,
      amount,
      odds,
      potentialWin: Math.round(amount * odds),
      status: 'pending',
      placedAt: new Date().toISOString(),
    };
    const newCoins = coins - amount;
    const newBets = [newBet, ...bets];
    setCoins(newCoins);
    setBets(newBets);
    AsyncStorage.setItem(COINS_KEY, JSON.stringify(newCoins));
    AsyncStorage.setItem(BETS_KEY, JSON.stringify(newBets));
    emitEvent('prediction:submit', { matchId: match.id, betType, amount });
    return true;
  };

  const completeMission = (missionId: string) => {
    setMissions(prev => {
      const updated = prev.map(m => m.id === missionId ? { ...m, completed: true, progress: m.target } : m);
      const today = new Date().toDateString();
      AsyncStorage.setItem(MISSIONS_KEY, JSON.stringify({ date: today, missions: updated }));
      return updated;
    });
  };

  const value = useMemo(() => ({
    groups, debates, predictions, leaderboard, comments, onlineCount,
    notifications, unreadCount, coins, bets, missions, currentWar, nations,
    markAllRead, sendRealTimeNotification,
    createGroup, joinGroup, leaveGroup, addDebate, voteDebate, submitPrediction,
    addComment, likeComment, placeBet, completeMission,
  }), [groups, debates, predictions, comments, onlineCount, notifications, coins, bets, missions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
