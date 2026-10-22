"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import type { Thing } from "@/lib/types";
import { todayYMD } from "@/lib/utils";
import { X, Bell, BellOff } from "lucide-react";
import ThingCard from "@/components/thing-card";

interface OriginRect { left: number; top: number; width: number; height: number; }

interface RemindersPanelProps {
  things: Thing[];
  open: boolean;
  onClose: () => void;
  onTapThing: (thing: Thing, rect?: OriginRect) => void;
}

const BATCH = 15;

/** Best date string for a thing to sort/display as a reminder entry. */
function thingDate(t: Thing): string {
  return t.dueDate || t.eventDate || t.createdAt || "";
}

export default function RemindersPanel({ things, open, onClose, onTapThing }: RemindersPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const didInitialScroll = useRef(false);

  // Full ascending (chronological) feed of every dated entry.
  const feed = useMemo(
    () =>
      [...things]
        .filter((t) => thingDate(t) !== "")
        .sort((a, b) => {
          const da = thingDate(a);
          const db = thingDate(b);
          return da < db ? -1 : da > db ? 1 : 0;
        }),
    [things]
  );

  const todayStr = todayYMD();

  // Index of the first upcoming (today or later) entry — the "soonest" anchor.
  const anchorIdx = useMemo(() => {
    const i = feed.findIndex((t) => thingDate(t) >= todayStr);
    return i === -1 ? Math.max(0, feed.length - 1) : i;
  }, [feed, todayStr]);

  // Windowed range [start, end) expands in both directions as the user scrolls.
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  // Mount / unmount with slide animation.
  useEffect(() => {
    if (open) {
      setVisible(true);
      didInitialScroll.current = false;
      setStart(Math.max(0, anchorIdx - BATCH));
      setEnd(Math.min(feed.length, anchorIdx + BATCH));
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)));
    } else {
      setAnimIn(false);
      const t = setTimeout(() => setVisible(false), 280);
      return () => clearTimeout(t);
    }
  }, [open, anchorIdx, feed.length]);

  // After first render, scroll so the soonest entry sits near the top
  // (past entries live above it, revealed by scrolling up).
  useLayoutEffect(() => {
    if (!visible || didInitialScroll.current) return;
    const el = scrollRef.current;
    const anchor = anchorRef.current;
    if (el && anchor) {
      el.scrollTop = Math.max(0, anchor.offsetTop - 8);
      didInitialScroll.current = true;
    }
  }, [visible, start, end]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const clickHandler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
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

  // Batched loading in both directions.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Near bottom -> load more future entries.
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setEnd((e) => Math.min(feed.length, e + BATCH));
    }
    // Near top -> load more past entries (preserve scroll position).
    if (el.scrollTop <= 100) {
      setStart((s) => {
        if (s === 0) return 0;
        const next = Math.max(0, s - BATCH);
        const prevHeight = el.scrollHeight;
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop += scrollRef.current.scrollHeight - prevHeight;
          }
        });
        return next;
      });
    }
  }, [feed.length]);

  if (!visible) return null;

  const shown = feed.slice(start, end);

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{ background: "rgba(0,0,0,0.45)", opacity: animIn ? 1 : 0, backdropFilter: "blur(2px)", transitionDuration: "280ms" }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col shadow-2xl"
        style={{
          background: "hsl(var(--card))",
          borderLeft: "1px solid hsl(var(--border))",
          transform: animIn ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.22,1,0.36,1)",
        }}
        role="dialog"
        aria-label="Reminders"
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
          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">No entries yet</p>
              <p className="text-xs text-muted-foreground/60">Items with dates appear here, soonest first.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {start > 0 && (
                <p className="py-2 text-center text-[10px] text-muted-foreground">↑ Scroll up for earlier</p>
              )}
              {shown.map((t, i) => {
                const d = thingDate(t);
                const isPast = d < todayStr;
                const isAnchor = start + i === anchorIdx;
                return (
                  <div
                    key={t.id}
                    ref={isAnchor ? anchorRef : undefined}
                    style={{ opacity: isPast ? 0.45 : 1 }}
                  >
                    <p className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {d === todayStr ? "Today" : isPast ? `Past · ${d}` : d}
                    </p>
                    <ThingCard thing={t} onTap={(rect) => onTapThing(t, rect)} />
                  </div>
                );
              })}
              {end < feed.length && (
                <p className="py-2 text-center text-[10px] text-muted-foreground">↓ Scroll for more</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
