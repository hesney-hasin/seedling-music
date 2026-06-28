import { useState, Fragment } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, ThumbsUp } from "lucide-react";
import type { Song } from "@/lib/songs.functions";
import { SongDetails } from "./SongDetails";

type Props = {
  songs: Song[];
  page: number;
  totalPages?: number;
  onPage: (p: number) => void;
  loading?: boolean;
};

export function TableView({ songs, page, onPage, loading }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left">
            <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="w-10 px-2 py-3"></th>
              <th className="w-16 px-2 py-3">#</th>
              <th className="px-2 py-3">Song</th>
              <th className="px-2 py-3">Artist</th>
              <th className="px-2 py-3">Album</th>
              <th className="px-2 py-3">Genre</th>
              <th className="w-20 px-2 py-3 text-right">Likes</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((s) => {
              const isOpen = expanded === s.id;
              return (
                <Fragment key={s.id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                    className={`cursor-pointer border-b border-border/60 transition hover:bg-muted/30 ${isOpen ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-2 py-2.5 font-semibold tabular-nums text-foreground">{s.index}</td>
                    <td className="px-2 py-2.5 font-medium text-foreground">{s.title}</td>
                    <td className="px-2 py-2.5 text-foreground/90">{s.artist}</td>
                    <td className={`px-2 py-2.5 ${s.album === "Single" ? "italic text-muted-foreground" : "text-foreground/90"}`}>{s.album}</td>
                    <td className="px-2 py-2.5 text-foreground/90">{s.genre}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" />
                        {s.likes}
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-border bg-muted/20">
                      <td colSpan={7} className="p-0">
                        <SongDetails song={s} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1 || loading}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageRange(page).map((p, i) =>
          p === "…" ? (
            <span key={i} className="px-2 text-muted-foreground">…</span>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => onPage(p)}
              className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition ${p === page ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"}`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function pageRange(current: number): (number | "…")[] {
  // Unbounded list; show a window around current
  const out: (number | "…")[] = [];
  const start = Math.max(1, current - 2);
  if (start > 1) {
    out.push(1);
    if (start > 2) out.push("…");
  }
  for (let p = start; p <= current + 2; p++) out.push(p);
  return out;
}
