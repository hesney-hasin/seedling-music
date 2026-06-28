// Shared music composition. Schedules a seeded ~8-bar piece onto a Tone destination.
// Used by SongPlayer (live) and the MP3 exporter (offline render).
import { makeRng, pick, rngInt } from "@/lib/rng";

const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const PROGRESSIONS: number[][] = [
  [1, 5, 6, 4],
  [6, 4, 1, 5],
  [1, 6, 4, 5],
  [2, 5, 1, 6],
  [1, 4, 5, 4],
  [6, 7, 1, 5],
];

const ROOT_NOTES = ["C", "D", "E", "F", "G", "A"];
const NOTE_TO_MIDI: Record<string, number> = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71 };

function midiToNoteName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  return names[midi % 12] + octave;
}

export type ScheduleResult = {
  duration: number;
  bpm: number;
  dispose: () => void;
};

/**
 * Schedule the seeded composition starting at absolute Tone time `startAt`.
 * Pass the Tone module so the caller can use Tone.Offline or the live Tone.
 */
export function scheduleComposition(Tone: typeof import("tone"), seed: string, startAt: number): ScheduleResult {
  const rng = makeRng(seed, "music");
  const scaleName = pick(rng, Object.keys(SCALES));
  const scale = SCALES[scaleName];
  const rootName = pick(rng, ROOT_NOTES);
  const rootMidi = NOTE_TO_MIDI[rootName];
  const progression = pick(rng, PROGRESSIONS);
  const bpm = rngInt(rng, 78, 132);
  const beatsPerBar = 4;
  const beatSec = 60 / bpm;
  const barSec = beatSec * beatsPerBar;
  const bars = 8;
  const totalSec = bars * barSec;

  Tone.getTransport().bpm.value = bpm;

  const reverb = new Tone.Reverb({ decay: rngInt(rng, 2, 5), wet: 0.28 }).toDestination();
  const delay = new Tone.FeedbackDelay({ delayTime: beatSec / 2, feedback: 0.22, wet: 0.18 }).connect(reverb);

  const padOptions = [
    () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" }, envelope: { attack: 0.6, decay: 0.3, sustain: 0.7, release: 1.6 } }),
    () => new Tone.PolySynth(Tone.AMSynth, { envelope: { attack: 0.4, decay: 0.4, sustain: 0.6, release: 1.4 } }),
    () => new Tone.PolySynth(Tone.FMSynth, { envelope: { attack: 0.5, decay: 0.4, sustain: 0.6, release: 1.5 } }),
  ];
  const pad = pick(rng, padOptions)().connect(reverb);
  pad.volume.value = -12;

  const lead = new Tone.Synth({
    oscillator: { type: pick(rng, ["triangle", "sine", "sawtooth"]) as OscillatorType },
    envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.4 },
  }).connect(delay);
  lead.volume.value = -10;

  const bass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.3 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4, baseFrequency: 200, octaves: 2.5 },
  }).toDestination();
  bass.volume.value = -8;

  const kick = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 6 }).toDestination();
  kick.volume.value = -6;
  const hat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination();
  hat.volume.value = -28;

  function degreeToChord(degree: number): number[] {
    const i = (degree - 1) % scale.length;
    const root = scale[i];
    const third = scale[(i + 2) % scale.length] + (i + 2 >= scale.length ? 12 : 0);
    const fifth = scale[(i + 4) % scale.length] + (i + 4 >= scale.length ? 12 : 0);
    return [rootMidi + root, rootMidi + third, rootMidi + fifth];
  }

  for (let bar = 0; bar < bars; bar++) {
    const degree = progression[bar % progression.length];
    const chord = degreeToChord(degree);
    const chordNames = chord.map(midiToNoteName);
    const barStart = startAt + bar * barSec;

    pad.triggerAttackRelease(chordNames, barSec * 0.95, barStart);
    bass.triggerAttackRelease(midiToNoteName(chord[0] - 24), beatSec * 0.9, barStart);
    bass.triggerAttackRelease(midiToNoteName(chord[2] - 24), beatSec * 0.9, barStart + beatSec * 2);

    for (let b = 0; b < beatsPerBar; b++) {
      const t = barStart + b * beatSec;
      if (b === 0 || b === 2) kick.triggerAttackRelease("C1", 0.2, t);
      hat.triggerAttackRelease("C5", 0.04, t + beatSec * 0.5);
    }

    const noteCount = 8;
    const chordTones = chord.map((m) => m + 12);
    const scaleNotes = scale.map((s) => rootMidi + 12 + s);
    for (let n = 0; n < noteCount; n++) {
      const t = barStart + (n / noteCount) * barSec;
      const useChord = rng() < 0.55;
      const note = useChord ? pick(rng, chordTones) : pick(rng, scaleNotes);
      const dur = beatSec * pick(rng, [0.25, 0.5, 0.5, 0.75]);
      if (rng() < 0.85) {
        lead.triggerAttackRelease(midiToNoteName(note), dur, t);
      }
    }
  }

  return {
    duration: totalSec,
    bpm,
    dispose: () => {
      try {
        pad.dispose();
        lead.dispose();
        bass.dispose();
        kick.dispose();
        hat.dispose();
        delay.dispose();
        reverb.dispose();
      } catch {}
    },
  };
}
