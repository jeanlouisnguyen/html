"use client";

import { useEffect, useRef, useState } from "react";
import type { ThingType } from "@/lib/types";
import { searchMovies, searchMusic, searchBooks, type MediaResult } from "@/lib/media-search";
import { Search, Loader2, Check } from "lucide-react";

interface Props {
  type: Extract<ThingType, "movie" | "book" | "song">;
  query: string;
  onQueryChange: (v: string) => void;
  selectedImage?: string;
  textColor: string;
  /** Called when a result is chosen — persists the cover + metadata. */
  onSelect: (r: MediaResult) => void;
}

const PLACEHOLDER: Record<Props["type"], string> = {
  movie: "Search a movie title...",
  book: "Search a book title or author...",
  song: "Search an album or artist...",
};

function searchFor(type: Props["type"], q: string, signal: AbortSignal) {
  if (type === "movie") return searchMovies(q, signal);
  if (type === "book") return searchBooks(q, signal);
  return searchMusic(q, signal);
}

export default function MediaSearchField({ type, query, onQueryChange, selectedImage, textColor, onSelect }: Props) {
  const [results, setResults] = useState<MediaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const r = await searchFor(type, q, ctrl.signal);
        setResults(r);
        setOpen(true);
      } catch {
        /* aborted or failed */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query, type]);

  return (
    <div>
      {/* Search input */}
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.12)" }}>
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" style={{ color: textColor, opacity: 0.6 }} />
        ) : (
          <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: textColor, opacity: 0.5 }} />
        )}
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:opacity-40"
          style={{ color: textColor }}
          placeholder={PLACEHOLDER[type]}
          value={query}
          onChange={(e) => { onQueryChange(e.target.value); setPickedId(null); }}
        />
      </div>

      {/* Result thumbnails */}
      {open && results.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {results.map((r) => {
            const active = pickedId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => { onSelect(r); setPickedId(r.id); setOpen(false); }}
                className="group relative flex flex-col gap-0.5 text-left"
              >
                <div
                  className="relative overflow-hidden rounded-md"
                  style={{
                    aspectRatio: type === "song" ? "1 / 1" : "2 / 3",
                    background: "rgba(255,255,255,0.1)",
                    boxShadow: active ? `0 0 0 2px ${textColor}` : "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt={r.title} className="h-full w-full object-cover" crossOrigin="anonymous" loading="lazy" />
                  {active && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="line-clamp-2 text-[8px] font-semibold leading-tight" style={{ color: textColor, opacity: 0.85 }}>
                  {r.title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected cover preview */}
      {selectedImage && !open && (
        <div className="mt-2 flex items-center gap-2 rounded-lg p-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedImage} alt="" className="h-12 w-9 rounded object-cover" crossOrigin="anonymous"
            style={{ aspectRatio: type === "song" ? "1 / 1" : "2 / 3" }} />
          <span className="text-[10px] font-semibold" style={{ color: textColor, opacity: 0.7 }}>
            Cover selected
          </span>
        </div>
      )}
    </div>
  );
}
