'use client';

import { useState } from 'react';
import { Trophy, Zap, Heart, Clock } from 'lucide-react';
import { getHighScore, getTotalStats } from '@/lib/storage';
import { cn } from '@/lib/utils';

export type Difficulty = 'easy' | 'hard';
export type GameMode = 'normal' | 'timed' | 'lives';

interface DifficultySelectProps {
  onStart: (difficulty: Difficulty, mode: GameMode) => void;
  onPokedex: () => void;
}

export default function DifficultySelect({ onStart, onPokedex }: DifficultySelectProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<GameMode>('normal');
  const highScore = getHighScore();
  const stats = getTotalStats();
  const accuracy =
    stats.played > 0 ? Math.round((stats.correct / stats.played) * 100) : 0;

  const modes: { id: GameMode; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'normal',
      label: 'ノーマル',
      desc: 'のんびり挑戦',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-blue-500',
    },
    {
      id: 'timed',
      label: 'タイムアタック',
      desc: '30秒で何問？',
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-orange-500',
    },
    {
      id: 'lives',
      label: 'ライフ制',
      desc: 'ミス3回でゲームオーバー',
      icon: <Heart className="w-5 h-5" />,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="w-full max-w-md animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-7xl mb-3 animate-float inline-block">⚡</div>
        <h1 className="text-4xl font-black text-white drop-shadow-lg tracking-tight">
          ポケモン
          <span className="text-pokemon-yellow">クイズ</span>
        </h1>
        <p className="text-white/80 mt-2 text-sm">ポケモンの名前を当てよう！</p>
      </div>

      {/* Stats */}
      {stats.played > 0 && (
        <div className="card-pokemon p-4 mb-6 flex justify-around text-center">
          <div>
            <div className="text-2xl font-black text-pokemon-blue">{highScore}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" />
              ハイスコア
            </div>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <div className="text-2xl font-black text-green-500">{accuracy}%</div>
            <div className="text-xs text-gray-500">正解率</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <div className="text-2xl font-black text-purple-500">{stats.played}</div>
            <div className="text-xs text-gray-500">総挑戦数</div>
          </div>
        </div>
      )}

      <div className="card-pokemon p-6 space-y-6">
        {/* Difficulty */}
        <div>
          <p className="text-sm font-bold text-gray-600 mb-3">難易度</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDifficulty('easy')}
              className={cn(
                'btn-pokemon py-4 px-4 text-center transition-all',
                difficulty === 'easy'
                  ? 'bg-green-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              <div className="text-2xl mb-1">🌟</div>
              <div className="font-bold">かんたん</div>
              <div className="text-xs opacity-80">普通の画像</div>
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={cn(
                'btn-pokemon py-4 px-4 text-center transition-all',
                difficulty === 'hard'
                  ? 'bg-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              <div className="text-2xl mb-1">🌑</div>
              <div className="font-bold">むずかしい</div>
              <div className="text-xs opacity-80">シルエット</div>
            </button>
          </div>
        </div>

        {/* Mode */}
        <div>
          <p className="text-sm font-bold text-gray-600 mb-3">モード</p>
          <div className="space-y-2">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'btn-pokemon w-full flex items-center gap-3 px-4 py-3 text-left',
                  mode === m.id
                    ? `${m.color} text-white shadow-md`
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                <span
                  className={cn(
                    'p-1.5 rounded-lg',
                    mode === m.id ? 'bg-white/20' : 'bg-white'
                  )}
                >
                  {m.icon}
                </span>
                <div>
                  <div className="font-bold text-sm">{m.label}</div>
                  <div className="text-xs opacity-80">{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onStart(difficulty, mode)}
          className="btn-pokemon w-full py-4 bg-pokemon-yellow text-gray-900 text-xl font-black shadow-lg hover:shadow-xl"
        >
          🎮　ゲームスタート
        </button>

        {/* Pokedex */}
        <button
          onClick={onPokedex}
          className="btn-pokemon w-full py-3 bg-pokemon-blue text-white font-bold"
        >
          📖　ポケモン図鑑
        </button>
      </div>
    </div>
  );
}
