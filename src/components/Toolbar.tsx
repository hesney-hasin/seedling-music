import { Shuffle, LayoutGrid, List, Download, Loader2 } from "lucide-react";
import { LOCALES, type LocaleCode } from "@/lib/locales";

type Props = {
  locale: LocaleCode;
  seed: string;
  likes: number;
  view: "table" | "gallery";
  onLocale: (l: LocaleCode) => void;
  onSeed: (s: string) => void;
  onLikes: (n: number) => void;
  onView: (v: "table" | "gallery") => void;
  onExport?: () => void;
  exporting?: boolean;
  exportProgress?: { done: number; total: number } | null;
};

function randSeed() {
  return String(Math.floor(Math.random() * 0xffffffff));
}

export function Toolbar({ locale, seed, likes, view, onLocale, onSeed, onLikes, onView, onExport, exporting, exportProgress }: Props) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-4 px-4 py-3 lg:flex-nowrap">
        {/* Language */}
        <label className="flex min-w-[180px] flex-1 flex-col gap-1 rounded-md border border-input bg-background px-3 py-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Language</span>
          <select
            value={locale}
            onChange={(e) => onLocale(e.target.value as LocaleCode)}
            className="bg-transparent text-sm font-medium text-foreground outline-none"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </label>

        {/* Seed */}
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-md border border-input bg-background px-3 py-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Seed</span>
          <div className="flex items-center gap-2">
            <input
              value={seed}
              onChange={(e) => onSeed(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => onSeed(randSeed())}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Random seed"
              title="Random seed"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
        </label>

        {/* Likes */}
        <div className="flex min-w-[260px] flex-[2] flex-col gap-1 rounded-md border border-input bg-background px-3 py-2">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Likes</span>
            <span className="tabular-nums text-foreground">{likes.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={likes}
            onChange={(e) => onLikes(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* View toggle */}
        <div className="inline-flex overflow-hidden rounded-md border border-input">
          <button
            type="button"
            onClick={() => onView("table")}
            className={`flex h-10 w-10 items-center justify-center transition ${view === "table" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            aria-label="Table view"
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onView("gallery")}
            className={`flex h-10 w-10 items-center justify-center transition ${view === "gallery" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            aria-label="Gallery view"
            title="Gallery view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {/* Export */}
        <button
          type="button"
          onClick={onExport}
          disabled={exporting || !onExport}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
          title="Export current page songs as ZIP of MP3s"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting && exportProgress
            ? `Rendering ${exportProgress.done}/${exportProgress.total}`
            : "Export MP3s"}
        </button>
      </div>
    </div>
  );
}
