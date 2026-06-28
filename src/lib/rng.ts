import seedrandom from "seedrandom";

export type RNG = () => number;

export function makeRng(...parts: (string | number)[]): RNG {
  return seedrandom(parts.join("|"));
}

export function pick<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function rngInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngFloat(rng: RNG, min: number, max: number): number {
  return rng() * (max - min) + min;
}

// FNV-1a 32-bit hash → for combining seeds
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function combineSeed(seed: string, ...parts: (string | number)[]): string {
  return `${seed}::${parts.join(":")}`;
}
