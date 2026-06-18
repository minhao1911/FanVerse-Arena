import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface AppContextValue {
  groups: Group[];
  debates: DebatePost[];
  predictions: Prediction[];
  leaderboard: LeaderboardEntry[];
  comments: Record<string, MatchComment[]>;
  createGroup: (group: Omit<Group, 'id' | 'createdAt' | 'memberCount'>) => Promise<void>;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  addDebate: (debate: Omit<DebatePost, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'commentCount'>) => void;
  voteDebate: (debateId: string, vote: 'up' | 'down') => void;
  submitPrediction: (predictionId: string, home: number, away: number) => void;
  addComment: (matchId: string, authorName: string, authorTeam: string, authorTeamFlag: string, authorLevel: number, text: string) => void;
  likeComment: (matchId: string, commentId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const GROUPS_KEY = 'fanverse_groups';
const DEBATES_KEY = 'fanverse_debates';

const SAMPLE_DEBATES: DebatePost[] = [
  {
    id: 'd1',
    authorId: 'u1',
    authorName: 'BrazilKing',
    authorTeam: 'Brazil',
    authorTeamFlag: '🇧🇷',
    authorLevel: 12,
    title: 'Brazil vs Argentina: Who has the better squad depth?',
    content: 'Looking at the current form and bench strength, Brazil clearly has the edge with multiple world-class players in every position.',
    upvotes: 247,
    downvotes: 89,
    commentCount: 143,
    tags: ['Brazil', 'Argentina', 'CONMEBOL'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    userVote: null,
  },
  {
    id: 'd2',
    authorId: 'u2',
    authorName: 'EaglesFan99',
    authorTeam: 'Germany',
    authorTeamFlag: '🇩🇪',
    authorLevel: 8,
    title: "Germany's pressing game is unmatched in Euro 2024",
    content: "The high press system Nagelsmann implemented has transformed this squad. No team in Europe can match their intensity.",
    upvotes: 312,
    downvotes: 54,
    commentCount: 201,
    tags: ['Germany', 'Euro2024', 'Tactics'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    userVote: null,
  },
  {
    id: 'd3',
    authorId: 'u3',
    authorName: 'LionsFan',
    authorTeam: 'England',
    authorTeamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    authorLevel: 5,
    title: 'England finally has a world-class goalkeeper generation',
    content: 'With Pickford, Ramsdale, and Flekken all competing for the starting spot, England has never had such depth in goal.',
    upvotes: 178,
    downvotes: 67,
    commentCount: 89,
    tags: ['England', 'Goalkeeper', 'WorldClass'],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    userVote: null,
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
    { id: 'c3', matchId: 'p1', authorName: 'TacticalEye', authorTeam: 'France', authorTeamFlag: '🇫🇷', authorLevel: 18, text: "This is literally the El Clasico of international football. Both teams at peak form — I'm calling 2-2 draw after extra time drama.", likes: 62, createdAt: new Date(Date.now() - 3600000).toISOString(), userLiked: false },
    { id: 'c4', matchId: 'p1', authorName: 'OracleFC', authorTeam: 'Brazil', authorTeamFlag: '🇧🇷', authorLevel: 22, text: "Stats don't lie: Brazil win 52% of head-to-head meetings in competitive fixtures. Home advantage seals it.", likes: 28, createdAt: new Date(Date.now() - 1800000).toISOString(), userLiked: false },
  ],
  p2: [
    { id: 'c5', matchId: 'p2', authorName: 'LesBleus', authorTeam: 'France', authorTeamFlag: '🇫🇷', authorLevel: 19, text: "France's midfield depth is genuinely frightening. Tchouaméni, Camavinga, Rabiot all fighting for spots. England won't cope.", likes: 54, createdAt: new Date(Date.now() - 9000000).toISOString(), userLiked: false },
    { id: 'c6', matchId: 'p2', authorName: 'ThreeLions', authorTeam: 'England', authorTeamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', authorLevel: 18, text: "Bellingham is on another level this season. If he turns up, England can beat anyone. It's coming home, mark my words.", likes: 71, createdAt: new Date(Date.now() - 7200000).toISOString(), userLiked: false },
    { id: 'c7', matchId: 'p2', authorName: 'StatGuru99', authorTeam: 'Germany', authorTeamFlag: '🇩🇪', authorLevel: 20, text: "Historical record: France lead this fixture 19-17 across all-time. But England at Wembley is a fortress — different story at home.", likes: 33, createdAt: new Date(Date.now() - 3600000).toISOString(), userLiked: false },
  ],
  p3: [
    { id: 'c8', matchId: 'p3', authorName: 'DieManschaft', authorTeam: 'Germany', authorTeamFlag: '🇩🇪', authorLevel: 21, text: "Germany were absolutely clinical! Müller's movement, Wirtz's creativity — Nagelsmann has built something special here. Deserved 2-1.", likes: 88, createdAt: new Date(Date.now() - 172800000).toISOString(), userLiked: false },
    { id: 'c9', matchId: 'p3', authorName: 'TikiTaka', authorTeam: 'Spain', authorTeamFlag: '🇪🇸', authorLevel: 23, text: "Spain dominated possession 64-36 and still lost. Football is cruel. Yamal was brilliant though — the future is in safe hands.", likes: 65, createdAt: new Date(Date.now() - 170000000).toISOString(), userLiked: false },
    { id: 'c10', matchId: 'p3', authorName: 'BrazilKing', authorTeam: 'Brazil', authorTeamFlag: '🇧🇷', authorLevel: 25, text: "Germany's press is unreal. Spain's build-up play was constantly disrupted. A tactical masterclass from Nagelsmann.", likes: 52, createdAt: new Date(Date.now() - 168000000).toISOString(), userLiked: false },
    { id: 'c11', matchId: 'p3', authorName: 'ScoreProphet', authorTeam: 'Spain', authorTeamFlag: '🇪🇸', authorLevel: 19, text: "I predicted 2-1 Germany! Collected 450 XP on that one. Told everyone Germany's counter-press would be the difference.", likes: 41, createdAt: new Date(Date.now() - 165000000).toISOString(), userLiked: false },
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
  const leaderboard = SAMPLE_LEADERBOARD;

  useEffect(() => {
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
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, isJoined: !g.isJoined, memberCount: g.isJoined ? g.memberCount - 1 : g.memberCount + 1 } : g
    ));
  };

  const leaveGroup = (groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) } : g
    ));
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
    AsyncStorage.setItem(DEBATES_KEY, JSON.stringify(updated.filter(d => !SAMPLE_DEBATES.find(s => s.id === d.id))));
  };

  const voteDebate = (debateId: string, vote: 'up' | 'down') => {
    setDebates(prev => prev.map(d => {
      if (d.id !== debateId) return d;
      const prev_vote = d.userVote;
      if (prev_vote === vote) return { ...d, userVote: null, upvotes: vote === 'up' ? d.upvotes - 1 : d.upvotes, downvotes: vote === 'down' ? d.downvotes - 1 : d.downvotes };
      return {
        ...d,
        userVote: vote,
        upvotes: vote === 'up' ? d.upvotes + 1 : (prev_vote === 'up' ? d.upvotes - 1 : d.upvotes),
        downvotes: vote === 'down' ? d.downvotes + 1 : (prev_vote === 'down' ? d.downvotes - 1 : d.downvotes),
      };
    }));
  };

  const submitPrediction = (predictionId: string, home: number, away: number) => {
    setPredictions(prev => prev.map(p =>
      p.id === predictionId ? { ...p, userPrediction: { home, away } } : p
    ));
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
  };

  const likeComment = (matchId: string, commentId: string) => {
    setComments(prev => ({
      ...prev,
      [matchId]: (prev[matchId] ?? []).map(c =>
        c.id === commentId
          ? { ...c, likes: c.userLiked ? c.likes - 1 : c.likes + 1, userLiked: !c.userLiked }
          : c
      ),
    }));
  };

  const value = useMemo(() => ({
    groups, debates, predictions, leaderboard, comments,
    createGroup, joinGroup, leaveGroup, addDebate, voteDebate, submitPrediction, addComment, likeComment,
  }), [groups, debates, predictions, comments]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
