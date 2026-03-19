// audio.js — Web Audio API 効果音

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playNote(frequency, duration = 0.8) {
  const ctx = getAudioCtx();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playClearSound() {
  const ctx = getAudioCtx();
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  const times = [0, 0.15, 0.3, 0.5];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + times[i]);

    gain.gain.setValueAtTime(0, ctx.currentTime + times[i]);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + times[i] + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + times[i] + 0.5);

    osc.start(ctx.currentTime + times[i]);
    osc.stop(ctx.currentTime + times[i] + 0.5);
  });
}

export function resumeAudioContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
