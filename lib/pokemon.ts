export interface Pokemon {
  id: number;
  name: string;
  japaneseName: string;
  imageUrl: string;
  types: string[];
}

interface LocalEntry {
  id: number;
  japaneseName: string;
  imageUrl: string;
}

// ── ローカルデータキャッシュ ──────────────────────────────────────
let _localData: LocalEntry[] | null = null;

async function getLocalData(): Promise<LocalEntry[]> {
  if (_localData) return _localData;
  try {
    const res = await fetch('/pokemon-data.json');
    if (!res.ok) throw new Error('local data not found');
    _localData = await res.json();
    return _localData!;
  } catch {
    return [];
  }
}

// ── フルキャッシュ（types も含む） ────────────────────────────────
const fullCache = new Map<number, Pokemon>();

// ── 型情報だけ PokéAPI から取得（オンライン時のみ）────────────────
async function fetchTypes(id: number): Promise<string[]> {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.types.map((t: { type: { name: string } }) => t.type.name);
  } catch {
    return [];
  }
}

// ── Pokemon をローカルデータ + API で構築 ──────────────────────────
async function buildPokemon(entry: LocalEntry): Promise<Pokemon> {
  if (fullCache.has(entry.id)) return fullCache.get(entry.id)!;

  // types は取得できなければ空配列で進む（オフライン対応）
  const types = await fetchTypes(entry.id);

  const p: Pokemon = {
    id: entry.id,
    name: String(entry.id),
    japaneseName: entry.japaneseName,
    imageUrl: entry.imageUrl,
    types,
  };
  fullCache.set(entry.id, p);
  return p;
}

// ── ランダムポケモン取得 ──────────────────────────────────────────
export async function fetchRandomPokemon(): Promise<Pokemon> {
  const data = await getLocalData();

  if (data.length > 0) {
    // ローカルデータからランダム選択（images がある前提）
    const entry = data[Math.floor(Math.random() * data.length)];
    return buildPokemon(entry);
  }

  // フォールバック: ローカルデータが無い場合は API から直接取得
  return fetchFromAPI();
}

async function fetchFromAPI(): Promise<Pokemon> {
  const MAX_ID = 1010;
  for (let i = 0; i < 5; i++) {
    try {
      const id = Math.floor(Math.random() * MAX_ID) + 1;
      const [pokRes, spRes] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
      ]);
      if (!pokRes.ok || !spRes.ok) continue;
      const pok = await pokRes.json();
      const sp = await spRes.json();
      const japaneseName =
        sp.names.find((n: { language: { name: string }; name: string }) => n.language.name === 'ja-Hrkt')?.name ||
        sp.names.find((n: { language: { name: string }; name: string }) => n.language.name === 'ja')?.name ||
        pok.name;
      const imageUrl =
        pok.sprites?.other?.['official-artwork']?.front_default ||
        pok.sprites?.front_default || '';
      if (!imageUrl) continue;
      return {
        id,
        name: pok.name,
        japaneseName,
        imageUrl,
        types: pok.types.map((t: { type: { name: string } }) => t.type.name),
      };
    } catch { /* retry */ }
  }
  // 最終フォールバック: ピカチュウ
  return {
    id: 25,
    name: 'pikachu',
    japaneseName: 'ピカチュウ',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/other/official-artwork/25.png',
    types: ['electric'],
  };
}

// ── 4択用の選択肢を生成（ローカルデータ使用）────────────────────
export async function fetchChoices(correct: Pokemon, total = 4): Promise<string[]> {
  const data = await getLocalData();

  let pool: LocalEntry[];
  if (data.length >= total) {
    pool = data;
  } else {
    // フォールバック: ローカルデータが少ない場合
    return [correct.japaneseName, 'フシギダネ', 'ヒトカゲ', 'ゼニガメ'].slice(0, total);
  }

  const wrongNames = new Set<string>();
  const maxTries = 100;
  let tries = 0;

  while (wrongNames.size < total - 1 && tries < maxTries) {
    const entry = pool[Math.floor(Math.random() * pool.length)];
    if (entry.id !== correct.id && entry.japaneseName !== correct.japaneseName) {
      wrongNames.add(entry.japaneseName);
    }
    tries++;
  }

  const choices = [correct.japaneseName, ...Array.from(wrongNames).slice(0, total - 1)];

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
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/\s+/g, '');
  return norm(input) === norm(correct);
}
