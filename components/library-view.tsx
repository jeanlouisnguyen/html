"use client";

import { useMemo, useRef, useState } from "react";
import type { Thing, ThingType } from "@/lib/types";
import { mediaStatusLabel } from "@/lib/card-helpers";
import { Film, BookOpen, Disc3, Star, Plus } from "lucide-react";

interface OriginRect { left: number; top: number; width: number; height: number; }

interface LibraryViewProps {
  things: Thing[];
  onTap: (thing: Thing, rect?: OriginRect) => void;
  onAddType: (type: ThingType, rect?: OriginRect) => void;
}

type Shelf = "movie" | "book" | "song";

const SHELVES: { id: Shelf; label: string; icon: typeof Film }[] = [
  { id: "movie", label: "Movies", icon: Film },
  { id: "book", label: "Books", icon: BookOpen },
  { id: "song", label: "Music", icon: Disc3 },
];

/* Small rating row */
function Stars({ rating, light }: { rating?: number; light?: boolean }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="h-2.5 w-2.5"
          style={{ color: n <= rating ? "#f5b301" : light ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)" }}
          fill={n <= rating ? "#f5b301" : "none"}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}

function StatusChip({ thing }: { thing: Thing }) {
  if (!thing.mediaStatus) return null;
  const label = mediaStatusLabel(thing.type, thing.mediaStatus);
  const colors: Record<string, { bg: string; fg: string }> = {
    todo: { bg: "rgba(148,163,184,0.25)", fg: "#cbd5e1" },
    active: { bg: "rgba(245,179,1,0.9)", fg: "#1a1205" },
    done: { bg: "rgba(74,222,128,0.9)", fg: "#052e16" },
  };
  const c = colors[thing.mediaStatus];
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}

/* ---------- Movie poster wall ---------- */
function PosterWall({ items, onTap, onAdd }: { items: Thing[]; onTap: LibraryViewProps["onTap"]; onAdd: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-3 pb-28 pt-3 sm:grid-cols-4">
      {items.map((t) => (
        <PosterTile key={t.id} thing={t} onTap={onTap} />
      ))}
      <button
        onClick={onAdd}
        className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs font-semibold transition-transform active:scale-95"
        style={{ aspectRatio: "2 / 3", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}
        aria-label="Add a movie"
      >
        <Plus className="h-5 w-5" />
        Add
      </button>
    </div>
  );
}

function PosterTile({ thing, onTap }: { thing: Thing; onTap: LibraryViewProps["onTap"] }) {
  const ref = useRef<HTMLButtonElement>(null);
  const tap = () => {
    const r = ref.current?.getBoundingClientRect();
    onTap(thing, r ? { left: r.left, top: r.top, width: r.width, height: r.height } : undefined);
  };
  return (
    <button ref={ref} onClick={tap} className="group text-left transition-transform active:scale-95">
      <div
        className="relative overflow-hidden rounded-md"
        style={{ aspectRatio: "2 / 3", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}
      >
        {thing.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thing.coverImage} alt={thing.title} crossOrigin="anonymous" loading="lazy"
            className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: "#1f2433" }}>
            <Film className="h-6 w-6" style={{ color: "rgba(255,255,255,0.3)" }} />
          </div>
        )}
        {/* gradient + title overlay */}
        <div className="absolute inset-x-0 bottom-0 p-1.5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
          <p className="truncate text-[10px] font-bold leading-tight text-white">{thing.title}</p>
          {thing.year && <p className="text-[8px] text-white/60">{thing.year}</p>}
          <div className="mt-0.5"><Stars rating={thing.rating} light /></div>
        </div>
        <div className="absolute left-1 top-1"><StatusChip thing={thing} /></div>
      </div>
    </button>
  );
}

/* ---------- Bookshelf ---------- */
function Bookshelf({ items, onTap, onAdd }: { items: Thing[]; onTap: LibraryViewProps["onTap"]; onAdd: () => void }) {
  // chunk into rows of 3 so each row sits as standing books on a wooden plank
  const rows: Thing[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));
  if (rows.length === 0) rows.push([]);
  return (
    <div className="px-4 pb-28 pt-4">
      {/* Bookcase frame */}
      <div
        className="rounded-lg px-3 pt-3"
        style={{
          background: "linear-gradient(180deg,#5b3a1d,#42290f)",
          boxShadow: "inset 0 0 24px rgba(0,0,0,0.55), 0 10px 24px rgba(0,0,0,0.3)",
          border: "6px solid #3a2410",
        }}
      >
        {rows.map((row, ri) => (
          <div key={ri} className="mb-1">
            {/* back panel behind books */}
            <div
              className="flex items-end justify-center gap-3 rounded-sm px-2 pt-3"
              style={{ minHeight: 180, background: "linear-gradient(180deg,#3a2410,#2d1c0c)" }}
            >
              {row.map((t) => (
                <BookSpine key={t.id} thing={t} onTap={onTap} />
              ))}
              {ri === rows.length - 1 && (
                <button
                  onClick={onAdd}
                  className="flex flex-col items-center justify-center gap-1 self-end rounded-sm border-2 border-dashed text-[9px] font-bold transition-transform active:scale-95"
                  style={{ width: 56, height: 150, borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.6)" }}
                  aria-label="Add a book"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              )}
            </div>
            {/* wooden plank */}
            <div style={{
              height: 14, borderRadius: 2,
              background: "linear-gradient(180deg,#a06a34,#7a4d23)",
              boxShadow: "0 7px 12px rgba(0,0,0,0.4), inset 0 2px 2px rgba(255,255,255,0.18)",
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BookSpine({ thing, onTap }: { thing: Thing; onTap: LibraryViewProps["onTap"] }) {
  const ref = useRef<HTMLButtonElement>(null);
  const tap = () => {
    const r = ref.current?.getBoundingClientRect();
    onTap(thing, r ? { left: r.left, top: r.top, width: r.width, height: r.height } : undefined);
  };
  return (
    <button ref={ref} onClick={tap}
      className="group relative transition-all duration-200 hover:-translate-y-2 active:scale-95"
      style={{ width: 100 }} aria-label={thing.title}>
      <div className="relative mx-auto" style={{ width: 96, aspectRatio: "2 / 3" }}>
        {thing.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thing.coverImage} alt={thing.title} crossOrigin="anonymous" loading="lazy"
            className="h-full w-full object-cover"
            style={{ borderRadius: "2px 5px 5px 2px", boxShadow: "4px 5px 10px rgba(0,0,0,0.5)" }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center"
            style={{ background: "#b08968", borderRadius: "2px 5px 5px 2px" }}>
            <BookOpen className="h-6 w-6 text-white/60" />
          </div>
        )}
        {/* spine shadow */}
        <div className="absolute inset-y-0 left-0" style={{ width: 6, background: "linear-gradient(90deg, rgba(0,0,0,0.45), transparent)", borderRadius: "2px 0 0 2px" }} />
        {/* page edges */}
        <div className="absolute inset-y-1 right-0" style={{ width: 3, background: "repeating-linear-gradient(0deg,#fff,#fff 1px,#ddd 1px,#ddd 2px)" }} />
        {/* status chip */}
        <div className="absolute left-1 top-1"><StatusChip thing={thing} /></div>
        {thing.rating ? (
          <div className="absolute right-0.5 top-0.5 flex items-center gap-px rounded-full px-1 py-0.5"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            <Star className="h-2 w-2" style={{ color: "#f5b301" }} fill="#f5b301" />
            <span className="text-[8px] font-bold text-white">{thing.rating}</span>
          </div>
        ) : null}
      </div>
      <p className="mt-1 truncate px-0.5 text-center text-[9px] font-semibold text-white/85">{thing.title}</p>
    </button>
  );
}

/* ---------- Record crate ---------- */
function RecordCrate({ items, onTap, onAdd }: { items: Thing[]; onTap: LibraryViewProps["onTap"]; onAdd: () => void }) {
  return (
    <div className="px-4 pb-28 pt-4">
      {/* Wooden crate */}
      <div
        className="rounded-lg p-4"
        style={{
          background: "linear-gradient(180deg,#4a3422,#33231400)",
          border: "7px solid #2c1d10",
          borderTopWidth: 4,
          boxShadow: "inset 0 12px 30px rgba(0,0,0,0.6), 0 12px 26px rgba(0,0,0,0.4)",
        }}
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
          {items.map((t) => (
            <RecordSleeve key={t.id} thing={t} onTap={onTap} />
          ))}
          <button
            onClick={onAdd}
            className="flex flex-col items-center justify-center gap-1 self-start rounded-sm border-2 border-dashed text-[10px] font-bold transition-transform active:scale-95"
            style={{ aspectRatio: "1 / 1", borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.6)" }}
            aria-label="Add a song or album"
          >
            <Plus className="h-6 w-6" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordSleeve({ thing, onTap }: { thing: Thing; onTap: LibraryViewProps["onTap"] }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);
  const tap = () => {
    const r = ref.current?.getBoundingClientRect();
    onTap(thing, r ? { left: r.left, top: r.top, width: r.width, height: r.height } : undefined);
  };
  return (
    <button
      ref={ref}
      onClick={tap}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className="text-left transition-transform active:scale-95"
      aria-label={thing.title}
    >
      <div className="relative" style={{ aspectRatio: "1 / 1" }}>
        {/* vinyl disc slides out on hover */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-300"
          style={{
            right: hover ? -28 : -8,
            width: "70%",
            aspectRatio: "1 / 1",
          }}
        >
          <div className="h-full w-full rounded-full"
            style={{ background: "radial-gradient(circle, #555 0 16%, #111 16% 100%)", boxShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "#999" }} />
          </div>
        </div>
        {/* sleeve / album art */}
        <div className="relative z-10 h-full w-full overflow-hidden rounded-sm"
          style={{ boxShadow: "3px 3px 10px rgba(0,0,0,0.5)" }}>
          {thing.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thing.coverImage} alt={thing.title} crossOrigin="anonymous" loading="lazy"
              className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ background: "#2a2a2a" }}>
              <Disc3 className="h-7 w-7 text-white/40" />
            </div>
          )}
        </div>
      </div>
      <p className="mt-1.5 truncate text-[11px] font-bold leading-tight text-white">{thing.title}</p>
      {thing.creator && <p className="truncate text-[9px] text-white/55">{thing.creator}</p>}
      <div className="mt-0.5 flex items-center gap-1.5">
        <Stars rating={thing.rating} light />
        <StatusChip thing={thing} />
      </div>
    </button>
  );
}

export default function LibraryView({ things, onTap, onAddType }: LibraryViewProps) {
  const [shelf, setShelf] = useState<Shelf>("movie");

  const byType = useMemo(() => ({
    movie: things.filter((t) => t.type === "movie"),
    book: things.filter((t) => t.type === "book"),
    song: things.filter((t) => t.type === "song"),
  }), [things]);

  const items = byType[shelf];
  const dark = shelf !== "book";
  const bg =
    shelf === "movie" ? "#0e1018" :
    shelf === "song" ? "#16131a" :
    "#efe4d4"; // warm shelf room for books

  const handleAdd = () => onAddType(shelf);

  return (
    <div className="flex h-full flex-col" style={{ background: bg }}>
      {/* Shelf switcher */}
      <div className="flex flex-shrink-0 items-center justify-center gap-2 px-3 pt-3">
        {SHELVES.map((s) => {
          const active = shelf === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setShelf(s.id)}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95"
              style={{
                background: active ? (dark ? "#fff" : "#3a2a18") : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                color: active ? (dark ? "#111" : "#fff") : (dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)"),
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
              <span className="rounded-full px-1.5 text-[9px]"
                style={{ background: active ? "rgba(0,0,0,0.12)" : "transparent" }}>
                {byType[s.id].length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Layout */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
              {shelf === "movie" ? <Film className="h-6 w-6" style={{ color: dark ? "#fff" : "#3a2a18" }} /> :
               shelf === "book" ? <BookOpen className="h-6 w-6" style={{ color: "#3a2a18" }} /> :
               <Disc3 className="h-6 w-6" style={{ color: "#fff" }} />}
            </div>
            <p className="text-sm font-bold" style={{ color: dark ? "#fff" : "#3a2a18" }}>
              Your {shelf === "movie" ? "poster wall" : shelf === "book" ? "bookshelf" : "record crate"} is empty
            </p>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95"
              style={{ background: dark ? "#fff" : "#3a2a18", color: dark ? "#111" : "#fff" }}
            >
              <Plus className="h-4 w-4" /> Add {shelf === "song" ? "an album" : `a ${shelf}`}
            </button>
          </div>
        ) : shelf === "movie" ? (
          <PosterWall items={items} onTap={onTap} onAdd={handleAdd} />
        ) : shelf === "book" ? (
          <Bookshelf items={items} onTap={onTap} onAdd={handleAdd} />
        ) : (
          <RecordCrate items={items} onTap={onTap} onAdd={handleAdd} />
        )}
      </div>
    </div>
  );
}
