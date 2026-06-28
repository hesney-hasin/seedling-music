import { useEffect, useRef } from "react";

type Props = {
  lyrics: string[];
  progress: number; // 0..1
  playing: boolean;
};

export function SyncedLyrics({ lyrics, progress, playing }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeIndex = playing
    ? Math.min(lyrics.length - 1, Math.floor(progress * lyrics.length))
    : -1;

  useEffect(() => {
    if (activeIndex < 0) return;
    const el = lineRefs.current[activeIndex];
    const container = containerRef.current;
    if (!el || !container) return;
    const target = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top: target, behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="max-h-56 overflow-y-auto rounded-md border border-border bg-background/50 p-3 text-sm leading-relaxed"
    >
      {lyrics.map((l, i) => {
        const isActive = i === activeIndex;
        const isPast = activeIndex >= 0 && i < activeIndex;
        return (
          <div
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`py-0.5 transition-all duration-300 ${
              isActive
                ? "font-semibold text-primary scale-[1.02] origin-left"
                : isPast
                ? "italic text-muted-foreground/70"
                : "italic text-foreground/70"
            }`}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
}
