// Web Audio API procedural music — Maqam Hijaz ambient track
// Self-contained singleton: startMusic() / stopMusic()

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const droneNodes: OscillatorNode[] = [];
let melodyTimer: ReturnType<typeof setTimeout> | null = null;
let active = false;

const ROOT_HZ = 110; // A2

// Maqam Hijaz intervals (semitones from root): characteristic augmented 2nd between b2 and M3
const HIJAZ = [0, 1, 4, 5, 7, 8, 11];

function toHz(semitone: number): number {
  return ROOT_HZ * Math.pow(2, semitone / 12);
}

function buildReverb(ac: AudioContext): ConvolverNode {
  const conv = ac.createConvolver();
  const length = Math.floor(ac.sampleRate * 2.6);
  const buf = ac.createBuffer(2, length, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.1);
    }
  }
  conv.buffer = buf;
  return conv;
}

function playNote(
  dest: AudioNode,
  ac: AudioContext,
  hz: number,
  t0: number,
  dur: number,
  vol: number,
  type: OscillatorType = "sine",
): void {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.value = hz;
  env.gain.setValueAtTime(0.001, t0);
  env.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.12, dur * 0.18));
  env.gain.setValueAtTime(vol * 0.72, t0 + dur * 0.65);
  env.gain.linearRampToValueAtTime(0.001, t0 + dur);
  osc.connect(env);
  env.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.08);
}

// Melodic phrases — degree indices into HIJAZ (negative = below root octave)
const PHRASE_A = [4, 3, 1, 0, 1, 3, 4, 5, 4, 3, 4, 1, 0];
const PHRASE_B = [2, 1, 0, -1, 0, 1, 2, 4, 3, 1, 0, 1];
const PHRASE_C = [5, 4, 3, 1, 0, 1, 3, 4, 5, 6, 5, 4, 3, 1, 0];
const PHRASES = [PHRASE_A, PHRASE_B, PHRASE_C];
const BEAT = 0.54;

function scheduleMelody(dest: AudioNode, ac: AudioContext, t: number): void {
  if (!active) return;
  const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
  let cursor = t;

  phrase.forEach((deg, i) => {
    const semitone = deg >= 0
      ? HIJAZ[deg % HIJAZ.length]
      : -12 + HIJAZ[0];
    const hz = toHz(semitone + 12); // one octave above drone
    const isLast = i === phrase.length - 1;
    const beats = isLast ? 3.5 : i % 4 === 3 ? 1.6 : 1.0;
    const dur = beats * BEAT * 0.85;
    playNote(dest, ac, hz, cursor, dur, 0.075);
    // Octave lower soft shadow on some notes
    if (i % 4 === 0) playNote(dest, ac, hz * 0.5, cursor, dur * 0.7, 0.038);
    cursor += beats * BEAT;
  });

  const totalTime = cursor - t;
  melodyTimer = setTimeout(() => {
    if (!active || !audioCtx) return;
    scheduleMelody(dest, audioCtx, audioCtx.currentTime + 0.08);
  }, (totalTime - 0.25) * 1000);
}

export function startMusic(): void {
  if (active) return;
  active = true;
  try {
    audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.52, audioCtx.currentTime + 3.5);
    masterGain.connect(audioCtx.destination);

    const reverb = buildReverb(audioCtx);
    reverb.connect(masterGain);

    const dryBus = audioCtx.createGain();
    dryBus.gain.value = 0.5;
    dryBus.connect(masterGain);

    const wetSend = audioCtx.createGain();
    wetSend.gain.value = 0.5;
    wetSend.connect(reverb);

    const mixBus = audioCtx.createGain();
    mixBus.gain.value = 1;
    mixBus.connect(dryBus);
    mixBus.connect(wetSend);

    // Drone layers — root, detuned root, sub-octave, fifth
    const droneFreqs: [number, number][] = [
      [ROOT_HZ, 0.14],
      [ROOT_HZ * 1.0015, 0.09],
      [ROOT_HZ * 0.5, 0.11],
      [ROOT_HZ * 1.5, 0.055],
      [ROOT_HZ * 2, 0.035],
    ];
    droneFreqs.forEach(([hz, vol]) => {
      const osc = audioCtx!.createOscillator();
      const g = audioCtx!.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      g.gain.value = vol;
      osc.connect(g);
      g.connect(mixBus);
      osc.start();
      droneNodes.push(osc);
    });

    scheduleMelody(mixBus, audioCtx, audioCtx.currentTime + 1.8);
  } catch (err) {
    active = false;
    console.warn("Web Audio unavailable:", err);
  }
}

export function stopMusic(): void {
  if (!active) return;
  active = false;
  if (melodyTimer) clearTimeout(melodyTimer);
  if (audioCtx && masterGain) {
    masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.6);
    const ac = audioCtx;
    audioCtx = null;
    masterGain = null;
    setTimeout(() => {
      droneNodes.splice(0).forEach((o) => { try { o.stop(); } catch {} });
      ac.close();
    }, 2200);
  }
}
