// Render songs as MP3s offline and bundle into a ZIP.
import type { Song } from "@/lib/songs.functions";
import { scheduleComposition } from "@/lib/music";

function sanitize(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

// AudioBuffer (Float32, any sample rate) → MP3 Uint8Array using lamejs.
async function audioBufferToMp3(buffer: AudioBuffer, kbps = 128): Promise<Uint8Array> {
  const lameMod: any = await import("@breezystack/lamejs");
  const lamejs = lameMod.default ?? lameMod;
  const channels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);

  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : null;

  // Float32 [-1,1] → Int16
  const len = left.length;
  const leftI = new Int16Array(len);
  const rightI = right ? new Int16Array(len) : null;
  for (let i = 0; i < len; i++) {
    leftI[i] = Math.max(-1, Math.min(1, left[i])) * 0x7fff;
    if (rightI && right) rightI[i] = Math.max(-1, Math.min(1, right[i])) * 0x7fff;
  }

  const block = 1152;
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < len; i += block) {
    const l = leftI.subarray(i, i + block);
    const r = rightI ? rightI.subarray(i, i + block) : null;
    const buf = r ? encoder.encodeBuffer(l, r) : encoder.encodeBuffer(l);
    if (buf.length > 0) chunks.push(new Uint8Array(buf));
  }
  const end = encoder.flush();
  if (end.length > 0) chunks.push(new Uint8Array(end));

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

async function renderSongMp3(song: Song): Promise<Uint8Array> {
  const Tone = await import("tone");
  // Render ~8 bars at the seeded tempo. Use 44.1kHz, slightly longer tail for reverb.
  // We don't know exact length until we schedule, so render generously and rely on .duration.
  // Tone.Offline takes (callback, duration). Schedule first into a probe to get duration?
  // Simpler: pick worst-case 30s, then trim by composition duration.
  let recordedDuration = 0;
  const renderSec = 30;
  const buffer = await Tone.Offline(async () => {
    const r = scheduleComposition(Tone as unknown as typeof import("tone"), song.musicSeed, 0.05);
    recordedDuration = r.duration + 1.2; // small reverb tail
  }, renderSec);

  // Trim AudioBuffer to recordedDuration
  const sampleRate = buffer.sampleRate;
  const frames = Math.min(buffer.length, Math.ceil(recordedDuration * sampleRate));
  const channels = buffer.numberOfChannels;
  const ctxAny: any = (globalThis as any).OfflineAudioContext || (globalThis as any).webkitOfflineAudioContext;
  let trimmed: AudioBuffer = buffer as unknown as AudioBuffer;
  if (frames < buffer.length && ctxAny) {
    const tmpCtx = new ctxAny(channels, frames, sampleRate);
    trimmed = tmpCtx.createBuffer(channels, frames, sampleRate);
    for (let ch = 0; ch < channels; ch++) {
      trimmed.getChannelData(ch).set((buffer as any).getChannelData(ch).subarray(0, frames));
    }
  }

  return audioBufferToMp3(trimmed, 128);
}

export async function exportSongsToZip(
  songs: Song[],
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const JSZipMod: any = await import("jszip");
  const JSZip = JSZipMod.default ?? JSZipMod;
  const zip = new JSZip();

  // Ensure AudioContext is allowed (offline doesn't need user gesture, but Tone may init one).
  const Tone = await import("tone");
  try { await Tone.start(); } catch {}

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    onProgress?.(i, songs.length);
    const mp3 = await renderSongMp3(song);
    const name = `${sanitize(song.title)} — ${sanitize(song.album)} — ${sanitize(song.artist)}.mp3`;
    zip.file(name, mp3);
  }
  onProgress?.(songs.length, songs.length);

  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
