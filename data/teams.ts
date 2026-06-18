export interface NationalTeam {
  id: string;
  name: string;
  flag: string;
  confederation: string;
  color: string;
  fanCount: number;
}

export const NATIONAL_TEAMS: NationalTeam[] = [
  { id: 'brazil', name: 'Brazil', flag: '🇧🇷', confederation: 'CONMEBOL', color: '#009c3b', fanCount: 248000 },
  { id: 'argentina', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL', color: '#74acdf', fanCount: 196000 },
  { id: 'france', name: 'France', flag: '🇫🇷', confederation: 'UEFA', color: '#002395', fanCount: 187000 },
  { id: 'germany', name: 'Germany', flag: '🇩🇪', confederation: 'UEFA', color: '#000000', fanCount: 176000 },
  { id: 'england', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', color: '#cf081f', fanCount: 165000 },
  { id: 'spain', name: 'Spain', flag: '🇪🇸', confederation: 'UEFA', color: '#c60b1e', fanCount: 159000 },
  { id: 'italy', name: 'Italy', flag: '🇮🇹', confederation: 'UEFA', color: '#009246', fanCount: 142000 },
  { id: 'portugal', name: 'Portugal', flag: '🇵🇹', confederation: 'UEFA', color: '#006600', fanCount: 138000 },
  { id: 'netherlands', name: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA', color: '#ff6600', fanCount: 124000 },
  { id: 'uruguay', name: 'Uruguay', flag: '🇺🇾', confederation: 'CONMEBOL', color: '#75aadb', fanCount: 89000 },
  { id: 'croatia', name: 'Croatia', flag: '🇭🇷', confederation: 'UEFA', color: '#ff0000', fanCount: 82000 },
  { id: 'morocco', name: 'Morocco', flag: '🇲🇦', confederation: 'CAF', color: '#c1272d', fanCount: 78000 },
  { id: 'japan', name: 'Japan', flag: '🇯🇵', confederation: 'AFC', color: '#bc002d', fanCount: 73000 },
  { id: 'usa', name: 'USA', flag: '🇺🇸', confederation: 'CONCACAF', color: '#002868', fanCount: 68000 },
  { id: 'senegal', name: 'Senegal', flag: '🇸🇳', confederation: 'CAF', color: '#00853f', fanCount: 65000 },
  { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', confederation: 'CAF', color: '#008751', fanCount: 62000 },
  { id: 'colombia', name: 'Colombia', flag: '🇨🇴', confederation: 'CONMEBOL', color: '#fcd116', fanCount: 58000 },
  { id: 'mexico', name: 'Mexico', flag: '🇲🇽', confederation: 'CONCACAF', color: '#006847', fanCount: 94000 },
  { id: 'australia', name: 'Australia', flag: '🇦🇺', confederation: 'AFC', color: '#00843d', fanCount: 52000 },
  { id: 'south_korea', name: 'South Korea', flag: '🇰🇷', confederation: 'AFC', color: '#cd2e3a', fanCount: 71000 },
  { id: 'ghana', name: 'Ghana', flag: '🇬🇭', confederation: 'CAF', color: '#006b3f', fanCount: 48000 },
  { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨', confederation: 'CONMEBOL', color: '#ffd100', fanCount: 44000 },
  { id: 'switzerland', name: 'Switzerland', flag: '🇨🇭', confederation: 'UEFA', color: '#ff0000', fanCount: 56000 },
  { id: 'belgium', name: 'Belgium', flag: '🇧🇪', confederation: 'UEFA', color: '#000000', fanCount: 88000 },
];

export const CONFEDERATIONS = ['UEFA', 'CONMEBOL', 'AFC', 'CAF', 'CONCACAF', 'OFC'];
