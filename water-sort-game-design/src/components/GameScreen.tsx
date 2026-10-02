import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CAPACITY,
  COLORS,
  applyPour,
  canPour,
  computePar,
  generateLevel,
  isSolved,
  isTubeDone,
  pourAmount,
  solve,
  starRating,
  top,
  type Board,
  type Move,
} from '../game/logic';
import { sfx } from '../game/sound';
import Tube from './Tube';
import { CoinPill, Confetti, GameButton, IconButton, Stars } from './Ui';

const RIMS = ['#fb923c', '#4ade80', '#38bdf8', '#f472b6', '#facc15', '#a78bfa', '#f87171', '#2dd4bf'];

type PourAnim = {
  from: number;
  to: number;
  color: number;
  transform: string;
  streamX: number;
  streamY: number;
  streamH: number;
  phase: 'tilt' | 'flow' | 'back';
};

type Props = {
  level: number;
  coins: number;
  onCoins: (delta: number) => void;
  onWin: (level: number, stars: number) => void;
  onExit: () => void;
  onNext: () => void;
  onRestartLevel: () => void;
};

export default function GameScreen({
  level,
  coins,
  onCoins,
  onWin,
  onExit,
  onNext,
  onRestartLevel,
}: Props) {
  const [board, setBoard] = useState<Board | null>(null);
  const [history, setHistory] = useState<Board[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [pour, setPour] = useState<PourAnim | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [stars, setStars] = useState(3);
  const [hint, setHint] = useState<Move | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [extraUsed, setExtraUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const optimal = useRef(0);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const tubeEls = useRef<(HTMLDivElement | null)[]>([]);
  const timers = useRef<number[]>([]);

  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth));
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 760 : window.innerHeight));

  useLayoutEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ---------------- level setup ---------------- */
  useEffect(() => {
    setLoading(true);
    setBoard(null);
    setHistory([]);
    setSelected(null);
    setPour(null);
    setMoves(0);
    setWon(false);
    setHint(null);
    setExtraUsed(false);
    const t = window.setTimeout(() => {
      const b = generateLevel(level);
      optimal.current = computePar(b);
      setBoard(b);
      setLoading(false);
    }, 40);
    return () => {
      window.clearTimeout(t);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [level]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ---------------- sizing ---------------- */
  const tubeCount = board?.length ?? 0;
  const { perRow, tubeW, segH, gap } = useMemo(() => {
    const n = Math.max(tubeCount, 1);
    const rows = n <= 5 ? 1 : n <= 12 ? 2 : 3;
    const pr = Math.ceil(n / rows);
    const maxW = Math.min(vw - 24, 520);
    const g = pr > 5 ? 8 : 14;
    let w = Math.floor((maxW - g * (pr - 1)) / pr) - 2;
    w = Math.max(30, Math.min(w, 58));
    const availH = vh - 250;
    let s = Math.floor((availH / rows - 62) / CAPACITY);
    s = Math.max(17, Math.min(s, 34, Math.round(w * 0.72)));
    return { perRow: pr, tubeW: w, segH: s, gap: g };
  }, [tubeCount, vw, vh]);

  const rowsArr = useMemo(() => {
    if (!board) return [];
    const out: number[][] = [];
    for (let i = 0; i < board.length; i += perRow) {
      out.push(board.slice(i, i + perRow).map((_, k) => i + k));
    }
    return out;
  }, [board, perRow]);

  /* ---------------- pour ---------------- */
  const doPour = useCallback(
    (from: number, to: number) => {
      if (!board || pour) return;
      const bRect = boardRef.current?.getBoundingClientRect();
      const aEl = tubeEls.current[from];
      const bEl = tubeEls.current[to];
      if (!bRect || !aEl || !bEl) return;

      const a = aEl.getBoundingClientRect();
      const t = bEl.getBoundingClientRect();
      const w = a.width;
      const h = a.height;
      const ax = a.left - bRect.left;
      const ay = a.top - bRect.top;
      const tx0 = t.left - bRect.left;
      const ty0 = t.top - bRect.top;

      const dir = tx0 + w / 2 < ax + w / 2 ? -1 : 1;
      const deg = dir * 64;
      const rad = (deg * Math.PI) / 180;
      const cx = ax + w / 2;
      const cy = ay + h / 2;
      // mouth (local 0,-h/2) after rotation
      const mx = (h / 2) * Math.sin(rad);
      const my = -(h / 2) * Math.cos(rad);
      const px = tx0 + w / 2 - dir * 4;
      const py = ty0 - 30;
      const tX = px - cx - mx;
      const tY = py - cy - my;

      const filled = board[to].length;
      const surfaceY = ty0 + h - 3 - filled * segH;
      const streamH = Math.max(18, surfaceY - py - 4);

      const color = top(board[from]);
      sfx.pour();
      setSelected(null);
      setHint(null);
      setPour({
        from,
        to,
        color,
        transform: `translate(${tX}px, ${tY}px) rotate(${deg}deg)`,
        streamX: px,
        streamY: py + 4,
        streamH,
        phase: 'tilt',
      });

      const after = applyPour(board, from, to);
      timers.current.push(
        window.setTimeout(() => {
          setHistory((hst) => [...hst, board.map((x) => x.slice())]);
          setBoard(after);
          setMoves((m) => m + 1);
          setPour((p) => (p ? { ...p, phase: 'flow' } : p));
          if (isTubeDone(after[to]) && after[to].length === CAPACITY) sfx.complete();
        }, 340)
      );
      timers.current.push(
        window.setTimeout(() => setPour((p) => (p ? { ...p, phase: 'back' } : p)), 340 + 430)
      );
      timers.current.push(
        window.setTimeout(() => {
          setPour(null);
          if (isSolved(after)) {
            const s = starRating(moves + 1, optimal.current);
            setStars(s);
            setWon(true);
            sfx.win();
            onWin(level, s);
          }
        }, 340 + 430 + 320)
      );
    },
    [board, pour, segH, moves, level, onWin]
  );

  const clickTube = (i: number) => {
    if (!board || pour || won || loading) return;
    if (selected === null) {
      if (!board[i].length) {
        sfx.error();
        return;
      }
      if (isTubeDone(board[i]) && board[i].length === CAPACITY) {
        sfx.error();
        setShake(i);
        window.setTimeout(() => setShake(null), 360);
        return;
      }
      sfx.select();
      setSelected(i);
      return;
    }
    if (selected === i) {
      setSelected(null);
      sfx.click();
      return;
    }
    if (canPour(board, selected, i) && pourAmount(board, selected, i) > 0) {
      doPour(selected, i);
    } else {
      sfx.error();
      setShake(i);
      window.setTimeout(() => setShake(null), 360);
      if (board[i].length) setSelected(i);
      else setSelected(null);
    }
  };

  /* ---------------- power ups ---------------- */
  const undo = () => {
    if (!history.length || pour || won) return;
    sfx.click();
    setBoard(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setMoves((m) => Math.max(0, m - 1));
    setSelected(null);
    setHint(null);
  };

  const restart = () => {
    sfx.click();
    onRestartLevel();
  };

  const addTube = () => {
    if (!board || extraUsed || pour || won) return;
    if (coins < 100) {
      setToast('Not enough coins!');
      sfx.error();
      return;
    }
    sfx.click();
    onCoins(-100);
    setExtraUsed(true);
    setHistory((h) => [...h, board.map((x) => x.slice())]);
    setBoard([...board.map((x) => x.slice()), []]);
    setSelected(null);
  };

  const useHint = () => {
    if (!board || pour || won) return;
    if (coins < 50) {
      setToast('Not enough coins!');
      sfx.error();
      return;
    }
    const sol = solve(board, 70000);
    if (!sol || !sol.length) {
      setToast('No move found — try undo!');
      sfx.error();
      return;
    }
    sfx.click();
    onCoins(-50);
    setHint(sol[0]);
    setSelected(sol[0].from);
    window.setTimeout(() => setHint(null), 3000);
  };

  const completedCount = board ? board.filter((t) => t.length === CAPACITY && isTubeDone(t)).length : 0;
  const totalColors = board ? new Set(board.flat()).size : 0;

  const stuck = useMemo(() => {
    if (!board || won || pour || loading) return false;
    for (let i = 0; i < board.length; i++)
      for (let j = 0; j < board.length; j++) if (canPour(board, i, j)) return false;
    return !isSolved(board);
  }, [board, won, pour, loading]);

  return (
    <div className="relative z-10 flex h-full w-full flex-col items-center">
      {/* top bar */}
      <div className="flex w-full max-w-[560px] items-center justify-between px-4 pt-4">
        <IconButton color="blue" onClick={onExit} title="Home">
          🏠
        </IconButton>
        <CoinPill coins={coins} onAdd={() => { onCoins(100); setToast('+100 coins!'); sfx.complete(); }} />
      </div>

      <div className="mt-2 text-center">
        <h1
          className="text-shadow-game text-[34px] font-extrabold uppercase leading-none tracking-wider"
          style={{
            background: 'linear-gradient(180deg,#fff,#ffd9a0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.35))',
          }}
        >
          Level {level}
        </h1>
        <div className="mt-1 flex items-center justify-center gap-3 text-xs font-bold text-violet-200">
          <span>🎯 {moves} moves</span>
          <span>🧪 {completedCount}/{totalColors} sorted</span>
        </div>
      </div>

      {/* board */}
      <div
        ref={boardRef}
        onClick={() => {
          if (!pour) setSelected(null);
        }}
        className="relative mt-3 flex w-full max-w-[560px] flex-1 flex-col items-center justify-center gap-3 px-3"
      >
        {loading && (
          <div className="flex flex-col items-center gap-3 text-violet-200">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <span className="font-bold">Mixing colors…</span>
          </div>
        )}

        {board &&
          rowsArr.map((row, ri) => (
            <div key={ri} className="flex items-end justify-center" style={{ gap }}>
              {row.map((idx) => (
                <div key={idx} className={shake === idx ? 'anim-shake' : undefined}>
                  <Tube
                    tube={board[idx]}
                    width={tubeW}
                    segH={segH}
                    selected={selected === idx && !pour}
                    hinted={hint ? hint.from === idx || hint.to === idx : false}
                    done={board[idx].length === CAPACITY && isTubeDone(board[idx])}
                    disabled={!!pour || won}
                    rimColor={RIMS[idx % RIMS.length]}
                    tiltStyle={
                      pour && pour.from === idx
                        ? {
                            transform: pour.phase === 'back' ? undefined : pour.transform,
                            transformOrigin: 'center',
                          }
                        : undefined
                    }
                    onClick={() => clickTube(idx)}
                    innerRef={(el) => (tubeEls.current[idx] = el)}
                  />
                </div>
              ))}
            </div>
          ))}

        {/* pouring stream */}
        {pour && pour.phase !== 'back' && (
          <div
            className="pointer-events-none absolute z-50"
            style={{ left: pour.streamX - 6, top: pour.streamY, width: 12, height: pour.streamH }}
          >
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(180deg, ${COLORS[pour.color].light}, ${
                  COLORS[pour.color].base
                } 45%, ${COLORS[pour.color].dark})`,
                borderRadius: 8,
                transformOrigin: 'top',
                animation: 'stream-grow 160ms ease-out both',
                boxShadow: `0 0 12px ${COLORS[pour.color].base}aa`,
              }}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width: 22,
                height: 9,
                background: COLORS[pour.color].base,
                filter: 'blur(1px)',
                opacity: 0.85,
              }}
            />
          </div>
        )}
      </div>

      {stuck && (
        <div className="anim-pop mx-4 mb-1 rounded-2xl border-2 border-rose-300/60 bg-rose-600/80 px-4 py-2 text-center text-sm font-extrabold shadow-lg">
          😵 No moves left! Undo, add a tube or restart.
        </div>
      )}

      {/* bottom controls */}
      <div className="mb-5 mt-2 flex w-full max-w-[560px] items-center justify-center gap-4 px-4">
        <IconButton color="orange" onClick={undo} disabled={!history.length || !!pour || won} title="Undo">
          ↩️
        </IconButton>
        <IconButton color="purple" onClick={restart} title="Restart">
          🔄
        </IconButton>
        <IconButton
          color="green"
          onClick={addTube}
          disabled={extraUsed || won}
          badge="100"
          title="Add tube"
        >
          ➕
        </IconButton>
        <IconButton color="blue" onClick={useHint} disabled={!!pour || won} badge="50" title="Hint">
          💡
        </IconButton>
      </div>

      {toast && (
        <div className="anim-pop pointer-events-none fixed left-1/2 top-1/2 z-[70] -translate-x-1/2 rounded-2xl border-2 border-white/40 bg-[#3a1670]/95 px-6 py-3 text-lg font-extrabold shadow-2xl">
          {toast}
        </div>
      )}

      {/* win overlay */}
      {won && (
        <>
          <Confetti />
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm">
            <div
              className="anim-pop w-full max-w-[360px] rounded-[28px] border-[3px] border-white/50 p-6 text-center shadow-2xl"
              style={{ background: 'linear-gradient(180deg,#7b31d6,#40158f)' }}
            >
              <div className="text-shadow-game text-3xl font-extrabold uppercase tracking-wide text-amber-200">
                Level Complete!
              </div>
              <div className="mt-3">
                <Stars count={stars} />
              </div>
              <div className="mt-3 text-sm font-bold text-violet-100">
                Solved in {moves} moves · Par {optimal.current}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-amber-200/60 bg-black/25 px-4 py-1.5 text-lg font-extrabold text-amber-200">
                💰 +{50 + stars * 25}
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <GameButton color="green" size="lg" onClick={onNext}>
                  Next Level ▶
                </GameButton>
                <div className="flex justify-center gap-3">
                  <GameButton color="orange" onClick={restart}>
                    🔄 Replay
                  </GameButton>
                  <GameButton color="blue" onClick={onExit}>
                    🏠 Home
                  </GameButton>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
