



import { useEffect, useRef } from 'react';
import { CAPACITY, COLORS, type TubeState } from '../game/logic';

type Props = {
  tube: TubeState;
  width: number;
  segH: number;
  selected: boolean;
  hinted?: boolean;
  done: boolean;
  disabled?: boolean;
  tiltStyle?: React.CSSProperties;
  rimColor: string;
  onClick: () => void;
  innerRef?: (el: HTMLDivElement | null) => void;
};

export default function Tube({
  tube,
  width,
  segH,
  selected,
  hinted,
  done,
  disabled,
  tiltStyle,
  rimColor,
  onClick,
  innerRef,
}: Props) {
  const prevLen = useRef(tube.length);
  const grewFrom = tube.length > prevLen.current ? prevLen.current : -1;

  useEffect(() => {
    prevLen.current = tube.length;
  }, [tube.length]);

  const height = segH * CAPACITY + 16;
  const radius = width / 2;

  return (
    <div
      className="no-select relative shrink-0"
      style={{ width, height: height + 22 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      role="button"
    >
      {/* Ground soft shadow & selection glow */}
      {selected ? (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-cyan-300/35 blur-md"
          style={{ bottom: 0, width: width * 1.3, height: 14 }}
        />
      ) : (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-black/25 blur-sm"
          style={{ bottom: 2, width: width * 0.85, height: 8 }}
        />
      )}

      <div
        ref={innerRef}
        className="absolute left-0 cursor-pointer"
        style={{
          width,
          height,
          top: selected || tiltStyle ? 0 : 22,
          transition: tiltStyle
            ? 'transform 330ms cubic-bezier(.4,.05,.25,1), top 160ms ease'
            : 'top 200ms cubic-bezier(.2,1.4,.4,1), transform 300ms cubic-bezier(.4,.05,.25,1)',
          zIndex: tiltStyle ? 60 : selected ? 20 : 1,
          filter: selected
            ? 'drop-shadow(0 14px 16px rgba(0,0,0,.5)) drop-shadow(0 0 8px rgba(255,255,255,0.4))'
            : 'drop-shadow(0 8px 10px rgba(0,0,0,.35))',
          ...tiltStyle,
        }}
      >
        {/* Hint pulse ring */}
        {hinted && !tiltStyle && (
          <div
            className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-amber-300/90 shadow-[0_0_12px_rgba(252,211,77,0.7)]"
            style={{
              borderRadius: radius + 8,
              animation: 'ring-pulse 1s ease-out infinite',
            }}
          />
        )}

        {/* Outer glass tube body */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomLeftRadius: radius,
            borderBottomRightRadius: radius,
            border: '2.5px solid rgba(255, 255, 255, 0.75)',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.14) 100%)',
            boxShadow: `
              inset 0 0 8px rgba(255, 255, 255, 0.4),
              inset 4px 0 6px rgba(255, 255, 255, 0.25),
              inset -4px 0 6px rgba(0, 0, 0, 0.2),
              inset 0 -12px 14px rgba(255, 255, 255, 0.35)
            `,
            backdropFilter: 'blur(1.5px)',
          }}
        >
          {/* Inner back-wall shadow for liquid depth */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%)',
            }}
          />

          {/* Liquid segments */}
          {tube.map((c, i) => {
            const col = COLORS[c % COLORS.length];
            const isTop = i === tube.length - 1;

            return (
              <div
                key={i}
                className={grewFrom >= 0 && i >= grewFrom ? 'anim-pour-in absolute' : 'absolute'}
                style={{
                  left: 0,
                  right: 0,
                  bottom: i * segH,
                  height: segH + (isTop ? 0 : 1),
                  animationDelay: grewFrom >= 0 ? `${(i - grewFrom) * 55}ms` : undefined,
                }}
              >
                {/* 3D Liquid layer background with cylindrical lighting */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${col.light} 0%, ${col.base} 45%, ${col.dark} 100%)`,
                  }}
                />

                {/* Cylindrical 3D shine and ambient shading across the tube */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(255,255,255,0.28) 26%, rgba(255,255,255,0.05) 55%, rgba(0,0,0,0.18) 100%)',
                  }}
                />

                {/* Soft divider line between distinct segments */}
                {!isTop && (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px]"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(0,0,0,0.15), rgba(255,255,255,0.45) 50%, rgba(0,0,0,0.15))',
                    }}
                  />
                )}

                {/* Top liquid dome meniscus & bubbles */}
                {isTop && (
                  <>
                    {/* Liquid surface curve */}
                    <div
                      className="absolute inset-x-0 top-0 overflow-hidden"
                      style={{
                        height: Math.max(6, segH * 0.22),
                        borderRadius: '50% 50% 45% 45% / 80% 80% 20% 20%',
                        background: `linear-gradient(180deg, rgba(255,255,255,0.85) 0%, ${col.light} 60%, ${col.base} 100%)`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                      }}
                    >
                      {/* Top rim inner shine */}
                      <div
                        className="mx-auto mt-[1px] rounded-full bg-white/75"
                        style={{ width: '65%', height: 2 }}
                      />
                    </div>

                    {/* Animated bubbles */}
                    <div
                      className="absolute rounded-full bg-white/70 shadow-[0_0_2px_rgba(255,255,255,0.9)]"
                      style={{
                        width: 4,
                        height: 4,
                        left: '26%',
                        bottom: 6,
                        animation: 'bubble-rise 2.2s ease-in-out infinite',
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-white/60"
                      style={{
                        width: 3,
                        height: 3,
                        left: '66%',
                        bottom: 3,
                        animation: 'bubble-rise 3s ease-in-out 0.6s infinite',
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-white/40"
                      style={{
                        width: 2.5,
                        height: 2.5,
                        left: '46%',
                        bottom: 10,
                        animation: 'bubble-rise 2.6s ease-in-out 1.2s infinite',
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}

          {/* Left Primary Cartoon Glass Reflection (Bold Specular Stripe) */}
          <div
            className="pointer-events-none absolute rounded-full bg-gradient-to-b from-white/70 via-white/40 to-transparent"
            style={{
              left: '12%',
              top: '4%',
              width: Math.max(4, width * 0.12),
              height: '66%',
              filter: 'blur(0.5px)',
            }}
          />

          {/* Secondary micro highlight */}
          <div
            className="pointer-events-none absolute rounded-full bg-white/50"
            style={{
              left: '14%',
              top: '73%',
              width: Math.max(3, width * 0.09),
              height: '10%',
            }}
          />

          {/* Right subtle edge backlight */}
          <div
            className="pointer-events-none absolute rounded-full bg-gradient-to-b from-white/30 via-white/15 to-transparent"
            style={{
              right: '9%',
              top: '8%',
              width: Math.max(2, width * 0.06),
              height: '55%',
              filter: 'blur(0.5px)',
            }}
          />

          {/* Thick glass bottom curve & reflection */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: Math.max(16, radius * 0.85),
              background:
                'linear-gradient(0deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 60%, transparent 100%)',
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius,
            }}
          >
            {/* Bottom curvature inner highlight line */}
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white/60"
              style={{ width: '45%', height: 2.5 }}
            />
          </div>
        </div>

        {/* Premium Cartoon Tube Rim / Cap (Lip Collar) */}
        <div
          className="pointer-events-none absolute -top-[7px] rounded-full"
          style={{
            left: -5,
            right: -5,
            height: 13,
            background: `linear-gradient(180deg, ${rimColor} 0%, #ffffff 25%, ${rimColor} 75%, rgba(0,0,0,0.3) 100%)`,
            border: '2px solid rgba(255, 255, 255, 0.85)',
            boxShadow: `
              0 3px 6px rgba(0, 0, 0, 0.25),
              inset 0 2px 2px rgba(255, 255, 255, 0.9),
              inset 0 -2px 3px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          {/* Top gloss line on rim */}
          <div
            className="mx-auto mt-[1px] rounded-full bg-white/80"
            style={{ width: '75%', height: 2 }}
          />
        </div>

        {/* Inner tube neck hole (depth illusion) */}
        <div
          className="pointer-events-none absolute -top-[5px] left-[-1px] right-[-1px] rounded-full"
          style={{
            height: 5,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.2) 100%)',
          }}
        />

        {/* Completed tube celebration sparkle */}
        {done && tube.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="anim-pop select-none text-3xl filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.75)]">
              ✨
            </span>
          </div>
        )}
      </div>
    </div>
  );
}