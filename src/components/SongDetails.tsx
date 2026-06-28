import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { SongCover } from "./SongCover";
import { SongPlayer } from "./SongPlayer";
import { SyncedLyrics } from "./SyncedLyrics";
import type { Song } from "@/lib/songs.functions";

export function SongDetails({ song }: { song: Song }) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex flex-col gap-6 px-4 py-5 sm:px-8 sm:py-6 md:flex-row">
      <div className="shrink-0">
        <SongCover seed={song.coverSeed} title={song.title} artist={song.artist} size={240} className="overflow-hidden rounded-md shadow-md" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{song.title}</h3>
          <p className="text-sm text-muted-foreground">
            from <span className="font-medium text-foreground">{song.album}</span> by{" "}
            <span className="italic">{song.artist}</span>
          </p>
          <p className="text-xs text-muted-foreground">{song.label}, {song.year} · {song.genre}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <SongPlayer
            seed={song.musicSeed}
            onProgress={(p) => {
              setProgress(p);
              setPlaying(true);
            }}
            onStop={() => setPlaying(false)}
          />
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.floor(song.durationSec / 60)}:{String(song.durationSec % 60).padStart(2, "0")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <ThumbsUp className="h-3 w-3" /> {song.likes}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lyrics {playing && <span className="ml-1 text-primary">● syncing</span>}
            </h4>
            <SyncedLyrics lyrics={song.lyrics} progress={progress} playing={playing} />
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Review</h4>
            <div className="rounded-md border border-border bg-background/50 p-3 text-sm text-foreground/90">
              <p className="leading-relaxed">{song.review}</p>
              <p className="mt-2 text-xs text-muted-foreground">— {song.reviewer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
