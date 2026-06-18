import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, emitEvent } from '../utils/socket';
import { fetchInitialData } from '../utils/api';
import type { WCMatch } from '../data/worldcup2026';

export interface AppNotification {
  id: string;
  type: 'vote' | 'debate' | 'prediction' | 'comment' | 'group' | 'bet_won' | 'bet_lost';
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
}

const AppContext = createContext<AppContextValue | null>(null);

const GROUPS_KEY = 'fanverse_groups';
const DEBATES_KEY = 'fanverse_debates';
const COINS_KEY = 'fanverse_coins';
const BETS_KEY = 'fanverse_bets';

const STARTING_COINS = 1000;

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
  },
  {
    id: 'd5',
    authorId: 'u5',
    authorName: 'FrenchFan',
    authorTeam: 'France',
    authorTeamFlag: '🇫🇷',
    authorLevel: 17,
    title: '🇫🇷 France vs Belgium INCOMING — the match of the group stage?',
    content: "Two WC winners, two Golden Ball contenders, one group. Mbappé vs De Bruyne. Camavinga vs Tielemans. This could be the greatest group stage match in WC history.",
    upvotes: 923,
    downvotes: 101,
    commentCount: 421,
    tags: ['France', 'Belgium', 'WorldCup2026'],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    userVote: null,
    matchId: 'c3',
  },
  {
    id: 'd6',
    authorId: 'u6',
    authorName: 'IbericaFan',
    authorTeam: 'Portugal',
    authorTeamFlag: '🇵🇹',
    authorLevel: 14,
    title: '🇵🇹 Portugal vs 🇪🇸 Spain — Ronaldo vs Yamal, who wins the Iberian Derby?',
    content: "Spain drew their opener, Portugal won 4-1. Ronaldo has 2 goals already. Yamal looked shaky. Lisbon vs Madrid rivalry about to play out on the biggest stage.",
    upvotes: 1567,
    downvotes: 234,
    commentCount: 678,
    tags: ['Portugal', 'Spain', 'WorldCup2026', 'IberianDerby'],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    userVote: null,
    matchId: 'f3',
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
    { id: 'c1', matchId: 'p1', authorName: 'SambaStar', authorTeam: 'Brazil', authorTeamFlag: '🇧🇷', authorLevel: 16, text: "Brazil's front three is just unstoppable right now. Vinicius Jr alone will cause nightmares for the Argentina defence. Easy 2-0.", likes: 47, createdAt: new Date(Date.now() - 7200000).toISOString(), userLiked: false },
    { id: 'c2', matchId: 'p1', authorName: 'LaAlbiceleste', authorTeam: 'Argentina', authorTeamFlag: '🇦🇷', authorLevel: 19, text: "Argentina have been incredible since the World Cup. Martinez in goal, De Paul in midfield — this is a completely different team. Don't sleep on them.", likes: 39, createdAt: new Date(Date.now() - 5400000).toISOString(), userLiked: false },
  ],
  a3: [
    { id: 'wc1', matchId: 'a3', authorName: 'PulisicFan', authorTeam: 'USA', authorTeamFlag: '🇺🇸', authorLevel: 11, text: "PULISIC IS WORLD CLASS. USA holding Argentina 1-1 at the World Cup. This is history being made.", likes: 234, createdAt: new Date(Date.now() - 1200000).toISOString(), userLiked: false },
    { id: 'wc2', matchId: 'a3', authorName: 'ArgentinaUltra', authorTeam: 'Argentina', authorTeamFlag: '🇦🇷', authorLevel: 19, text: "Messi WILL score in the second half. He always comes up big. Don't panic yet.", likes: 156, createdAt: new Date(Date.now() - 800000).toISOString(), userLiked: false },
    { id: 'wc3', matchId: 'a3', authorName: 'NeutralObserver', authorTeam: 'Germany', authorTeamFlag: '🇩🇪', authorLevel: 14, text: "This is the best advertisement for the 48-team World Cup. More teams, more upsets, more drama. AMAZING.", likes: 89, createdAt: new Date(Date.now() - 400000).toISOString(), userLiked: false },
  ],
  b3: [
    { id: 'wc4', matchId: 'b3', authorName: 'SambaStar2', authorTeam: 'Brazil', authorTeamFlag: '🇧🇷', authorLevel: 20, text: "Rodrygo coming off the bench and scoring immediately. Brazil's squad depth is insane. 2-1!", likes: 187, createdAt: new Date(Date.now() - 2000000).toISOString(), userLiked: false },
    { id: 'wc5', matchId: 'b3', authorName: 'ColombiaFan', authorTeam: 'Colombia', authorTeamFlag: '🇨🇴', authorLevel: 13, text: "Colombia are giving Brazil a proper game here. Díaz has been phenomenal. Not going down without a fight!", likes: 124, createdAt: new Date(Date.now() - 1500000).toISOString(), userLiked: false },
  ],
  d3: [
    { id: 'wc6', matchId: 'd3', authorName: 'ThreeLions', authorTeam: 'England', authorTeamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', authorLevel: 18, text: "Bellingham NEEDS to wake up. Saka is trying but getting doubled. We have to break this down!", likes: 312, createdAt: new Date(Date.now() - 600000).toISOString(), userLiked: false },
    { id: 'wc7', matchId: 'd3', authorName: 'LionsDen99', authorTeam: 'Senegal', authorTeamFlag: '🇸🇳', authorLevel: 16, text: "Senegal's defensive shape is absolutely immaculate. Édouard Mendy has been a wall. Holding for the 3 points!", likes: 198, createdAt: new Date(Date.now() - 300000).toISOString(), userLiked: false },
  ],
};

const SAMPLE_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Brazil Ultras Global',
    description: 'The biggest Brazil fan community. Unite all Seleção fans worldwide!',
    teamId: 'brazil',
    teamName: 'Brazil',
    teamFlag: '🇧🇷',
    coverImage: null,
    privacy: 'public',
    memberCount: 24800,
    createdBy: 'u1',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    tags: ['Brazil', 'Seleção', 'WorldCup'],
    isJoined: false,
  },
  {
    id: 'g2',
    name: 'Tiki-Taka Masters',
    description: "Tactical analysis and deep dives into Spain's possession game.",
    teamId: 'spain',
    teamName: 'Spain',
    teamFlag: '🇪🇸',
    coverImage: null,
    privacy: 'public',
    memberCount: 18200,
    createdBy: 'u2',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    tags: ['Spain', 'Tactics', 'LaRoja'],
    isJoined: false,
  },
  {
    id: 'g3',
    name: 'Premier League Debate Club',
    description: 'All things England and Premier League. Hot takes welcome!',
    teamId: 'england',
    teamName: 'England',
    teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    coverImage: null,
    privacy: 'public',
    memberCount: 15600,
    createdBy: 'u5',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    tags: ['England', 'Premier League', 'ThreeLions'],
    isJoined: false,
  },
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
  const leaderboard = SAMPLE_LEADERBOARD;

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
  };

  const submitPrediction = (predictionId: string, home: number, away: number) => {
    setPredictions(prev => prev.map(p =>
      p.id === predictionId ? { ...p, userPrediction: { home, away } } : p
    ));
    emitEvent('prediction:submit', { predictionId, home, away });
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

  const value = useMemo(() => ({
    groups, debates, predictions, leaderboard, comments, onlineCount,
    notifications, unreadCount, coins, bets,
    markAllRead, sendRealTimeNotification,
    createGroup, joinGroup, leaveGroup, addDebate, voteDebate, submitPrediction,
    addComment, likeComment, placeBet,
  }), [groups, debates, predictions, comments, onlineCount, notifications, coins, bets]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
