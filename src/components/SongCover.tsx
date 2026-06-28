import { useMemo } from "react";
import { makeRng, pick, rngFloat, rngInt } from "@/lib/rng";

type Props = {
  seed: string;
  title: string;
  artist: string;
  size?: number;
  className?: string;
};

// Curated, tasteful palettes — picked, not blended randomly, to avoid muddy results.
const PALETTES: { bg: [string, string]; accent: string; ink: string }[] = [
  { bg: ["#0f172a", "#1e3a8a"], accent: "#fbbf24", ink: "#f8fafc" },
  { bg: ["#7f1d1d", "#dc2626"], accent: "#fde68a", ink: "#fff7ed" },
  { bg: ["#064e3b", "#10b981"], accent: "#fef3c7", ink: "#ecfdf5" },
  { bg: ["#312e81", "#a855f7"], accent: "#f0abfc", ink: "#faf5ff" },
  { bg: ["#0c4a6e", "#06b6d4"], accent: "#fef9c3", ink: "#f0fdfa" },
  { bg: ["#fef3c7", "#f59e0b"], accent: "#7c2d12", ink: "#451a03" },
  { bg: ["#1f2937", "#4b5563"], accent: "#f87171", ink: "#f9fafb" },
  { bg: ["#831843", "#ec4899"], accent: "#fde68a", ink: "#fdf2f8" },
  { bg: ["#052e16", "#65a30d"], accent: "#fef3c7", ink: "#f7fee7" },
  { bg: ["#1c1917", "#78350f"], accent: "#f59e0b", ink: "#fef3c7" },
  { bg: ["#020617", "#1e293b"], accent: "#22d3ee", ink: "#e2e8f0" },
  { bg: ["#fdf2f8", "#fbcfe8"], accent: "#831843", ink: "#500724" },
];

const STYLES = ["circles", "stripes", "triangles", "grid", "rings", "wave", "dots", "diagonal"] as const;

export function SongCover({ seed, title, artist, size = 320, className }: Props) {
  const svg = useMemo(() => buildCover(seed, title, artist, size), [seed, title, artist, size]);
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function buildCover(seed: string, title: string, artist: string, size: number): string {
  const rng = makeRng(seed, "cover");
  const palette = pick(rng, PALETTES);
  const style = pick(rng, STYLES);
  const angle = rngInt(rng, 0, 359);
  const id = `g${Math.floor(rng() * 1e9).toString(36)}`;

  const bg = `
    <defs>
      <linearGradient id="${id}" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="${palette.bg[0]}"/>
        <stop offset="100%" stop-color="${palette.bg[1]}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#${id})"/>
  `;

  let shapes = "";
  const a = palette.accent;
  if (style === "circles") {
    const n = rngInt(rng, 5, 9);
    for (let i = 0; i < n; i++) {
      const cx = rngFloat(rng, 0, size);
      const cy = rngFloat(rng, 0, size);
      const r = rngFloat(rng, size * 0.1, size * 0.4);
      const op = rngFloat(rng, 0.15, 0.55);
      shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${a}" opacity="${op}"/>`;
    }
  } else if (style === "stripes") {
    const n = rngInt(rng, 4, 10);
    for (let i = 0; i < n; i++) {
      const y = (i / n) * size + rngFloat(rng, -8, 8);
      const h = rngFloat(rng, 6, 22);
      shapes += `<rect x="0" y="${y}" width="${size}" height="${h}" fill="${a}" opacity="${rngFloat(rng, 0.1, 0.4)}"/>`;
    }
  } else if (style === "triangles") {
    const n = rngInt(rng, 4, 9);
    for (let i = 0; i < n; i++) {
      const cx = rngFloat(rng, 0, size);
      const cy = rngFloat(rng, 0, size);
      const s = rngFloat(rng, 40, 140);
      shapes += `<polygon points="${cx},${cy - s} ${cx - s},${cy + s} ${cx + s},${cy + s}" fill="${a}" opacity="${rngFloat(rng, 0.15, 0.5)}"/>`;
    }
  } else if (style === "grid") {
    const step = rngInt(rng, 24, 48);
    for (let x = 0; x < size; x += step) {
      shapes += `<line x1="${x}" y1="0" x2="${x}" y2="${size}" stroke="${a}" stroke-opacity="0.18"/>`;
    }
    for (let y = 0; y < size; y += step) {
      shapes += `<line x1="0" y1="${y}" x2="${size}" y2="${y}" stroke="${a}" stroke-opacity="0.18"/>`;
    }
    const n = rngInt(rng, 3, 6);
    for (let i = 0; i < n; i++) {
      shapes += `<rect x="${rngFloat(rng, 0, size - 60)}" y="${rngFloat(rng, 0, size - 60)}" width="${rngFloat(rng, 40, 90)}" height="${rngFloat(rng, 40, 90)}" fill="${a}" opacity="${rngFloat(rng, 0.2, 0.5)}"/>`;
    }
  } else if (style === "rings") {
    const cx = size / 2, cy = size / 2;
    const n = rngInt(rng, 6, 12);
    for (let i = 0; i < n; i++) {
      const r = (i / n) * size * 0.7 + rngFloat(rng, 4, 14);
      shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${a}" stroke-width="${rngFloat(rng, 1, 4)}" opacity="${rngFloat(rng, 0.3, 0.7)}"/>`;
    }
  } else if (style === "wave") {
    const amp = rngFloat(rng, 20, 60);
    const freq = rngFloat(rng, 1.2, 3.5);
    for (let k = 0; k < 4; k++) {
      let d = `M 0 ${size * 0.3 + k * 40}`;
      for (let x = 0; x <= size; x += 8) {
        const y = size * 0.3 + k * 40 + Math.sin((x / size) * Math.PI * freq + k) * amp;
        d += ` L ${x} ${y}`;
      }
      shapes += `<path d="${d}" fill="none" stroke="${a}" stroke-width="${rngFloat(rng, 2, 5)}" opacity="${rngFloat(rng, 0.35, 0.7)}"/>`;
    }
  } else if (style === "dots") {
    const step = rngInt(rng, 18, 30);
    for (let x = step / 2; x < size; x += step) {
      for (let y = step / 2; y < size; y += step) {
        const r = rngFloat(rng, 1, step / 3);
        shapes += `<circle cx="${x}" cy="${y}" r="${r}" fill="${a}" opacity="${rngFloat(rng, 0.2, 0.7)}"/>`;
      }
    }
  } else if (style === "diagonal") {
    const n = rngInt(rng, 6, 14);
    for (let i = 0; i < n; i++) {
      const off = (i / n) * size * 2 - size;
      shapes += `<line x1="${off}" y1="0" x2="${off + size}" y2="${size}" stroke="${a}" stroke-width="${rngFloat(rng, 4, 18)}" opacity="${rngFloat(rng, 0.15, 0.4)}"/>`;
    }
  }

  // Text block: dark scrim + title + artist
  const scrimH = Math.max(96, size * 0.36);
  const scrim = `
    <rect x="0" y="${size - scrimH}" width="${size}" height="${scrimH}" fill="black" opacity="0.42"/>
  `;

  const titleFontSize = Math.max(18, Math.min(34, Math.floor(size * 0.10 - title.length * 0.4)));
  const artistFontSize = Math.max(12, Math.floor(titleFontSize * 0.55));
  const titleY = size - scrimH + titleFontSize * 1.4;
  const artistY = titleY + artistFontSize * 1.5;
  const escTitle = escapeXml(title);
  const escArtist = escapeXml(artist);

  const text = `
    <text x="${size * 0.06}" y="${titleY}" fill="${palette.ink}" font-family="Georgia, 'Times New Roman', serif" font-size="${titleFontSize}" font-weight="700" style="letter-spacing:-0.5px">${escTitle}</text>
    <text x="${size * 0.06}" y="${artistY}" fill="${palette.ink}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${artistFontSize}" font-weight="500" opacity="0.9" style="text-transform:uppercase; letter-spacing:2px">${escArtist}</text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${bg}${shapes}${scrim}${text}</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}
