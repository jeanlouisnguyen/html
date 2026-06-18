"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ThingType } from "@/lib/types";
import { TYPE_ICONS } from "@/lib/card-helpers";
import { Plus } from "lucide-react";

const TYPE_LABELS: Record<ThingType, string> = {
  task: "Task",
  note: "Note",
  event: "Event",
  reminder: "Reminder",
  list: "List",
  bookmark: "Bookmark",
  expense: "Expense",
  subscription: "Subscription",
  birthday: "Birthday",
  password: "Password",
  movie: "Movie",
  book: "Book",
  song: "Song",
};

const MENU_ORDER: ThingType[] = [
  "task", "note", "event", "reminder", "list",
  "bookmark", "expense", "subscription", "birthday", "password",
  "movie", "book", "song",
];

interface OriginRect { left: number; top: number; width: number; height: number; }

interface FabMenuProps {
  /** Quick add with the contextual default type (normal tap). */
  onQuickAdd: (rect?: OriginRect) => void;
  /** Add a specific type chosen from the long-press menu. */
  onSelectType: (type: ThingType, rect?: OriginRect) => void;
  className?: string;
}

export default function FabMenu({ onQuickAdd, onSelectType, className }: FabMenuProps) {
  const [open, setOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const rect = (): OriginRect | undefined => {
    const r = btnRef.current?.getBoundingClientRect();
    return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : undefined;
  };

  const startPress = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(10);
      setOpen(true);
    }, 380);
  }, []);

  const cancelPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    cancelPress();
    if (didLongPress.current) return; // long press already opened the menu
    onQuickAdd(rect());
  }, [cancelPress, onQuickAdd]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }, []);

  useEffect(() => () => cancelPress(), [cancelPress]);

  const pick = (t: ThingType) => {
    setOpen(false);
    onSelectType(t, rect());
  };

  return (
    <>
      {open && (
        <>
          {/* Backdrop */}
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 animate-fade-in"
            style={{ background: "rgba(0,0,0,0.4)" }}
          />
          {/* Icon grid menu anchored above the FAB */}
          <div
            className="animate-scale-in fixed bottom-36 right-4 z-50 w-[268px] rounded-2xl p-3 shadow-2xl"
            style={{ background: "#fff", border: "1px solid #ececec", transformOrigin: "bottom right" }}
          >
            <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest" style={{ color: "#999" }}>
              New entry
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {MENU_ORDER.map((t) => {
                const Icon = TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => pick(t)}
                    className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all active:scale-90"
                    style={{ background: "#f6f6f5" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#1a1e2e" }} />
                    <span className="text-[8px] font-semibold leading-none" style={{ color: "#555" }}>
                      {TYPE_LABELS[t]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <button
        ref={btnRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        className={
          className ||
          "fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all active:scale-90"
        }
        style={{ background: "#1a1e2e", color: "#fff", touchAction: "manipulation" }}
        aria-label="Add Thing (long-press for menu)"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </>
  );
}
