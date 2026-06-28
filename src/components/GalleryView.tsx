import { useEffect, useRef } from "react";
import { ThumbsUp } from "lucide-react";
import type { Song } from "@/lib/songs.functions";
import { SongCover } from "./SongCover";

type Props = {
  songs: Song[];
  loading: boolean;
  onLoadMore: () => void;
  resetKey: string;
};

export function GalleryView({ songs, loading, onLoadMore, resetKey }: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // reset scroll on param change
    scrollRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) onLoadMore();
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore, loading]);

  return (
    <div ref={scrollRef} className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {songs.map((s) => (
          <div key={s.id} className="group flex flex-col gap-2">
            <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-border transition group-hover:shadow-md">
              <SongCover seed={s.coverSeed} title={s.title} artist={s.artist} size={280} className="aspect-square w-full" />
            </div>
            <div className="px-0.5">
              <div className="truncate text-sm font-semibold text-foreground" title={s.title}>
                {s.index}. {s.title}
              </div>
              <div className="truncate text-xs text-muted-foreground" title={s.artist}>{s.artist}</div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{s.genre}</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <ThumbsUp className="h-3 w-3" /> {s.likes}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="flex h-20 items-center justify-center text-sm text-muted-foreground">
        {loading ? "Loading…" : "Scroll for more"}
      </div>
    </div>
  );
}
