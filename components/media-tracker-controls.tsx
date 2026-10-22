"use client";

import type { MediaStatus, ThingType } from "@/lib/types";
import { mediaStatusLabel } from "@/lib/card-helpers";
import { Star } from "lucide-react";

const STATUSES: MediaStatus[] = ["todo", "active", "done"];

export function MediaStatusPicker({
  type,
  value,
  onChange,
  textColor,
  fieldBg,
}: {
  type: ThingType;
  value: MediaStatus | undefined;
  onChange: (s: MediaStatus) => void;
  textColor: string;
  fieldBg: string;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Tracking status">
      {STATUSES.map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s)}
            className="flex-1 rounded-md px-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95"
            style={{
              background: active ? textColor : fieldBg,
              color: active ? (textColor === "#f5f5f5" ? "#1a1e2e" : "#fff") : textColor,
              opacity: active ? 1 : 0.6,
            }}
          >
            {mediaStatusLabel(type, s)}
          </button>
        );
      })}
    </div>
  );
}

export function StarRating({
  value,
  onChange,
  textColor,
  size = 22,
}: {
  value: number;
  onChange?: (n: number) => void;
  textColor: string;
  size?: number;
}) {
  const readOnly = !onChange;
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            disabled={readOnly}
            onClick={() => onChange?.(value === n ? 0 : n)}
            className={readOnly ? "" : "transition-transform active:scale-110"}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              style={{
                width: size,
                height: size,
                color: filled ? "#f5b301" : textColor,
                fill: filled ? "#f5b301" : "transparent",
                opacity: filled ? 1 : 0.3,
              }}
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
}
