export interface WCTeam {
  id: string;
  name: string;
  flag: string;
  confederation: string;
}

export interface WCStanding {
  team: WCTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface WCGroup {
  id: string;
  name: string;
  standings: WCStanding[];
}

export interface WCBetOdds {
  home: number;
  draw: number;
  away: number;
}

export interface WCMatch {
  id: string;
  groupId: string;
  groupName: string;
  matchday: number;
  homeTeam: WCTeam;
  awayTeam: WCTeam;
  kickoff: string;
  venue: string;
  city: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
  minute?: number;
  odds: WCBetOdds;
  debateCount: number;
  betsCount: number;
}

const d = (offset: number, hour = 20, min = 0) => {
  const base = new Date('2026-06-11T00:00:00');
  base.setDate(base.getDate() + offset);
  base.setHours(hour, min, 0, 0);
  return base.toISOString();
};

export const WC_GROUPS: WCGroup[] = [
  {
    id: 'A',
    name: 'Group A',
    standings: [
      { team: { id: 'usa', name: 'USA', flag: '🇺🇸', confederation: 'CONCACAF' }, played: 2, won: 1, drawn: 1, lost: 0, gf: 3, ga: 1, gd: 2, points: 4 },
      { team: { id: 'argentina', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL' }, played: 2, won: 1, drawn: 1, lost: 0, gf: 4, ga: 2, gd: 2, points: 4 },
      { team: { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', confederation: 'CAF' }, played: 2, won: 1, drawn: 0, lost: 1, gf: 2, ga: 3, gd: -1, points: 3 },
      { team: { id: 'newzealand', name: 'New Zealand', flag: '🇳🇿', confederation: 'OFC' }, played: 2, won: 0, drawn: 0, lost: 2, gf: 1, ga: 4, gd: -3, points: 0 },
    ],
  },
  {
    id: 'B',
    name: 'Group B',
    standings: [
      { team: { id: 'brazil', name: 'Brazil', flag: '🇧🇷', confederation: 'CONMEBOL' }, played: 2, won: 2, drawn: 0, lost: 0, gf: 5, ga: 1, gd: 4, points: 6 },
      { team: { id: 'colombia', name: 'Colombia', flag: '🇨🇴', confederation: 'CONMEBOL' }, played: 2, won: 1, drawn: 0, lost: 1, gf: 3, ga: 3, gd: 0, points: 3 },
      { team: { id: 'japan', name: 'Japan', flag: '🇯🇵', confederation: 'AFC' }, played: 2, won: 0, drawn: 1, lost: 1, gf: 2, ga: 4, gd: -2, points: 1 },
      { team: { id: 'ivory_coast', name: 'Ivory Coast', flag: '🇨🇮', confederation: 'CAF' }, played: 2, won: 0, drawn: 1, lost: 1, gf: 1, ga: 3, gd: -2, points: 1 },
    ],
  },
  {
    id: 'C',
    name: 'Group C',
    standings: [
      { team: { id: 'france', name: 'France', flag: '🇫🇷', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 0, gd: 3, points: 3 },
      { team: { id: 'belgium', name: 'Belgium', flag: '🇧🇪', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 1, gd: 1, points: 3 },
      { team: { id: 'mexico', name: 'Mexico', flag: '🇲🇽', confederation: 'CONCACAF' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 2, gd: -1, points: 0 },
      { team: { id: 'indonesia', name: 'Indonesia', flag: '🇮🇩', confederation: 'AFC' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 3, gd: -3, points: 0 },
    ],
  },
  {
    id: 'D',
    name: 'Group D',
    standings: [
      { team: { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 1, gd: 2, points: 3 },
      { team: { id: 'senegal', name: 'Senegal', flag: '🇸🇳', confederation: 'CAF' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 0, gd: 2, points: 3 },
      { team: { id: 'slovakia', name: 'Slovakia', flag: '🇸🇰', confederation: 'UEFA' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 2, gd: -2, points: 0 },
      { team: { id: 'canada', name: 'Canada', flag: '🇨🇦', confederation: 'CONCACAF' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, points: 0 },
    ],
  },
  {
    id: 'E',
    name: 'Group E',
    standings: [
      { team: { id: 'germany', name: 'Germany', flag: '🇩🇪', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 4, ga: 0, gd: 4, points: 3 },
      { team: { id: 'netherlands', name: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 1, gd: 2, points: 3 },
      { team: { id: 'chile', name: 'Chile', flag: '🇨🇱', confederation: 'CONMEBOL' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, points: 0 },
      { team: { id: 'iran', name: 'IR Iran', flag: '🇮🇷', confederation: 'AFC' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 4, gd: -4, points: 0 },
    ],
  },
  {
    id: 'F',
    name: 'Group F',
    standings: [
      { team: { id: 'portugal', name: 'Portugal', flag: '🇵🇹', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 4, ga: 1, gd: 3, points: 3 },
      { team: { id: 'south_korea', name: 'South Korea', flag: '🇰🇷', confederation: 'AFC' }, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1 },
      { team: { id: 'spain', name: 'Spain', flag: '🇪🇸', confederation: 'UEFA' }, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1 },
      { team: { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨', confederation: 'CONMEBOL' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 4, gd: -3, points: 0 },
    ],
  },
  {
    id: 'G',
    name: 'Group G',
    standings: [
      { team: { id: 'morocco', name: 'Morocco', flag: '🇲🇦', confederation: 'CAF' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 0, gd: 2, points: 3 },
      { team: { id: 'croatia', name: 'Croatia', flag: '🇭🇷', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 1, gd: 2, points: 3 },
      { team: { id: 'ukraine', name: 'Ukraine', flag: '🇺🇦', confederation: 'UEFA' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 2, gd: -2, points: 0 },
      { team: { id: 'peru', name: 'Peru', flag: '🇵🇪', confederation: 'CONMEBOL' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, points: 0 },
    ],
  },
  {
    id: 'H',
    name: 'Group H',
    standings: [
      { team: { id: 'italy', name: 'Italy', flag: '🇮🇹', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 0, gd: 2, points: 3 },
      { team: { id: 'australia', name: 'Australia', flag: '🇦🇺', confederation: 'AFC' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 2, gd: 1, points: 3 },
      { team: { id: 'ghana', name: 'Ghana', flag: '🇬🇭', confederation: 'CAF' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 2, ga: 3, gd: -1, points: 0 },
      { team: { id: 'switzerland', name: 'Switzerland', flag: '🇨🇭', confederation: 'UEFA' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 2, gd: -2, points: 0 },
    ],
  },
  {
    id: 'I',
    name: 'Group I',
    standings: [
      { team: { id: 'uruguay', name: 'Uruguay', flag: '🇺🇾', confederation: 'CONMEBOL' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 0, gd: 3, points: 3 },
      { team: { id: 'saudi_arabia', name: 'Saudi Arabia', flag: '🇸🇦', confederation: 'AFC' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 1, gd: 1, points: 3 },
      { team: { id: 'poland', name: 'Poland', flag: '🇵🇱', confederation: 'UEFA' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 2, gd: -1, points: 0 },
      { team: { id: 'panama', name: 'Panama', flag: '🇵🇦', confederation: 'CONCACAF' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 3, gd: -3, points: 0 },
    ],
  },
  {
    id: 'J',
    name: 'Group J',
    standings: [
      { team: { id: 'denmark', name: 'Denmark', flag: '🇩🇰', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 1, gd: 2, points: 3 },
      { team: { id: 'serbia', name: 'Serbia', flag: '🇷🇸', confederation: 'UEFA' }, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1 },
      { team: { id: 'egypt', name: 'Egypt', flag: '🇪🇬', confederation: 'CAF' }, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1 },
      { team: { id: 'venezuela', name: 'Venezuela', flag: '🇻🇪', confederation: 'CONMEBOL' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 3, gd: -2, points: 0 },
    ],
  },
  {
    id: 'K',
    name: 'Group K',
    standings: [
      { team: { id: 'turkey', name: 'Turkey', flag: '🇹🇷', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 3, ga: 0, gd: 3, points: 3 },
      { team: { id: 'austria', name: 'Austria', flag: '🇦🇹', confederation: 'UEFA' }, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 1, gd: 1, points: 3 },
      { team: { id: 'senegal2', name: 'Cameroon', flag: '🇨🇲', confederation: 'CAF' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 2, gd: -1, points: 0 },
      { team: { id: 'bolivia', name: 'Bolivia', flag: '🇧🇴', confederation: 'CONMEBOL' }, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 3, gd: -3, points: 0 },
    ],
  },
  {
    id: 'L',
    name: 'Group L',
    standings: [
      { team: { id: 'ukraine2', name: 'Romania', flag: '🇷🇴', confederation: 'UEFA' }, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1 },
      { team: { id: 'south_africa', name: 'South Africa', flag: '🇿🇦', confederation: 'CAF' }, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1 },
      { team: { id: 'honduras', name: 'Honduras', flag: '🇭🇳', confederation: 'CONCACAF' }, played: 1, won: 0, drawn: 1, lost: 0, gf: 2, ga: 2, gd: 0, points: 1 },
      { team: { id: 'iraq', name: 'Iraq', flag: '🇮🇶', confederation: 'AFC' }, played: 1, won: 0, drawn: 1, lost: 0, gf: 2, ga: 2, gd: 0, points: 1 },
    ],
  },
];

export const WC_MATCHES: WCMatch[] = [
  // ─── GROUP A ───────────────────────────────────────
  {
    id: 'a1', groupId: 'A', groupName: 'Group A', matchday: 1,
    homeTeam: { id: 'usa', name: 'USA', flag: '🇺🇸', confederation: 'CONCACAF' },
    awayTeam: { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', confederation: 'CAF' },
    kickoff: d(0, 21), venue: 'MetLife Stadium', city: 'New York',
    status: 'finished', homeScore: 2, awayScore: 1,
    odds: { home: 1.70, draw: 3.50, away: 4.80 },
    debateCount: 312, betsCount: 5240,
  },
  {
    id: 'a2', groupId: 'A', groupName: 'Group A', matchday: 1,
    homeTeam: { id: 'argentina', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL' },
    awayTeam: { id: 'newzealand', name: 'New Zealand', flag: '🇳🇿', confederation: 'OFC' },
    kickoff: d(0, 18), venue: 'AT&T Stadium', city: 'Dallas',
    status: 'finished', homeScore: 3, awayScore: 0,
    odds: { home: 1.20, draw: 7.00, away: 14.00 },
    debateCount: 489, betsCount: 8910,
  },
  {
    id: 'a3', groupId: 'A', groupName: 'Group A', matchday: 2,
    homeTeam: { id: 'usa', name: 'USA', flag: '🇺🇸', confederation: 'CONCACAF' },
    awayTeam: { id: 'argentina', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL' },
    kickoff: d(7, 21), venue: 'MetLife Stadium', city: 'New York',
    status: 'live', homeScore: 1, awayScore: 1, minute: 67,
    odds: { home: 3.20, draw: 3.10, away: 2.10 },
    debateCount: 742, betsCount: 14320,
  },
  {
    id: 'a4', groupId: 'A', groupName: 'Group A', matchday: 2,
    homeTeam: { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', confederation: 'CAF' },
    awayTeam: { id: 'newzealand', name: 'New Zealand', flag: '🇳🇿', confederation: 'OFC' },
    kickoff: d(7, 18), venue: 'Rose Bowl', city: 'Los Angeles',
    status: 'finished', homeScore: 1, awayScore: 1,
    odds: { home: 1.60, draw: 3.60, away: 5.50 },
    debateCount: 128, betsCount: 2100,
  },
  {
    id: 'a5', groupId: 'A', groupName: 'Group A', matchday: 3,
    homeTeam: { id: 'argentina', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL' },
    awayTeam: { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', confederation: 'CAF' },
    kickoff: d(14, 20), venue: 'SoFi Stadium', city: 'Los Angeles',
    status: 'upcoming', homeScore: null, awayScore: null,
    odds: { home: 1.45, draw: 4.00, away: 7.00 },
    debateCount: 201, betsCount: 3890,
  },
  {
    id: 'a6', groupId: 'A', groupName: 'Group A', matchday: 3,
    homeTeam: { id: 'newzealand', name: 'New Zealand', flag: '🇳🇿', confederation: 'OFC' },
    awayTeam: { id: 'usa', name: 'USA', flag: '🇺🇸', confederation: 'CONCACAF' },
    kickoff: d(14, 20), venue: 'Levi\'s Stadium', city: 'San Francisco',
    status: 'upcoming', homeScore: null, awayScore: null,
    odds: { home: 5.50, draw: 3.80, away: 1.55 },
    debateCount: 89, betsCount: 1240,
  },

  // ─── GROUP B ───────────────────────────────────────
  {
    id: 'b1', groupId: 'B', groupName: 'Group B', matchday: 1,
    homeTeam: { id: 'brazil', name: 'Brazil', flag: '🇧🇷', confederation: 'CONMEBOL' },
    awayTeam: { id: 'ivory_coast', name: 'Ivory Coast', flag: '🇨🇮', confederation: 'CAF' },
    kickoff: d(1, 21), venue: 'Levi\'s Stadium', city: 'San Francisco',
    status: 'finished', homeScore: 3, awayScore: 0,
    odds: { home: 1.35, draw: 4.50, away: 8.00 },
    debateCount: 567, betsCount: 10240,
  },
  {
    id: 'b2', groupId: 'B', groupName: 'Group B', matchday: 1,
    homeTeam: { id: 'colombia', name: 'Colombia', flag: '🇨🇴', confederation: 'CONMEBOL' },
    awayTeam: { id: 'japan', name: 'Japan', flag: '🇯🇵', confederation: 'AFC' },
    kickoff: d(1, 18), venue: 'Hard Rock Stadium', city: 'Miami',
    status: 'finished', homeScore: 2, awayScore: 2,
    odds: { home: 2.10, draw: 3.10, away: 3.40 },
    debateCount: 298, betsCount: 4890,
  },
  {
    id: 'b3', groupId: 'B', groupName: 'Group B', matchday: 2,
    homeTeam: { id: 'brazil', name: 'Brazil', flag: '🇧🇷', confederation: 'CONMEBOL' },
    awayTeam: { id: 'colombia', name: 'Colombia', flag: '🇨🇴', confederation: 'CONMEBOL' },
    kickoff: d(5, 21), venue: 'MetLife Stadium', city: 'New York',
    status: 'live', homeScore: 2, awayScore: 1, minute: 74,
    odds: { home: 1.55, draw: 3.60, away: 5.50 },
    debateCount: 891, betsCount: 18750,
  },
  {
    id: 'b4', groupId: 'B', groupName: 'Group B', matchday: 2,
    homeTeam: { id: 'ivory_coast', name: 'Ivory Coast', flag: '🇨🇮', confederation: 'CAF' },
    awayTeam: { id: 'japan', name: 'Japan', flag: '🇯🇵', confederation: 'AFC' },
    kickoff: d(6, 18), venue: 'Rose Bowl', city: 'Los Angeles',
    status: 'finished', homeScore: 1, awayScore: 1,
    odds: { home: 2.20, draw: 3.00, away: 3.10 },
    debateCount: 187, betsCount: 2980,
  },
  {
    id: 'b5', groupId: 'B', groupName: 'Group B', matchday: 3,
    homeTeam: { id: 'brazil', name: 'Brazil', flag: '🇧🇷', confederation: 'CONMEBOL' },
    awayTeam: { id: 'japan', name: 'Japan', flag: '🇯🇵', confederation: 'AFC' },
    kickoff: d(13, 20), venue: 'SoFi Stadium', city: 'Los Angeles',
    status: 'upcoming', homeScore: null, awayScore: null,
    odds: { home: 1.25, draw: 5.50, away: 10.00 },
    debateCount: 445, betsCount: 7200,
  },
  {
    id: 'b6', groupId: 'B', groupName: 'Group B', matchday: 3,
    homeTeam: { id: 'colombia', name: 'Colombia', flag: '🇨🇴', confederation: 'CONMEBOL' },
    awayTeam: { id: 'ivory_coast', name: 'Ivory Coast', flag: '🇨🇮', confederation: 'CAF' },
    kickoff: d(13, 20), venue: 'AT&T Stadium', city: 'Dallas',
    status: 'upcoming', homeScore: null, awayScore: null,
    odds: { home: 1.90, draw: 3.20, away: 4.10 },
    debateCount: 178, betsCount: 2800,
  },

  // ─── GROUP C ───────────────────────────────────────
  {
    id: 'c1', groupId: 'C', groupName: 'Group C', matchday: 1,
    homeTeam: { id: 'france', name: 'France', flag: '🇫🇷', confederation: 'UEFA' },
    awayTeam: { id: 'indonesia', name: 'Indonesia', flag: '🇮🇩', confederation: 'AFC' },
    kickoff: d(2, 21), venue: 'AT&T Stadium', city: 'Dallas',
    status: 'finished', homeScore: 3, awayScore: 0,
    odds: { home: 1.18, draw: 7.50, away: 15.00 },
    debateCount: 421, betsCount: 8730,
  },
  {
    id: 'c2', groupId: 'C', groupName: 'Group C', matchday: 1,
    homeTeam: { id: 'belgium', name: 'Belgium', flag: '🇧🇪', confederation: 'UEFA' },
    awayTeam: { id: 'mexico', name: 'Mexico', flag: '🇲🇽', confederation: 'CONCACAF' },
    kickoff: d(2, 18), venue: 'Rose Bowl', city: 'Los Angeles',
    status: 'finished', homeScore: 2, awayScore: 1,
    odds: { home: 1.75, draw: 3.30, away: 4.50 },
    debateCount: 356, betsCount: 6410,
  },
  {
    id: 'c3', groupId: 'C', groupName: 'Group C', matchday: 2,
    homeTeam: { id: 'france', name: 'France', flag: '🇫🇷', confederation: 'UEFA' },
    awayTeam: { id: 'belgium', name: 'Belgium', flag: '🇧🇪', confederation: 'UEFA' },
    kickoff: d(7, 23), venue: 'SoFi Stadium', city: 'Los Angeles',
    status: 'upcoming', homeScore: null, awayScore: null,
    odds: { home: 1.95, draw: 3.40, away: 3.90 },
    debateCount: 634, betsCount: 12400,
  },
  {
    id: 'c4', groupId: 'C', groupName: 'Group C', matchday: 2,
    homeTeam: { id: 'mexico', name: 'Mexico', flag: '🇲🇽', confederation: 'CONCACAF' },
    awayTeam: { id: 'indonesia', name: 'Indonesia', flag: '🇮🇩', confederation: 'AFC' },
    kickoff: d(8, 18), venue: 'Levi\'s Stadium', city: 'San Francisco',
    status: 'upcoming', homeScore: null, awayScore: null,
    odds: { home: 1.40, draw: 4.00, away: 8.00 },
    debateCount: 189, betsCount: 3100,
  },

  // ─── GROUP D ───────────────────────────────────────
  {
    id: 'd1', groupId: 'D', groupName: 'Group D', matchday: 1,
    homeTeam: { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA' },
    awayTeam: { id: 'canada', name: 'Canada', flag: '🇨🇦', confederation: 'CONCACAF' },
    kickoff: d(3, 21), venue: 'MetLife Stadium', city: 'New York',
    status: 'finished', homeScore: 3, awayScore: 1,
    odds: { home: 1.50, draw: 3.80, away: 6.50 },
    debateCount: 512, betsCount: 9870,
  },
  {
    id: 'd2', groupId: 'D', groupName: 'Group D', matchday: 1,
    homeTeam: { id: 'senegal', name: 'Senegal', flag: '🇸🇳', confederation: 'CAF' },
    awayTeam: { id: 'slovakia', name: 'Slovakia', flag: '🇸🇰', confederation: 'UEFA' },
    kickoff: d(3, 18), venue: 'Hard Rock Stadium', city: 'Miami',
    status: 'finished', homeScore: 2, awayScore: 0,
    odds: { home: 1.80, draw: 3.20, away: 4.30 },
    debateCount: 211, betsCount: 3740,
  },
  {
    id: 'd3', groupId: 'D', groupName: 'Group D', matchday: 2,
    homeTeam: { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA' },
    awayTeam: { id: 'senegal', name: 'Senegal', flag: '🇸🇳', confederation: 'CAF' },
    kickoff: d(7, 17), venue: 'AT&T Stadium', city: 'Dallas',
    status: 'live', homeScore: 0, awayScore: 0, minute: 42,
    odds: { home: 1.65, draw: 3.50, away: 5.00 },
    debateCount: 523, betsCount: 11200,
  },

  // ─── GROUP E ───────────────────────────────────────
  {
    id: 'e1', groupId: 'E', groupName: 'Group E', matchday: 1,
    homeTeam: { id: 'germany', name: 'Germany', flag: '🇩🇪', confederation: 'UEFA' },
    awayTeam: { id: 'iran', name: 'IR Iran', flag: '🇮🇷', confederation: 'AFC' },
    kickoff: d(4, 21), venue: 'Rose Bowl', city: 'Los Angeles',
    status: 'finished', homeScore: 4, awayScore: 0,
    odds: { home: 1.25, draw: 5.50, away: 11.00 },
    debateCount: 389, betsCount: 7840,
  },
  {
    id: 'e2', groupId: 'E', groupName: 'Group E', matchday: 1,
    homeTeam: { id: 'netherlands', name: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA' },
    awayTeam: { id: 'chile', name: 'Chile', flag: '🇨🇱', confederation: 'CONMEBOL' },
    kickoff: d(4, 18), venue: 'SoFi Stadium', city: 'Los Angeles',
    status: 'finished', homeScore: 3, awayScore: 1,
    odds: { home: 1.65, draw: 3.50, away: 5.00 },
    debateCount: 254, betsCount: 4560,
  },
  {
    id: 'e3', groupId: 'E', groupName: 'Group E', matchday: 2,
    homeTeam: { id: 'germany', name: 'Germany', flag: '🇩🇪', confederation: 'UEFA' },
    awayTeam: { id: 'netherlands', name: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA' },
    kickoff: d(8, 21), venue: 'MetLife Stadium', city: 'New York',
    status: 'upcoming', homeScore: null, awayScore: null,
    odds: { home: 1.85, draw: 3.40, away: 4.20 },
    debateCount: 780, betsCount: 15400,
  },

  // ─── GROUP F ───────────────────────────────────────
  {
    id: 'f1', groupId: 'F', groupName: 'Group F', matchday: 1,
    homeTeam: { id: 'portugal', name: 'Portugal', flag: '🇵🇹', confederation: 'UEFA' },
    awayTeam: { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨', confederation: 'CONMEBOL' },
    kickoff: d(5, 21), venue: 'Levi\'s Stadium', city: 'San Francisco',
    status: 'finished', homeScore: 4, awayScore: 1,
    odds: { home: 1.40, draw: 4.20, away: 7.50 },
    debateCount: 344, betsCount: 6780,
  },
  {
    id: 'f2', groupId: 'F', groupName: 'Group F', matchday: 1,
    homeTeam: { id: 'spain', name: 'Spain', flag: '🇪🇸', confederation: 'UEFA' },
    awayTeam: { id: 'south_korea', name: 'South Korea', flag: '🇰🇷', confederation: 'AFC' },
    kickoff: d(5, 18), venue: 'Hard Rock Stadium', city: 'Miami',
    status: 'finished', homeScore: 1, awayScore: 1,
    odds: { home: 1.60, draw: 3.60, away: 5.50 },
    debateCount: 478, betsCount: 9200,
  },
  {
    id: 'f3', groupId: 'F', groupName: 'Group F', matchday: 2,
    homeTeam: { id: 'portugal', name: 'Portugal', flag: '🇵🇹', confederation: 'UEFA' },
    awayTeam: { id: 'spain', name: 'Spain', flag: '🇪🇸', confederation: 'UEFA' },
    kickoff: d(9, 21), venue: 'AT&T Stadium', city: 'Dallas',
    status: 'upcoming', homeScore: null, awayScore: null,
    odds: { home: 2.20, draw: 3.10, away: 3.30 },
    debateCount: 1203, betsCount: 23100,
  },
];

export function getMatchById(id: string): WCMatch | undefined {
  return WC_MATCHES.find(m => m.id === id);
}

export function getLiveMatches(): WCMatch[] {
  return WC_MATCHES.filter(m => m.status === 'live');
}

export function getUpcomingMatches(): WCMatch[] {
  return WC_MATCHES.filter(m => m.status === 'upcoming').slice(0, 12);
}

export function getFinishedMatches(): WCMatch[] {
  return WC_MATCHES.filter(m => m.status === 'finished').slice(0, 12);
}

export function getGroupById(id: string): WCGroup | undefined {
  return WC_GROUPS.find(g => g.id === id);
}
