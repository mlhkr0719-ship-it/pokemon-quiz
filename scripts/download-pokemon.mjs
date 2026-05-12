/**
 * ポケモンデータを一括ダウンロードして public/pokemon-data.json に保存するスクリプト
 * 実行: node scripts/download-pokemon.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'public', 'pokemon-data.json');
const MAX_ID = 1010;
const BATCH = 30; // 同時リクエスト数
const DELAY_MS = 300; // バッチ間の待機(ms)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchName(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for id=${id}`);
  const data = await res.json();

  const japaneseName =
    data.names.find((n) => n.language.name === 'ja-Hrkt')?.name ||
    data.names.find((n) => n.language.name === 'ja')?.name ||
    data.name;

  const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/other/official-artwork/${id}.png`;

  return { id, japaneseName, imageUrl };
}

async function main() {
  const results = [];
  const total = MAX_ID;

  console.log(`📥 ${total}匹のポケモンデータをダウンロード中...`);

  for (let start = 1; start <= total; start += BATCH) {
    const end = Math.min(start + BATCH - 1, total);
    const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const batch = await Promise.allSettled(ids.map(fetchName));

    for (const r of batch) {
      if (r.status === 'fulfilled') {
        results.push(r.value);
      } else {
        console.warn(`  ⚠️  スキップ: ${r.reason?.message}`);
      }
    }

    const pct = Math.round((end / total) * 100);
    process.stdout.write(`\r  進捗: ${end}/${total} (${pct}%)`);

    if (end < total) await sleep(DELAY_MS);
  }

  console.log(`\n✅ ${results.length}匹取得完了`);
  results.sort((a, b) => a.id - b.id);
  writeFileSync(OUTPUT, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`💾 保存完了: ${OUTPUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
