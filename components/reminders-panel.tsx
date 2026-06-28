"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Thing } from "@/lib/types";
import { X, Bell, BellOff } from "lucide-react";
import ThingCard from "@/components/thing-card";

interface OriginRect { left: number; top: number; width: number; height: number; }

interface RemindersPanelProps {
  things: Thing[];
  open: boolean;
  onClose: () => void;
  onTap: (thing: Thing, rect?: OriginRect) => void;
}

const BATCH = 20;

/** Returns the best date string for a thing to sort/display as a reminder. */
function thingDate(t: Thing): string {
  return t.dueDate || t.eventDate || t.createdAt || "";
}

/** All things that have any date (everything is a potential reminder entry). */
function buildFeed(things: Thing[]): Thing[] {
  return [...things]
    .filter((t) => thingDate(t) !== "")
    .sort((a, b) => {
      const da = thingDate(a);
      const db = thingDate(b);
      // upcoming first (ascending), past at the bottom
      return da < db ? -1 : da > db ? 1 : 0;
    });
}

export default function RemindersPanel({ things, open, onClose, onTap }: RemindersPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [page, setPage] = useState(1);

  // Swipe-right to close
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Mount / unmount with animation
  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)));
      setPage(1);
    } else {
      setAnimIn(false);
      const t = setTimeout(() => setVisible(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dx > 60 && dy < 60) onClose();
  };

  const feed = buildFeed(things);
  const todayStr = new Date().toISOString().split("T")[0];

  // Infinite scroll — load more when reaching bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      setPage((p) => (p * BATCH < feed.length ? p + 1 : p));
    }
  }, [feed.length]);

  const shown = feed.slice(0, page * BATCH);

  if (!visible) return null;

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-280"
        style={{ background: "rgba(0,0,0,0.45)", opacity: animIn ? 1 : 0, backdropFilter: "blur(2px)" }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col shadow-2xl transition-transform duration-280"
        style={{
          background: "hsl(var(--card))",
          borderLeft: "1px solid hsl(var(--border))",
          transform: animIn ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="flex h-12 flex-shrink-0 items-center gap-2 border-b border-border px-4">
          <Bell className="h-4 w-4 text-primary" />
          <span className="flex-1 text-sm font-bold text-foreground">Reminders</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground active:scale-95"
            aria-label="Close reminders"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feed */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 py-3"
          style={{ overscrollBehavior: "contain" }}
        >
          {shown.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">No entries yet</p>
              <p className="text-xs text-muted-foreground/60">Items with due dates will appear here in chronological order.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {shown.map((t) => {
                const d = thingDate(t);
                const isPast = d < todayStr;
                return (
                  <div key={t.id} style={{ opacity: isPast ? 0.45 : 1 }}>
                    {/* Date label */}
                    <p className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {d === todayStr ? "Today" : isPast ? `Past · ${d}` : d}
                    </p>
                    <ThingCard
                      thing={t}
                      onTap={(rect) => { onTap(t, rect); onClose(); }}
                    />
                  </div>
                );
              })}
              {page * BATCH < feed.length && (
                <p className="py-4 text-center text-[10px] text-muted-foreground">Scroll for more…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
