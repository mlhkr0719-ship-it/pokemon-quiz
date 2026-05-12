export interface Pokemon {
  id: number;
  name: string;
  japaneseName: string;
  imageUrl: string;
  types: string[];
}

interface PokeAPIName {
  language: { name: string };
  name: string;
}

interface PokeAPIType {
  type: { name: string };
}

const cache = new Map<number, Pokemon>();

async function fetchById(id: number): Promise<Pokemon> {
  if (cache.has(id)) return cache.get(id)!;

  const [pokRes, spRes] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
  ]);

  if (!pokRes.ok || !spRes.ok) throw new Error(`Failed for id=${id}`);

  const pok = await pokRes.json();
  const sp = await spRes.json();

  // Prefer Katakana (ja-Hrkt), fall back to ja, then English
  const jpName =
    sp.names.find((n: PokeAPIName) => n.language.name === 'ja-Hrkt')?.name ||
    sp.names.find((n: PokeAPIName) => n.language.name === 'ja')?.name ||
    pok.name;

  const imageUrl =
    pok.sprites?.other?.['official-artwork']?.front_default ||
    pok.sprites?.front_default ||
    '';

  const result: Pokemon = {
    id,
    name: pok.name,
    japaneseName: jpName,
    imageUrl,
    types: pok.types.map((t: PokeAPIType) => t.type.name),
  };

  cache.set(id, result);
  return result;
}

export async function fetchRandomPokemon(): Promise<Pokemon> {
  const MAX_ID = 1010;
  for (let i = 0; i < 5; i++) {
    try {
      const id = Math.floor(Math.random() * MAX_ID) + 1;
      const p = await fetchById(id);
      if (p.imageUrl) return p;
    } catch {
      // retry
    }
  }
  // fallback to Pikachu
  return fetchById(25);
}

export async function fetchPokemonById(id: number): Promise<Pokemon> {
  return fetchById(id);
}

// Lightweight: species endpoint only (no image/type fetch needed for wrong choices)
const nameCache = new Map<number, string>();

async function fetchJapaneseName(id: number): Promise<string> {
  if (nameCache.has(id)) return nameCache.get(id)!;
  // If already in full cache, reuse
  if (cache.has(id)) {
    const name = cache.get(id)!.japaneseName;
    nameCache.set(id, name);
    return name;
  }
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  if (!res.ok) throw new Error(`species fetch failed id=${id}`);
  const sp = await res.json();
  const name =
    sp.names.find((n: PokeAPIName) => n.language.name === 'ja-Hrkt')?.name ||
    sp.names.find((n: PokeAPIName) => n.language.name === 'ja')?.name ||
    String(id);
  nameCache.set(id, name);
  return name;
}

export async function fetchChoices(correct: Pokemon, total = 4): Promise<string[]> {
  const MAX_ID = 1010;
  const usedIds = new Set<number>([correct.id]);
  const wrongIds: number[] = [];

  // Pick total-1 unique random IDs
  while (wrongIds.length < total - 1) {
    const id = Math.floor(Math.random() * MAX_ID) + 1;
    if (!usedIds.has(id)) { usedIds.add(id); wrongIds.push(id); }
  }

  // Fetch only species names in parallel (1 request each)
  const settled = await Promise.allSettled(wrongIds.map(fetchJapaneseName));
  const wrongNames: string[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') wrongNames.push(r.value);
    else wrongNames.push(`???${wrongNames.length}`); // fallback so we always have 3
  }

  const choices = [correct.japaneseName, ...wrongNames.slice(0, total - 1)];
  // Fisher-Yates shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

export function normalizeAnswer(input: string, correct: string): boolean {
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      // normalize full-width to half-width
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
        String.fromCharCode(c.charCodeAt(0) - 0xfee0)
      )
      // normalize katakana to hiragana
      .replace(/[ァ-ヶ]/g, (c) =>
        String.fromCharCode(c.charCodeAt(0) - 0x60)
      )
      .replace(/\s+/g, '');

  return norm(input) === norm(correct);
}
