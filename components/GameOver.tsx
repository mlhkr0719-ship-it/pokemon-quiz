'use client';

import { Trophy, Star, RotateCcw, BookOpen } from 'lucide-react';
import { getHighScore } from '@/lib/storage';

interface GameOverProps {
  score: number;
  streak: number;
  correct: number;
  total: number;
  onRestart: () => void;
  onMenu: () => void;
  onPokedex: () => void;
}

export default function GameOver({
  score,
  streak,
  correct,
  total,
  onRestart,
  onMenu,
  onPokedex,
}: GameOverProps) {
  const highScore = getHighScore();
  const isNewRecord = score >= highScore && score > 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const getRank = () => {
    if (accuracy >= 90) return { rank: 'S', color: 'text-yellow-500', label: 'すごい！！' };
    if (accuracy >= 75) return { rank: 'A', color: 'text-green-500', label: 'よくできました！' };
    if (accuracy >= 60) return { rank: 'B', color: 'text-blue-500', label: 'なかなかです！' };
    if (accuracy >= 40) return { rank: 'C', color: 'text-orange-500', label: 'もう少し！' };
    return { rank: 'D', color: 'text-red-500', label: 'またチャレンジ！' };
  };

  const { rank, color, label } = getRank();

  return (
    <div className="w-full max-w-md animate-bounce_in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">{isNewRecord ? '🏆' : '😤'}</div>
        <h2 className="text-3xl font-black text-white drop-shadow">
          {isNewRecord ? '新記録！' : 'ゲームオーバー'}
        </h2>
        {isNewRecord && (
          <div className="mt-1 px-4 py-1 bg-pokemon-yellow text-gray-900 rounded-full text-sm font-bold inline-block animate-sparkle">
            ★ NEW RECORD ★
          </div>
        )}
      </div>

      <div className="card-pokemon p-6 space-y-5">
        {/* Rank */}
        <div className="text-center py-4 bg-gray-50 rounded-2xl">
          <div className={`text-7xl font-black ${color}`}>{rank}</div>
          <div className="text-gray-600 font-bold mt-1">{label}</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-pokemon-yellow/10 rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-pokemon-blue">{score}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              スコア
            </div>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-red-500">{streak}</div>
            <div className="text-xs text-gray-500">最大連続正解</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-green-500">{correct}</div>
            <div className="text-xs text-gray-500">正解数</div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-blue-500">{accuracy}%</div>
            <div className="text-xs text-gray-500">正解率</div>
          </div>
        </div>

        {/* High Score */}
        <div className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-xl">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-600">
            ハイスコア: <span className="font-black text-pokemon-blue">{highScore}</span>
          </span>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="btn-pokemon w-full py-4 bg-pokemon-yellow text-gray-900 font-black text-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            もう一度プレイ
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onPokedex}
              className="btn-pokemon py-3 bg-pokemon-blue text-white font-bold flex items-center justify-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              図鑑を見る
            </button>
            <button
              onClick={onMenu}
              className="btn-pokemon py-3 bg-gray-200 text-gray-700 font-bold"
            >
              メニュー
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
