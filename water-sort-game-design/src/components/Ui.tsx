import type { ReactNode } from 'react';

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  title?: string;
};

const palettes: Record<string, { top: string; bottom: string; edge: string; ring: string }> = {
  green: { top: '#5ce268', bottom: '#22a437', edge: '#14702a', ring: '#8dfb9a' },
  blue: { top: '#57b6ff', bottom: '#1f6de0', edge: '#134aa3', ring: '#9fd8ff' },
  orange: { top: '#ffb44d', bottom: '#f47a15', edge: '#b5510a', ring: '#ffd79a' },
  purple: { top: '#c07bff', bottom: '#8433e0', edge: '#5a1aa3', ring: '#e0bcff' },
  red: { top: '#ff7a72', bottom: '#e03a2e', edge: '#9c1d16', ring: '#ffb3ad' },
  glass: { top: 'rgba(255,255,255,.28)', bottom: 'rgba(255,255,255,.12)', edge: 'rgba(0,0,0,.35)', ring: 'rgba(255,255,255,.6)' },
};

export function GameButton({
  children,
  onClick,
  color = 'green',
  size = 'md',
  className = '',
  disabled,
  title,
}: BtnProps) {
  const p = palettes[color];
  const pad =
    size === 'lg' ? 'px-8 py-3.5 text-2xl' : size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5 text-lg';
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`no-select relative overflow-hidden rounded-2xl font-extrabold tracking-wide text-white transition active:translate-y-[3px] disabled:opacity-40 disabled:active:translate-y-0 ${pad} ${className}`}
      style={{
        background: `linear-gradient(180deg, ${p.top}, ${p.bottom})`,
        border: `2px solid rgba(255,255,255,.45)`,
        boxShadow: `0 5px 0 ${p.edge}, 0 10px 18px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.45)`,
        textShadow: '0 2px 3px rgba(0,0,0,.35)',
      }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/25"
        style={{ animation: 'shine-sweep 3.6s ease-in-out infinite' }}
      />
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  color = 'blue',
  disabled,
  badge,
  title,
}: BtnProps & { badge?: ReactNode }) {
  const p = palettes[color];
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="no-select relative grid h-12 w-12 place-items-center rounded-2xl text-xl text-white transition active:translate-y-[3px] disabled:opacity-40 disabled:active:translate-y-0"
      style={{
        background: `linear-gradient(180deg, ${p.top}, ${p.bottom})`,
        border: '2px solid rgba(255,255,255,.45)',
        boxShadow: `0 4px 0 ${p.edge}, 0 8px 14px rgba(0,0,0,.32), inset 0 2px 0 rgba(255,255,255,.4)`,
      }}
    >
      {children}
      {badge !== undefined && (
        <span className="absolute -bottom-2 -right-2 rounded-full border border-white/50 bg-[#2b1055] px-1.5 py-[1px] text-[10px] font-bold text-amber-200 shadow">
          {badge}
        </span>
      )}
    </button>
  );
}

export function CoinPill({ coins, onAdd }: { coins: number; onAdd?: () => void }) {
  return (
    <div className="no-select flex items-center gap-2 rounded-full border-2 border-white/40 bg-[#3a1670]/80 py-1 pl-2 pr-1 shadow-[0_4px_10px_rgba(0,0,0,.35)] backdrop-blur">
      <img 
  width="48" 
  height="48" 
  src="/img/removebg.png" 
  alt="coin" 
/>
      <span className="min-w-[52px] text-center text-lg font-extrabold text-amber-200 tabular-nums">
        {coins}
      </span>
      <button
        onClick={onAdd}
        className="grid h-7 w-7 place-items-center rounded-full text-sm font-black text-white"
        style={{
          background: 'linear-gradient(180deg,#ffb44d,#f47a15)',
          boxShadow: '0 2px 0 #b5510a, inset 0 1px 0 rgba(255,255,255,.5)',
        }}
      >
        +
      </button>
    </div>
  );
}

export function Confetti() {
  const pieces = Array.from({ length: 70 }, (_, i) => i);
  const colors = ['#ff4d6d', '#ffd23f', '#3ddc84', '#4cc9f0', '#b15cff', '#ff8a1e'];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.4;
        const dur = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 9;
        return (
          <span
            key={i}
            className="absolute top-0"
            style={{
              left: `${left}%`,
              width: size,
              height: size * (Math.random() > 0.5 ? 1 : 0.5),
              background: colors[i % colors.length],
              borderRadius: Math.random() > 0.6 ? '50%' : 2,
              animation: `confetti-fall ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export function Stars({ count, size = 34 }: { count: number; size?: number }) {
  return (
    <div className="flex items-end justify-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < count ? 'anim-pop' : ''}
          style={{
            fontSize: i === 1 ? size * 1.25 : size,
            animationDelay: `${i * 160}ms`,
            filter: i < count ? 'drop-shadow(0 0 10px rgba(255,210,60,.9))' : 'grayscale(1)',
            opacity: i < count ? 1 : 0.3,
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
