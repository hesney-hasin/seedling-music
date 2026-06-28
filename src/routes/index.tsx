import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Toolbar } from "@/components/Toolbar";
import { TableView } from "@/components/TableView";
import { GalleryView } from "@/components/GalleryView";
import { generatePage, type Song } from "@/lib/songs.functions";
import type { LocaleCode } from "@/lib/locales";
import { exportSongsToZip, downloadBlob } from "@/lib/export";

const searchSchema = z.object({
  locale: z.enum(["en_US", "de_DE", "uk_UA"]).default("en_US"),
  seed: z.string().min(1).max(64).default("42"),
  likes: z.number().min(0).max(10).default(0.5),
  view: z.enum(["table", "gallery"]).default("table"),
  page: z.number().int().min(1).max(100000).default(1),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fake Music Store — Seeded Song Generator" },
      { name: "description", content: "Generate realistic random songs, artists, albums, covers and music — reproducibly, in multiple languages." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Index,
});

function Index() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const generate = useServerFn(generatePage);

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }) });

  const onLocale = (locale: LocaleCode) => setSearch({ locale, page: 1 });
  const onSeed = (seed: string) => setSearch({ seed: seed || "1", page: 1 });
  const onLikes = (likes: number) => setSearch({ likes });
  const onView = (view: "table" | "gallery") => setSearch({ view, page: 1 });

  // Table view: single page query
  const tableQuery = useQuery({
    queryKey: ["page", search.locale, search.seed, search.likes, search.page],
    queryFn: () => generate({ data: { locale: search.locale, seed: search.seed, likesAvg: search.likes, page: search.page } }),
    enabled: search.view === "table",
    placeholderData: (prev) => prev,
  });

  // Gallery view: paged accumulation
  const [galleryPages, setGalleryPages] = useState<Song[]>([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const resetKey = `${search.locale}|${search.seed}|${search.likes}|${search.view}`;

  // Reset gallery on params change
  useEffect(() => {
    if (search.view !== "gallery") return;
    setGalleryPages([]);
    setGalleryPage(1);
    let cancelled = false;
    setGalleryLoading(true);
    generate({ data: { locale: search.locale, seed: search.seed, likesAvg: search.likes, page: 1 } })
      .then((res) => {
        if (cancelled) return;
        setGalleryPages(res.songs);
      })
      .finally(() => !cancelled && setGalleryLoading(false));
    return () => {
      cancelled = true;
    };
  }, [resetKey, generate, search.locale, search.seed, search.likes, search.view]);

  const onLoadMore = () => {
    if (galleryLoading) return;
    const next = galleryPage + 1;
    setGalleryLoading(true);
    generate({ data: { locale: search.locale, seed: search.seed, likesAvg: search.likes, page: next } })
      .then((res) => {
        setGalleryPages((cur) => [...cur, ...res.songs]);
        setGalleryPage(next);
      })
      .finally(() => setGalleryLoading(false));
  };

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);

  const currentSongs: Song[] =
    search.view === "table" ? tableQuery.data?.songs ?? [] : galleryPages;

  const onExport = async () => {
    if (exporting || currentSongs.length === 0) return;
    setExporting(true);
    setExportProgress({ done: 0, total: currentSongs.length });
    try {
      const blob = await exportSongsToZip(currentSongs, (done, total) =>
        setExportProgress({ done, total }),
      );
      const filename = `songs_${search.locale}_seed-${search.seed}_${
        search.view === "table" ? `page-${search.page}` : `loaded-${currentSongs.length}`
      }.zip`;
      downloadBlob(blob, filename);
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed: " + (e as Error).message);
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toolbar
        locale={search.locale}
        seed={search.seed}
        likes={search.likes}
        view={search.view}
        onLocale={onLocale}
        onSeed={onSeed}
        onLikes={onLikes}
        onView={onView}
        onExport={onExport}
        exporting={exporting}
        exportProgress={exportProgress}
      />
      {search.view === "table" ? (
        <TableView
          songs={tableQuery.data?.songs ?? []}
          page={search.page}
          onPage={(p) => setSearch({ page: p })}
          loading={tableQuery.isFetching}
        />
      ) : (
        <GalleryView
          songs={galleryPages}
          loading={galleryLoading}
          onLoadMore={onLoadMore}
          resetKey={resetKey}
        />
      )}
    </div>
  );
}
