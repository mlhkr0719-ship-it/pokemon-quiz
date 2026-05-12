'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Search, X } from 'lucide-react';
import { getPokedex, PokedexEntry } from '@/lib/storage';
import { TYPE_LABELS } from '@/lib/utils';

interface PokedexProps {
  onClose: () => void;
}

export default function Pokedex({ onClose }: PokedexProps) {
  const [search, setSearch] = useState('');
  const entries = getPokedex();

  const filtered = entries.filter(
    (e) =>
      e.japaneseName.includes(search) ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.types.some((t) =>
        (TYPE_LABELS[t] || t).includes(search)
      )
  );

  return (
    <div className="w-full max-w-md animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onClose}
          className="btn-pokemon p-2 bg-white/20 text-white rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white">📖 ポケモン図鑑</h2>
          <p className="text-white/70 text-xs">{entries.length} 匹ゲット！</p>
        </div>
      </div>

      <div className="card-pokemon p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名前・タイプで検索..."
            className="w-full pl-9 pr-8 py-2.5 bg-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pokemon-blue"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500 font-bold">まだポケモンがいません</p>
            <p className="text-gray-400 text-sm mt-1">クイズで正解するとゲットできるよ！</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">😅</div>
            <p className="text-gray-500">見つかりません</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
            {filtered.map((entry) => (
              <PokedexCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PokedexCard({ entry }: { entry: PokedexEntry }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-2 text-center hover:bg-pokemon-yellow/10 transition-colors">
      <div className="text-xs text-gray-400 font-mono">
        #{String(entry.id).padStart(3, '0')}
      </div>
      {entry.imageUrl ? (
        <Image
          src={entry.imageUrl}
          alt={entry.japaneseName}
          width={64}
          height={64}
          className="w-16 h-16 object-contain mx-auto"
          unoptimized
        />
      ) : (
        <div className="w-16 h-16 mx-auto flex items-center justify-center text-3xl">
          ❓
        </div>
      )}
      <div className="text-xs font-bold text-gray-700 truncate mt-1">
        {entry.japaneseName}
      </div>
      <div className="flex flex-wrap gap-0.5 justify-center mt-1">
        {entry.types.map((t) => (
          <span
            key={t}
            className={`type-badge type-${t}`}
            style={{ fontSize: '9px', padding: '1px 4px' }}
          >
            {TYPE_LABELS[t] || t}
          </span>
        ))}
      </div>
    </div>
  );
}
