import { useMemo } from 'react';

export default function Background() {
  const stars = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 4,
        dur: 2.5 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, #6a2bb8 0%, #4a1a8f 38%, #2c0f5e 70%, #1b0840 100%)',
        }}
      />
      {/* glowing blobs */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 420,
          height: 420,
          left: '-14%',
          top: '8%',
          background: 'radial-gradient(circle, rgba(255,70,180,.35), transparent 65%)',
          animation: 'float-blob 11s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 380,
          height: 380,
          right: '-12%',
          top: '22%',
          background: 'radial-gradient(circle, rgba(60,160,255,.32), transparent 65%)',
          animation: 'float-blob 14s ease-in-out 1.5s infinite',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 520,
          height: 320,
          left: '20%',
          bottom: '-12%',
          background: 'radial-gradient(circle, rgba(255,150,40,.22), transparent 65%)',
          animation: 'float-blob 16s ease-in-out .8s infinite',
        }}
      />
      {/* stars */}
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      {/* bottom hills */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        style={{ height: 150 }}
      >
        <path d="M0 70 Q 60 30 130 62 T 260 58 T 400 76 L400 120 L0 120Z" fill="rgba(20,4,48,.55)" />
        <path d="M0 92 Q 80 60 170 86 T 320 82 T 400 98 L400 120 L0 120Z" fill="rgba(12,2,34,.75)" />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_45%,transparent_40%,rgba(10,2,30,.55)_100%)]" />
    </div>
  );
}
