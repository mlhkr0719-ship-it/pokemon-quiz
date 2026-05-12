let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainVal = 0.3,
  startTime = 0
) {
  const c = getCtx();
  if (!c) return;

  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.connect(gain);
  gain.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startTime);

  gain.gain.setValueAtTime(gainVal, c.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startTime + duration);

  osc.start(c.currentTime + startTime);
  osc.stop(c.currentTime + startTime + duration);
}

export function playCorrectSound() {
  // Happy ascending tones
  playTone(523, 0.15, 'sine', 0.3, 0);
  playTone(659, 0.15, 'sine', 0.3, 0.1);
  playTone(784, 0.2, 'sine', 0.3, 0.2);
  playTone(1047, 0.3, 'sine', 0.25, 0.35);
}

export function playWrongSound() {
  // Sad descending tones
  playTone(440, 0.2, 'square', 0.2, 0);
  playTone(330, 0.3, 'square', 0.15, 0.2);
}

export function playLevelUpSound() {
  [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => {
    playTone(f, 0.12, 'sine', 0.25, i * 0.08);
  });
}

export function playGameOverSound() {
  playTone(392, 0.3, 'square', 0.2, 0);
  playTone(349, 0.3, 'square', 0.2, 0.3);
  playTone(330, 0.5, 'square', 0.2, 0.6);
}

export function resumeContext() {
  const c = getCtx();
  if (c && c.state === 'suspended') {
    c.resume();
  }
}
