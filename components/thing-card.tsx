"use client";

import { useMemo } from "react";
import type { Thing } from "@/lib/types";
import {
  TYPE_ICONS,
  getCardBg,
  getCardTextColor,
  getPrioritySticker,
} from "@/lib/card-helpers";
import { Check } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { resolveIcon } from "@/components/icon-picker";

/* deterministic pseudo-random from thing.id */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function seeded(id: string, salt: number) {
  return (hash(id + String(salt)) % 1000) / 1000;
}

const TAPE_COLORS = [
  "rgba(255,235,150,0.75)",
  "rgba(200,230,255,0.65)",
  "rgba(255,210,210,0.65)",
  "rgba(200,255,210,0.65)",
  "rgba(230,220,255,0.65)",
];

/* ---- Micro circle sticker (reads from settings) ---- */
function CircleSticker({ circle }: { circle: Thing["circle"] }) {
  const { settings } = useSettings();
  if (!circle) return null;
  const custom = settings.circles.find((c) => c.id === circle);
  const color = custom?.color || "#6b7280";
  const iconName = custom?.icon || "Circle";
  const Icon = resolveIcon(iconName);
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full"
      style={{
        background: color,
        boxShadow: `0 1px 0 0 ${color}88, 0 1px 3px rgba(0,0,0,0.15)`,
      }}
    >
      <Icon className="h-2.5 w-2.5 text-white" strokeWidth={3} />
    </div>
  );
}

/* ---- Micro priority sticker (reads from settings) ---- */
function PrioritySticker({ priority }: { priority: Thing["priority"] }) {
  const { settings } = useSettings();
  const custom = settings.priorities.find((p) => p.id === priority);
  if (!custom) {
    // fallback to legacy
    const sticker = getPrioritySticker(priority);
    if (!sticker.show) return null;
    return (
      <div className={`flex h-4 w-4 items-center justify-center ${sticker.animated ? "animate-urgent-flash" : ""}`}
        style={{ background: sticker.bg, borderRadius: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
        <span className="text-[8px] font-bold leading-none text-white">!</span>
      </div>
    );
  }
  const PIcon = resolveIcon(custom.icon);
  return (
    <div className={`flex h-4 w-4 items-center justify-center ${custom.animated ? "animate-urgent-flash" : ""}`}
      style={{ background: custom.color, borderRadius: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
      <PIcon className="h-2.5 w-2.5 text-white" strokeWidth={3} />
    </div>
  );
}

interface ThingCardProps {
  thing: Thing;
  onTap: () => void;
}

export default function ThingCard({ thing, onTap }: ThingCardProps) {
  const bg = getCardBg(thing);
  const textColor = getCardTextColor(bg);
  const TypeIcon = TYPE_ICONS[thing.type];

  const isExpense = thing.type === "expense" || thing.type === "subscription";
  const isBirthday = thing.type === "birthday";

  const traits = useMemo(() => {
    const r0 = seeded(thing.id, 0);
    const r1 = seeded(thing.id, 1);
    const r2 = seeded(thing.id, 2);
    const r3 = seeded(thing.id, 3);
    const r4 = seeded(thing.id, 4);
    const edgeType = r0 < 0.4 ? "fold" : r0 < 0.7 ? "dogear" : "rough";
    const tapeColor = TAPE_COLORS[Math.floor(r2 * TAPE_COLORS.length)];
    const tapeOffsetX = 25 + r1 * 50;
    const tapeRotation = -14 + r3 * 28;
    const foldSize = 6 + r4 * 6;
    return { edgeType, tapeColor, tapeOffsetX, tapeRotation, foldSize };
  }, [thing.id]);

  return (
    <button
      onClick={onTap}
      className="group relative w-full text-left transition-transform active:scale-[0.96]"
    >
      {/* TAPE for unpinned */}
      {!thing.pinned && (
        <div
          className="absolute z-10"
          style={{
            left: `${traits.tapeOffsetX}%`,
            top: -3,
            transform: `translateX(-50%) rotate(${traits.tapeRotation}deg)`,
          }}
        >
          <div
            style={{
              width: 22, height: 8,
              background: traits.tapeColor,
              borderRadius: 1,
              boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
            }}
          />
        </div>
      )}

      {/* PUSH PIN for pinned */}
      {thing.pinned && (
        <div className="absolute z-10" style={{ left: "50%", top: -5, transform: "translateX(-50%)" }}>
          <div
            style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)",
            }}
          >
            <div style={{
              position: "absolute", top: 2, left: 3,
              width: 3, height: 2, borderRadius: "50%",
              background: "rgba(255,255,255,0.35)",
            }} />
          </div>
          <div style={{
            width: 1.5, height: 4, background: "#999",
            margin: "0 auto", borderRadius: 1,
            boxShadow: "1px 1px 3px rgba(0,0,0,0.2)",
          }} />
        </div>
      )}

      {/* CARD BODY */}
      <div
        className="relative overflow-hidden"
        style={{
          background: bg,
          color: textColor,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 3px 8px rgba(0,0,0,0.05), 1px 3px 6px rgba(0,0,0,0.03)",
          marginTop: thing.pinned ? 6 : 3,
          padding: "7px 7px 22px 7px",
        }}
      >
        {/* TOP ROW: Circle (left) + Priority (right) */}
        <div className="flex items-start justify-between">
          <CircleSticker circle={thing.circle} />
          <PrioritySticker priority={thing.priority} />
        </div>

        {/* CONTENT - readable */}
        <div className="mt-1.5">
          {isBirthday ? (
            <>
              <p className="truncate text-xs font-bold leading-tight">{thing.birthdayPerson || thing.title}</p>
              {thing.eventDate && (
                <p className="mt-0.5 text-base font-black tabular-nums leading-tight">
                  {new Date(thing.eventDate + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </p>
              )}
            </>
          ) : isExpense ? (
            <>
              <p className="truncate text-xs font-semibold leading-tight">{thing.title}</p>
              {thing.amount != null && (
                <p className="mt-0.5 font-mono text-base font-black tabular-nums leading-tight">
                  ${thing.amount.toLocaleString("en-CA", { minimumFractionDigits: 2 })}
                </p>
              )}
            </>
          ) : thing.type === "list" && thing.items ? (
            <>
              <p className="truncate text-xs font-bold leading-tight">{thing.title}</p>
              <ul className="mt-1 space-y-0.5">
                {thing.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center gap-1.5 text-[9px] leading-tight">
                    <span
                      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm border"
                      style={{
                        borderColor: "rgba(0,0,0,0.15)",
                        background: item.checked ? "rgba(0,0,0,0.12)" : "transparent",
                      }}
                    />
                    <span className={`truncate ${item.checked ? "line-through opacity-35" : ""}`}>{item.text}</span>
                  </li>
                ))}
                {thing.items.length > 3 && (
                  <li className="text-[8px] opacity-30">+{thing.items.length - 3}</li>
                )}
              </ul>
            </>
          ) : thing.type === "password" ? (
            <>
              <p className="truncate text-xs font-bold leading-tight">{thing.title}</p>
              <p className="mt-0.5 font-mono text-[9px] tracking-widest opacity-25">{"*".repeat(8)}</p>
            </>
          ) : (
            <>
              <p className="truncate text-xs font-bold leading-tight">{thing.title}</p>
              {thing.description && (
                <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug opacity-50">{thing.description}</p>
              )}
            </>
          )}
        </div>

        {/* Due/event date - single line */}
        {(thing.dueDate || thing.eventDate) && !isBirthday && (
          <p className="mt-1.5 text-[8px] tabular-nums opacity-35">
            {new Date((thing.eventDate || thing.dueDate)! + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
          </p>
        )}

        {/* Completed badge */}
        {thing.completed && (
          <div className="absolute bottom-1.5 left-2">
            <Check className="h-3 w-3 opacity-35" />
          </div>
        )}

        {/* WATERMARK ARTWORK (duotone, lower-right, behind content) */}
        <div className="pointer-events-none absolute -bottom-2 -right-2 opacity-[0.045]">
          <TypeIcon className="h-16 w-16" strokeWidth={1} />
        </div>

        {/* TYPE ICON (lower-right) */}
        <div className="absolute bottom-1.5 right-2">
          <TypeIcon className="h-3.5 w-3.5 opacity-20" />
        </div>

        {/* EDGE EFFECTS */}
        {traits.edgeType === "fold" && (
          <>
            <div className="absolute" style={{
              bottom: 0, right: 0, width: 0, height: 0,
              borderStyle: "solid",
              borderWidth: `0 0 ${traits.foldSize}px ${traits.foldSize}px`,
              borderColor: `transparent transparent rgba(0,0,0,0.04) transparent`,
            }} />
            <div className="absolute" style={{
              bottom: 0, right: 0, width: traits.foldSize, height: traits.foldSize,
              background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)",
            }} />
          </>
        )}
        {traits.edgeType === "dogear" && (
          <div className="absolute" style={{
            top: 0, right: 0, width: traits.foldSize, height: traits.foldSize,
            background: "linear-gradient(315deg, transparent 50%, rgba(0,0,0,0.05) 50%)",
          }} />
        )}
        {traits.edgeType === "rough" && (
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: 2,
            background: `repeating-linear-gradient(90deg, ${bg} 0px, ${bg} 3px, transparent 3px, transparent 4px)`,
            opacity: 0.6,
          }} />
        )}
      </div>
    </button>
  );
}
