
# Seedling Music 🎵

A deterministic music discovery platform where every artist, album, song, cover, and melody is procedurally generated from a single seed. Built with **TanStack Start**, **Tone.js**, and **@faker-js/faker**.

---

Link - [Live Demo](https://music-generator-self.vercel.app/)

## What It Does

Seedling Music generates a full catalog of fake music — titles, artists, album art, reviews, and even playable songs — all from a single 64-bit seed. Change the seed, get a completely different world of music. Return to a seed, and the exact same catalog comes back.

---

## Features

| Feature | Details |
|---|---|
| **Deterministic Generation** | 64-bit seed input with FNV-1a hashing ensures every reload produces identical data |
| **Multi-Region Catalog** | Localized content for `en_US`, `de_DE`, and `uk_UA` using faker.js + custom word banks |
| **Generative Album Art** | 12 curated color palettes × 8 SVG styles — no random blobs, no white noise |
| **Procedural Audio** | 8-bar loops with chord progressions, basslines, drums, and lead melodies via Tone.js |
| **Tempo & Melody Variety** | BPM ranges 78–132, 4 scales × 6 progressions × 6 roots = 144 harmonic combinations |
| **Likes Per Song** | 0–10 slider with fractional probabilistic handling (0.5 = 50% chance per song) |
| **Table View** | Paginated list (20/page) with expandable rows showing cover, player, and reviews |
| **Gallery View** | Infinite-scroll grid layout |
| **Synced Lyrics** | Live-scrolling lyrics synchronized to playback progress |
| **MP3 Export** | Download a ZIP archive of the current page, named by song title/artist/album |
| **Parameter Independence** | Changing likes doesn't reshuffle song metadata |

---

## Tech Stack

- **Framework:** TanStack Start (React 19 + Vite + SSR)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Audio:** Tone.js (synthesis + offline rendering)
- **Data:** @faker-js/faker, seedrandom
- **Export:** jszip, @breezystack/lamejs (MP3 encoding)
- **Deployment:** Vercel (Nitro `vercel` preset)

---

## How It Works

### Data Layer
Song metadata is generated server-side via `createServerFn` using a seeded RNG (`seedrandom`). Each page of results is hashed from the base seed + page number, ensuring consistency across pagination.

### Audio Layer
A shared music composition scheduler (`src/lib/music.ts`) defines:
- Scale & root note selection
- Chord progressions (I–V–vi–IV variations)
- 3 synth types for pads
- Bass patterns (root/fifth)
- Drum patterns (kick + hat)
- Melody lines (55% chord-tone biased with passing tones)

The same scheduler drives both live playback and offline MP3 rendering.

### Cover Art
Deterministic SVG generation with 12 hand-picked palettes and 8 distinct styles: concentric circles, geometric grids, organic waves, starbursts, stripes, triangles, rings, and diagonal patterns. Each cover includes a dark scrim with rendered title and artist name.

---

## Running Locally

```bash
Install dependencies
npm install

Start dev server
npm run dev

Build for production
npm run build
```

---

## Project Structure

```
src/
├── components/
│   ├── SongCover.tsx      # Deterministic SVG album art
│   ├── SongPlayer.tsx     # Live audio playback
│   ├── SongDetails.tsx    # Expandable row with lyrics + player
│   ├── SyncedLyrics.tsx   # Scroll-synced lyrics display
│   ├── TableView.tsx      # Paginated table
│   ├── GalleryView.tsx    # Infinite-scroll grid
│   └── Toolbar.tsx        # Seed, likes, locale, export controls
├── lib/
│   ├── music.ts           # Shared composition scheduler
│   ├── export.ts          # Offline MP3 + ZIP generation
│   ├── rng.ts             # Seeded RNG utilities
│   ├── songs.functions.ts # Server-side data generation
│   └── locales.ts         # Faker instance mapping
├── data/
│   └── locale-words.json  # Per-locale word banks
└── routes/
    └── index.tsx          # Main app route
```

---

## License

MIT
```

---
