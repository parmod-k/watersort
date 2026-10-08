import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/** Short game sound effects. Players are created lazily and reused; every call fails silently. */
const sources = {
  pour: require('../assets/sounds/pour.mp3'),
  plop: require('../assets/sounds/plop.wav'),
  chime: require('../assets/sounds/chime.wav'),
};

type Sfx = keyof typeof sources;
type Levels = { volume?: number; rate?: number };

const players: Partial<Record<Sfx, AudioPlayer>> = {};
const ramps: Partial<Record<Sfx, ReturnType<typeof setInterval>>> = {};
let modeSet = false;

function player(name: Sfx) {
  if (!modeSet) {
    modeSet = true;
    // Sound effects respect the silent switch and never interrupt the player's own music.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }
  if (!players[name]) {
    const p = createAudioPlayer(sources[name]);
    // A changed rate should shift the pitch too, like a real vessel's note rising as it fills.
    p.shouldCorrectPitch = false;
    players[name] = p;
  }
  return players[name];
}

export function playSfx(name: Sfx, { volume = 1, rate = 1 }: Levels = {}) {
  try {
    clearInterval(ramps[name]);
    const p = player(name);
    p.volume = volume;
    p.playbackRate = rate;
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {}
}

/** Glides a playing sound's volume and/or rate to new values over `ms`, then calls `onDone`. */
export function rampSfx(name: Sfx, to: Levels, ms: number, onDone?: () => void) {
  const p = players[name];
  if (!p) return;
  clearInterval(ramps[name]);
  const fromVolume = p.volume;
  const fromRate = p.playbackRate;
  const steps = Math.max(1, Math.round(ms / 30));
  let i = 0;
  ramps[name] = setInterval(() => {
    i += 1;
    const k = i / steps;
    try {
      if (to.volume !== undefined) p.volume = fromVolume + (to.volume - fromVolume) * k;
      if (to.rate !== undefined) p.playbackRate = fromRate + (to.rate - fromRate) * k;
    } catch {}
    if (i >= steps) {
      clearInterval(ramps[name]);
      onDone?.();
    }
  }, ms / steps);
}

/** Stops a sound, fading it out over `fadeMs` so a cut-off loop never clicks. */
export function stopSfx(name: Sfx, fadeMs = 0) {
  const p = players[name];
  if (!p) return;
  const stop = () => {
    try {
      p.pause();
      p.seekTo(0).catch(() => {});
    } catch {}
  };
  clearInterval(ramps[name]);
  if (fadeMs <= 0) return stop();
  rampSfx(name, { volume: 0 }, fadeMs, stop);
}
