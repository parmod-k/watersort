import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/** Short game sound effects. Players are created lazily and reused; every call fails silently. */
const sources = {
  pour: require('../assets/sounds/pour.mp3'),
  plop: require('../assets/sounds/plop.wav'),
  chime: require('../assets/sounds/chime.wav'),
};

type Sfx = keyof typeof sources;

const players: Partial<Record<Sfx, AudioPlayer>> = {};
let modeSet = false;

function player(name: Sfx) {
  if (!modeSet) {
    modeSet = true;
    // Sound effects respect the silent switch and never interrupt the player's own music.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }
  return (players[name] ??= createAudioPlayer(sources[name]));
}

export function playSfx(name: Sfx, { volume = 1, rate = 1 }: { volume?: number; rate?: number } = {}) {
  try {
    const p = player(name);
    p.volume = volume;
    p.playbackRate = rate;
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {}
}

export function stopSfx(name: Sfx) {
  try {
    players[name]?.pause();
  } catch {}
}
