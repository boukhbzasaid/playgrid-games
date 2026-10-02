import { useCallback, useEffect, useMemo, useState } from 'react';
import Background from './components/Background';
import GameScreen from './components/GameScreen';
import { CoinPill, GameButton, IconButton } from './components/Ui';
import { COLORS, levelConfig } from './game/logic';
import { setSoundEnabled, sfx } from './game/sound';
import { loadProgress, saveProgress, type Progress } from './game/storage';

type Screen = 'home' | 'levels' | 'game';

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [screen, setScreen] = useState<Screen>('home');
  const [level, setLevel] = useState(() => loadProgress().unlocked);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => setSoundEnabled(progress.sound), [progress.sound]);

  const addCoins = useCallback((delta: number) => {
    setProgress((p) => ({ ...p, coins: Math.max(0, p.coins + delta) }));
  }, []);

  const handleWin = useCallback((lvl: number, stars: number) => {
    setProgress((p) => ({
      ...p,
      coins: p.coins + 50 + stars * 25,
      unlocked: Math.max(p.unlocked, lvl + 1),
      stars: { ...p.stars, [lvl]: Math.max(p.stars[lvl] ?? 0, stars) },
    }));
  }, []);

  const startLevel = (lvl: number) => {
    sfx.click();
    setLevel(lvl);
    setRestartKey((k) => k + 1);
    setScreen('game');
  };

  if (screen === 'game') {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Background />
        <GameScreen
          key={`${level}-${restartKey}`}
          level={level}
          coins={progress.coins}
          onCoins={addCoins}
          onWin={handleWin}
          onExit={() => {
            sfx.click();
            setScreen('home');
          }}
          onNext={() => startLevel(level + 1)}
          onRestartLevel={() => setRestartKey((k) => k + 1)}
        />
      </div>
    );
  }

  if (screen === 'levels') {
    return (
      <LevelSelect
        progress={progress}
        onBack={() => {
          sfx.click();
          setScreen('home');
        }}
        onPick={startLevel}
      />
    );
  }

  return (
    <Home
      progress={progress}
      onPlay={() => startLevel(progress.unlocked)}
      onLevels={() => {
        sfx.click();
        setScreen('levels');
      }}
      onToggleSound={() => setProgress((p) => ({ ...p, sound: !p.sound }))}
      onAddCoins={() => addCoins(100)}
    />
  );
}

/* ------------------------------------------------------------------ */

function DecoTube({ colors, delay }: { colors: number[]; delay: number }) {
  const segH = 26;
  return (
    <div
      className="anim-wobble relative"
      style={{ width: 44, height: segH * 4 + 14, animationDelay: `${delay}s` }}
    >
      <div
        className="absolute inset-0 overflow-hidden border-[2.5px] border-white/55 bg-white/10"
        style={{
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottomLeftRadius: 22,
          borderBottomRightRadius: 22,
          boxShadow: 'inset 0 -8px 14px rgba(255,255,255,.2)',
        }}
      >
        {colors.map((c, i) => {
          const col = COLORS[c];
          return (
            <div
              key={i}
              className="absolute inset-x-0"
              style={{
                bottom: i * segH,
                height: segH + 1,
                background: `linear-gradient(180deg, ${col.light}, ${col.base} 40%, ${col.dark})`,
              }}
            />
          );
        })}
        <div className="absolute left-[16%] top-[6%] h-[60%] w-[5px] rounded-full bg-white/45 blur-[1px]" />
      </div>
      <div className="absolute -top-[5px] -left-1 -right-1 h-[10px] rounded-full bg-white/70 shadow" />
    </div>
  );
}

function Home({
  progress,
  onPlay,
  onLevels,
  onToggleSound,
  onAddCoins,
}: {
  progress: Progress;
  onPlay: () => void;
  onLevels: () => void;
  onToggleSound: () => void;
  onAddCoins: () => void;
}) {
  const totalStars = useMemo(
    () => Object.values(progress.stars).reduce((a, b) => a + b, 0),
    [progress.stars]
  );
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Background />
      <div className="relative z-10 flex h-full flex-col items-center px-5 py-4">
        <div className="flex w-full max-w-[560px] items-center justify-between">
          <IconButton color="purple" onClick={onToggleSound} title="Sound">
            {progress.sound ? '🔊' : '🔇'}
          </IconButton>
          <CoinPill coins={progress.coins} onAdd={onAddCoins} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-7">
          <div className="text-center">
            <h1
              className="text-[46px] font-extrabold uppercase leading-[0.95] tracking-tight sm:text-[64px]"
              style={{
                background: 'linear-gradient(180deg,#ffffff 20%,#7ee8ff 60%,#3aa8ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 0 rgba(20,10,60,.55)) drop-shadow(0 12px 22px rgba(0,0,0,.5))',
              }}
            >
              Water Sort
            </h1>
            <p className="mt-1 text-lg font-extrabold uppercase tracking-[0.3em] text-amber-200">
              Color Puzzle
            </p>
          </div>

          <div className="flex items-end gap-4">
            <DecoTube colors={[0, 2, 0, 3]} delay={0} />
            <DecoTube colors={[5, 4, 5, 5]} delay={0.35} />
            <DecoTube colors={[7, 6, 1, 1]} delay={0.7} />
          </div>

          <div className="flex w-full max-w-[280px] flex-col gap-3">
            <GameButton color="green" size="lg" onClick={onPlay}>
              ▶ Play Level {progress.unlocked}
            </GameButton>
            <GameButton color="blue" onClick={onLevels}>
              🗺️ Choose Level
            </GameButton>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-black/25 px-5 py-2 text-sm font-bold text-violet-100 backdrop-blur">
            <span>⭐ {totalStars}</span>
            <span className="opacity-40">|</span>
            <span>🏆 {progress.unlocked - 1} solved</span>
          </div>
        </div>

        <p className="pb-2 text-center text-xs font-semibold text-violet-200/70">
          Tap a tube to pick it up, tap another to pour. Sort every color!
        </p>
      </div>
    </div>
  );
}

function LevelSelect({
  progress,
  onBack,
  onPick,
}: {
  progress: Progress;
  onBack: () => void;
  onPick: (n: number) => void;
}) {
  const maxLevel = Math.max(120, progress.unlocked + 20);
  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Background />
      <div className="relative z-10 flex h-full flex-col items-center">
        <div className="flex w-full max-w-[560px] items-center justify-between px-5 pt-4">
          <IconButton color="blue" onClick={onBack} title="Back">
            ◀
          </IconButton>
          <h2 className="text-shadow-game text-2xl font-extrabold uppercase tracking-wider">
            Levels
          </h2>
          <CoinPill coins={progress.coins} />
        </div>

        <div className="mt-4 w-full max-w-[560px] flex-1 overflow-y-auto px-5 pb-8">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {levels.map((n) => {
              const unlocked = n <= progress.unlocked;
              const st = progress.stars[n] ?? 0;
              const cfg = levelConfig(n);
              return (
                <button
                  key={n}
                  disabled={!unlocked}
                  onClick={() => onPick(n)}
                  className="no-select relative aspect-square rounded-2xl border-2 text-white transition active:translate-y-[2px]"
                  style={{
                    background: unlocked
                      ? 'linear-gradient(180deg,#8f45e8,#5a1bb0)'
                      : 'linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.05))',
                    borderColor: unlocked ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.18)',
                    boxShadow: unlocked
                      ? '0 4px 0 #3c0e7a, 0 8px 14px rgba(0,0,0,.3), inset 0 2px 0 rgba(255,255,255,.35)'
                      : 'none',
                    opacity: unlocked ? 1 : 0.55,
                  }}
                >
                  <span className="text-xl font-extrabold">{unlocked ? n : '🔒'}</span>
                  {unlocked && (
                    <>
                      <span className="absolute inset-x-0 bottom-1 text-[10px] leading-none text-amber-200">
                        {'★'.repeat(st)}
                        <span className="opacity-25">{'★'.repeat(3 - st)}</span>
                      </span>
                      <span className="absolute right-1 top-1 rounded-full bg-black/30 px-1 text-[9px] font-bold text-violet-100">
                        {cfg.colors}c
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
