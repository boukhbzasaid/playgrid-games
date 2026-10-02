let ctx: AudioContext | null = null;

let enabled = true;

const sounds = {
  click: new Audio('/sound/click.mp3'),
  pour: new Audio('/sound/pour.mp3'),
  select: new Audio('/sound/select.mp3'),
  win: new Audio('/sound/win.mp3'),
};

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;

    ctx = new AC();
  }

  if (ctx.state === 'suspended') ctx.resume();

  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol = 0.12,
  slideTo?: number
) {
  if (!enabled) return;

  const c = ac();

  if (!c) return;

  const o = c.createOscillator();
  const g = c.createGain();

  o.type = type;

  o.frequency.setValueAtTime(freq, c.currentTime);

  if (slideTo) {
    o.frequency.exponentialRampToValueAtTime(
      slideTo,
      c.currentTime + dur
    );
  }

  g.gain.setValueAtTime(0.0001, c.currentTime);

  g.gain.exponentialRampToValueAtTime(
    vol,
    c.currentTime + 0.02
  );

  g.gain.exponentialRampToValueAtTime(
    0.0001,
    c.currentTime + dur
  );

  o.connect(g).connect(c.destination);

  o.start();

  o.stop(c.currentTime + dur + 0.05);
}

function playSound(sound: HTMLAudioElement) {
  if (!enabled) return;

  sound.currentTime = 0;

  sound.play().catch(() => {});
}

export const sfx = {
  select: () => {
    playSound(sounds.select);
  },

  pour: () => {
  if (!enabled) return;

  sounds.pour.currentTime = 0;
  sounds.pour.play().catch(() => {});

  setTimeout(() => {
    sounds.pour.pause();
    sounds.pour.currentTime = 0;
  }, 1000);
},

  error: () => tone(190, 0.18, 'sawtooth', 0.06, 120),

  // الصوت الأصلي لـ complete لم يتغير
  complete: () => {
    if (!enabled) return;

    const sound = new Audio('/sound/complete.mp3');

    sound.currentTime = 0;

    sound.play();
  },

  win: () => {
    playSound(sounds.win);
  },

  click: () => {
    playSound(sounds.click);
  },
};