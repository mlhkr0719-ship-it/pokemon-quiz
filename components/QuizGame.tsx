'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, Trophy, Zap, Clock, SkipForward, Eye, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { Pokemon, fetchRandomPokemon, fetchChoices } from '@/lib/pokemon';
import { playCorrectSound, playWrongSound, playGameOverSound, playLevelUpSound, resumeContext } from '@/lib/audio';
import { getHighScore, saveHighScore, addToPokedex, updateStats } from '@/lib/storage';
import { TYPE_LABELS, cn } from '@/lib/utils';
import PokemonImage from './PokemonImage';
import DifficultySelect, { Difficulty, GameMode } from './DifficultySelect';
import GameOver from './GameOver';
import Pokedex from './Pokedex';

type Screen = 'menu' | 'playing' | 'gameover' | 'pokedex';
type AnswerState = 'idle' | 'correct' | 'wrong' | 'revealed';

const TIMED_MODE_SEC = 30;
const LIVES_MAX = 3;
const SCORE_BASE = 100;
const SCORE_STREAK_BONUS = 20;
const SCORE_TIME_BONUS = 50;

interface Confetti {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

export default function QuizGame() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<GameMode>('normal');

  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(LIVES_MAX);
  const [timeLeft, setTimeLeft] = useState(TIMED_MODE_SEC);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [level, setLevel] = useState(1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef(true);
  soundRef.current = soundOn;

  const playSound = useCallback((fn: () => void) => {
    if (soundRef.current) fn();
  }, []);

  const spawnConfetti = useCallback(() => {
    const pieces: Confetti[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#FFCC00', '#FF0000', '#3B4CCA', '#78C850', '#F08030'][Math.floor(Math.random() * 5)],
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random(),
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 2500);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(TIMED_MODE_SEC);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { stopTimer(); return 0; } return t - 1; });
    }, 1000);
  }, [stopTimer]);

  const handleGameOver = useCallback(() => {
    stopTimer();
    playSound(playGameOverSound);
    setScreen('gameover');
    saveHighScore(score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, stopTimer, playSound]);

  useEffect(() => {
    if (mode === 'timed' && timeLeft === 0 && screen === 'playing') handleGameOver();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, mode, screen]);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    setAnswerState('idle');
    setChoices([]);
    try {
      // Fetch correct Pokemon first, then choices in parallel
      const p = await fetchRandomPokemon();
      setPokemon(p); // show image early while choices load
      const ch = await fetchChoices(p, 4);
      setChoices(ch);
    } catch (err) {
      console.error('loadNext error:', err);
      // retry after 2s
      setTimeout(() => loadNext(), 2000);
      return;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = useCallback((diff: Difficulty, gm: GameMode) => {
    resumeContext();
    setDifficulty(diff);
    setMode(gm);
    setScore(0); setStreak(0); setMaxStreak(0);
    setLives(LIVES_MAX); setCorrectCount(0); setTotalCount(0); setLevel(1);
    setScreen('playing');
    if (gm === 'timed') startTimer();
    loadNext();
  }, [loadNext, startTimer]);

  const handleChoice = useCallback((choice: string) => {
    if (!pokemon || answerState !== 'idle' || loading) return;
    setSelected(choice);
    const correct = choice === pokemon.japaneseName;
    setTotalCount((n) => n + 1);
    updateStats(correct);

    if (correct) {
      const newStreak = streak + 1;
      const streakBonus = Math.min(newStreak - 1, 10) * SCORE_STREAK_BONUS;
      const timeBonus = mode === 'timed' ? Math.floor((timeLeft / TIMED_MODE_SEC) * SCORE_TIME_BONUS) : 0;
      const gained = SCORE_BASE + streakBonus + timeBonus;
      const newScore = score + gained;

      setAnswerState('correct');
      setStreak(newStreak);
      setMaxStreak((ms) => Math.max(ms, newStreak));
      setCorrectCount((n) => n + 1);
      setScore(newScore);
      addToPokedex(pokemon);
      playSound(playCorrectSound);
      spawnConfetti();

      const newLevel = Math.floor(newScore / 1000) + 1;
      if (newLevel > level) { setLevel(newLevel); playSound(playLevelUpSound); }

      setTimeout(() => loadNext(), 1600);
    } else {
      setAnswerState('wrong');
      setStreak(0);
      playSound(playWrongSound);

      if (mode === 'lives') {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) { setTimeout(() => handleGameOver(), 1200); return; }
      }
      setTimeout(() => loadNext(), 1800);
    }
  }, [pokemon, answerState, loading, streak, score, mode, timeLeft, level, lives, playSound, spawnConfetti, loadNext, handleGameOver]);

  const handleSkip = useCallback(() => {
    if (!pokemon || loading) return;
    setTotalCount((n) => n + 1);
    updateStats(false);
    setStreak(0);
    if (mode === 'lives') {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) { handleGameOver(); return; }
    }
    loadNext();
  }, [pokemon, loading, mode, lives, loadNext, handleGameOver]);

  const handleShowAnswer = useCallback(() => {
    if (!pokemon || answerState !== 'idle') return;
    setAnswerState('revealed');
    setSelected(pokemon.japaneseName);
    setStreak(0);
    setTotalCount((n) => n + 1);
    updateStats(false);
    if (mode === 'lives') {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) { setTimeout(() => handleGameOver(), 1500); return; }
    }
    setTimeout(() => loadNext(), 2000);
  }, [pokemon, answerState, mode, lives, loadNext, handleGameOver]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ========== RENDERS ==========

  if (screen === 'menu') return <DifficultySelect onStart={handleStart} onPokedex={() => setScreen('pokedex')} />;
  if (screen === 'gameover') return (
    <GameOver score={score} streak={maxStreak} correct={correctCount} total={totalCount}
      onRestart={() => handleStart(difficulty, mode)} onMenu={() => setScreen('menu')} onPokedex={() => setScreen('pokedex')} />
  );
  if (screen === 'pokedex') return <Pokedex onClose={() => setScreen('menu')} />;

  const highScore = getHighScore();
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;

  return (
    <div className="w-full max-w-md relative animate-fadeIn">
      {/* Confetti */}
      {confetti.map((c) => (
        <div key={c.id} className="confetti-piece"
          style={{ left: `${c.x}%`, backgroundColor: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`, top: 0 }} />
      ))}

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { stopTimer(); setScreen('menu'); }}
          className="btn-pokemon px-3 py-1.5 bg-white/20 text-white text-sm font-bold rounded-xl">
          ← メニュー
        </button>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-pokemon-yellow text-gray-900 rounded-lg text-xs font-black">Lv.{level}</div>
          <button onClick={() => setSoundOn((s) => !s)} className="btn-pokemon p-1.5 bg-white/20 text-white rounded-lg">
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => { stopTimer(); setScreen('pokedex'); }} className="btn-pokemon p-1.5 bg-white/20 text-white rounded-lg">
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-pokemon-yellow" />
          <span className="text-white font-black text-lg">{score}</span>
          {highScore > 0 && <span className="text-white/50 text-xs">/ {highScore}</span>}
        </div>
        {mode === 'timed' && (
          <div className={cn('flex items-center gap-1 px-3 py-1 rounded-full font-black',
            timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white')}>
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
        )}
        {mode === 'lives' && (
          <div className="flex gap-1">
            {Array.from({ length: LIVES_MAX }, (_, i) => (
              <Heart key={i} className={cn('w-5 h-5 transition-all', i < lives ? 'text-red-500 fill-red-500' : 'text-white/30')} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Zap className={cn('w-4 h-4', streak > 0 ? 'text-pokemon-yellow' : 'text-white/30')} />
          <span className={cn('font-black', streak > 0 ? 'text-pokemon-yellow' : 'text-white/50')}>{streak}</span>
          <span className="text-white/50 text-xs">連続</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="card-pokemon p-5">
        {/* Pokemon meta */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">
              {pokemon ? `#${String(pokemon.id).padStart(3, '0')}` : '---'}
            </span>
            {pokemon && answerState !== 'idle' && (
              <div className="flex gap-1">
                {pokemon.types.map((t) => (
                  <span key={t} className={`type-badge type-${t}`}>{TYPE_LABELS[t] || t}</span>
                ))}
              </div>
            )}
          </div>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
            difficulty === 'hard' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}>
            {difficulty === 'hard' ? '🌑 むずかしい' : '🌟 かんたん'}
          </span>
        </div>

        {/* Question */}
        <div className="text-center mb-1 text-sm font-bold text-gray-500">
          {answerState === 'idle' ? 'このポケモンの名前は？' : ''}
        </div>

        {/* Pokemon image */}
        <div className="flex justify-center my-3">
          {loading ? (
            <div className="w-40 h-40 flex items-center justify-center">
              <div className="w-14 h-14 pokeball-spin">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                  <circle cx="50" cy="50" r="48" fill="#EF4444" stroke="#333" strokeWidth="4" />
                  <rect x="2" y="46" width="96" height="8" fill="white" />
                  <circle cx="50" cy="50" r="12" fill="white" stroke="#333" strokeWidth="4" />
                  <circle cx="50" cy="50" r="6" fill="#EF4444" stroke="#333" strokeWidth="2" />
                </svg>
              </div>
            </div>
          ) : pokemon ? (
            <PokemonImage
              imageUrl={pokemon.imageUrl}
              name={pokemon.japaneseName}
              silhouette={difficulty === 'hard'}
              revealed={answerState === 'correct' || answerState === 'revealed'}
              className={cn(answerState === 'correct' && 'animate-bounce_in')}
            />
          ) : null}
        </div>

        {/* Result message */}
        {answerState !== 'idle' && (
          <div className={cn('text-center py-2 mb-3 rounded-2xl font-black text-lg animate-bounce_in',
            answerState === 'correct' ? 'bg-green-100 text-green-600' :
            answerState === 'wrong' ? 'bg-red-100 text-red-600' :
            'bg-purple-100 text-purple-600')}>
            {answerState === 'correct' && `⭕ せいかい！  ${pokemon?.japaneseName}`}
            {answerState === 'wrong' && `✕ ちがう！  正解は「${pokemon?.japaneseName}」`}
            {answerState === 'revealed' && `答えは「${pokemon?.japaneseName}」`}
          </div>
        )}

        {/* 4択 buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          {(loading || choices.length === 0
            ? ['', '', '', '']
            : choices
          ).map((choice, i) => {
            const isSelected = selected === choice && choice !== '';
            const isCorrect = pokemon && choice === pokemon.japaneseName;
            const showResult = answerState !== 'idle';

            let btnClass = 'bg-gray-100 text-gray-700 border-2 border-transparent';
            if (showResult && choice !== '') {
              if (isCorrect) btnClass = 'bg-green-500 text-white border-2 border-green-600 scale-105';
              else if (isSelected && !isCorrect) btnClass = 'bg-red-400 text-white border-2 border-red-500';
              else btnClass = 'bg-gray-100 text-gray-400 border-2 border-transparent opacity-60';
            }

            return (
              <button
                key={i}
                onClick={() => choice && handleChoice(choice)}
                disabled={answerState !== 'idle' || loading || !choice}
                className={cn(
                  'btn-pokemon py-4 px-3 text-center font-black text-base transition-all duration-200',
                  'min-h-[64px] flex items-center justify-center rounded-2xl',
                  btnClass,
                  answerState === 'idle' && choice && 'hover:bg-pokemon-yellow/20 hover:border-pokemon-yellow active:scale-95',
                  !choice && 'animate-pulse bg-gray-100'
                )}
              >
                {choice || <span className="text-gray-300 text-sm">...</span>}
              </button>
            );
          })}
        </div>

        {/* Sub actions */}
        {answerState === 'idle' && !loading && (
          <div className="flex gap-2 mt-3">
            <button onClick={handleShowAnswer}
              className="btn-pokemon flex-1 py-2 bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center gap-1">
              <Eye className="w-3.5 h-3.5" /> 答えを見る
            </button>
            <button onClick={handleSkip}
              className="btn-pokemon flex-1 py-2 bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center gap-1">
              <SkipForward className="w-3.5 h-3.5" /> スキップ
            </button>
          </div>
        )}

        {/* Accuracy */}
        <div className="mt-3 text-center text-xs text-gray-400">
          正解率 {accuracy}% ({correctCount}/{totalCount})
        </div>
      </div>

      {/* Timer progress */}
      {mode === 'timed' && (
        <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-1000',
            timeLeft > 20 ? 'bg-green-400' : timeLeft > 10 ? 'bg-yellow-400' : 'bg-red-400')}
            style={{ width: `${(timeLeft / TIMED_MODE_SEC) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
