import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { scheduleComposition } from "@/lib/music";

type Props = {
  seed: string;
  onProgress?: (progress: number, elapsedSec: number, totalSec: number) => void;
  onStop?: () => void;
};

export function SongPlayer({ seed, onProgress, onStop }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const handleRef = useRef<{ stop: () => void; duration: number } | null>(null);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => stop(), []);
  useEffect(() => {
    stop();
    setProgress(0);
  }, [seed]);

  async function start() {
    setLoading(true);
    const Tone = await import("tone");
    await Tone.start();

    const now = Tone.now() + 0.15;
    const r = scheduleComposition(Tone, seed, now);
    const totalSec = r.duration;

    Tone.getTransport().start();
    startTimeRef.current = performance.now() + 150;

    const tick = () => {
      const elapsed = Math.max(0, (performance.now() - startTimeRef.current) / 1000);
      const p = Math.min(1, elapsed / totalSec);
      setProgress(p);
      onProgress?.(p, elapsed, totalSec);
      if (elapsed < totalSec) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        stop();
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    handleRef.current = {
      duration: totalSec,
      stop: () => {
        try {
          Tone.getTransport().stop();
          r.dispose();
        } catch {}
      },
    };

    setLoading(false);
    setPlaying(true);
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    handleRef.current?.stop();
    handleRef.current = null;
    setPlaying(false);
    onStop?.();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => (playing ? stop() : start())}
        disabled={loading}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
