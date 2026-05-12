import { Pokemon } from './pokemon';

const KEYS = {
  highScore: 'pq_highscore',
  pokedex: 'pq_pokedex',
  totalCorrect: 'pq_total_correct',
  totalPlayed: 'pq_total_played',
} as const;

export function getHighScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(KEYS.highScore) || '0', 10);
}

export function saveHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem(KEYS.highScore, String(score));
  }
}

export interface PokedexEntry {
  id: number;
  japaneseName: string;
  name: string;
  imageUrl: string;
  types: string[];
  caughtAt: number;
}

export function getPokedex(): PokedexEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.pokedex) || '[]');
  } catch {
    return [];
  }
}

export function addToPokedex(pokemon: Pokemon): void {
  if (typeof window === 'undefined') return;
  const dex = getPokedex();
  if (!dex.find((p) => p.id === pokemon.id)) {
    dex.push({
      id: pokemon.id,
      japaneseName: pokemon.japaneseName,
      name: pokemon.name,
      imageUrl: pokemon.imageUrl,
      types: pokemon.types,
      caughtAt: Date.now(),
    });
    dex.sort((a, b) => a.id - b.id);
    localStorage.setItem(KEYS.pokedex, JSON.stringify(dex));
  }
}

export function getTotalStats(): { correct: number; played: number } {
  if (typeof window === 'undefined') return { correct: 0, played: 0 };
  return {
    correct: parseInt(localStorage.getItem(KEYS.totalCorrect) || '0', 10),
    played: parseInt(localStorage.getItem(KEYS.totalPlayed) || '0', 10),
  };
}

export function updateStats(correct: boolean): void {
  if (typeof window === 'undefined') return;
  const stats = getTotalStats();
  stats.played += 1;
  if (correct) stats.correct += 1;
  localStorage.setItem(KEYS.totalCorrect, String(stats.correct));
  localStorage.setItem(KEYS.totalPlayed, String(stats.played));
}
