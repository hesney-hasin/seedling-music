import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import localeData from "@/data/locale-words.json";
import { getFaker, type LocaleCode } from "./locales";
import { combineSeed, hashSeed, makeRng, pick, rngFloat, rngInt } from "./rng";

export const PAGE_SIZE = 20;

export type Song = {
  index: number;
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number;
  label: string;
  durationSec: number;
  likes: number;
  coverSeed: string;
  musicSeed: string;
  reviewer: string;
  review: string;
  lyrics: string[];
};

type LocaleWords = {
  adjectives: string[];
  nouns: string[];
  verbs: string[];
  genres: string[];
  patterns: string[];
  bandPatterns: string[];
};

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fillPattern(pattern: string, words: LocaleWords, rng: () => number): string {
  return pattern.replace(/\{(adj|noun|verb)\}/g, (_, kind: "adj" | "noun" | "verb") => {
    const arr = kind === "adj" ? words.adjectives : kind === "noun" ? words.nouns : words.verbs;
    return pick(rng, arr);
  });
}

function generateSong(opts: {
  locale: LocaleCode;
  userSeed: string;
  page: number;
  indexOnPage: number;
  globalIndex: number;
  likesAvg: number;
}): Song {
  const { locale, userSeed, page, indexOnPage, globalIndex, likesAvg } = opts;
  const words = (localeData as Record<string, LocaleWords>)[locale];

  // Content RNG — depends ONLY on userSeed + globalIndex (NOT likes).
  const contentSeed = combineSeed(userSeed, locale, "content", globalIndex);
  const rng = makeRng(contentSeed);

  // Use faker for names / cities (localized natively)
  const faker = getFaker(locale);
  faker.seed(hashSeed(contentSeed));

  const title = fillPattern(pick(rng, words.patterns), words, rng);

  // Artist: ~55% personal name, ~45% band-style
  const isPerson = rng() < 0.55;
  const artist = isPerson
    ? faker.person.fullName()
    : fillPattern(pick(rng, words.bandPatterns), words, rng);

  // Album: 25% "Single"
  const isSingle = rng() < 0.25;
  const album = isSingle ? "Single" : fillPattern(pick(rng, words.patterns), words, rng);

  const genre = pick(rng, words.genres);
  const year = rngInt(rng, 1968, 2025);
  const label = `${faker.company.name()}`;
  const durationSec = rngInt(rng, 95, 305);

  // Likes RNG — separate, depends on (seed + index + likesAvg)
  const likeRng = makeRng(combineSeed(userSeed, "likes", globalIndex));
  let likes = 0;
  const full = Math.floor(likesAvg);
  const frac = likesAvg - full;
  likes = full;
  if (likeRng() < frac) likes += 1;

  // Reviewer + review (use localized lorem replacement: just compose sentences from word lists)
  faker.seed(hashSeed(contentSeed) + 7);
  const reviewer = faker.person.fullName();
  const reviewSentences = rngInt(rng, 2, 4);
  const review = Array.from({ length: reviewSentences }, () => {
    const len = rngInt(rng, 6, 12);
    const sent = Array.from({ length: len }, () => {
      const bag = rng() < 0.5 ? words.nouns : rng() < 0.5 ? words.adjectives : words.verbs;
      return pick(rng, bag).toLowerCase();
    }).join(" ");
    return titleCase(sent) + ".";
  }).join(" ");

  // Lyrics: 8-14 lines of short phrases
  const lyricCount = rngInt(rng, 8, 14);
  const lyrics = Array.from({ length: lyricCount }, () =>
    fillPattern(pick(rng, words.patterns), words, rng)
  );

  return {
    index: globalIndex + 1,
    id: `${userSeed}-${locale}-${globalIndex}`,
    title,
    artist,
    album,
    genre,
    year,
    label,
    durationSec,
    likes,
    coverSeed: combineSeed(userSeed, "cover", globalIndex),
    musicSeed: combineSeed(userSeed, "music", globalIndex),
    reviewer,
    review,
    lyrics,
  };
}

export const generatePage = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        locale: z.enum(["en_US", "de_DE", "uk_UA"]),
        seed: z.string().min(1).max(64),
        page: z.number().int().min(1).max(100000),
        likesAvg: z.number().min(0).max(10),
        pageSize: z.number().int().min(1).max(100).optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const pageSize = data.pageSize ?? PAGE_SIZE;
    const songs: Song[] = [];
    const start = (data.page - 1) * pageSize;
    for (let i = 0; i < pageSize; i++) {
      songs.push(
        generateSong({
          locale: data.locale as LocaleCode,
          userSeed: data.seed,
          page: data.page,
          indexOnPage: i,
          globalIndex: start + i,
          likesAvg: data.likesAvg,
        })
      );
    }
    return { songs, page: data.page, pageSize };
  });
