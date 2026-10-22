"use client";

import type { Recurrence, RecurUnit } from "@/lib/types";
import { Repeat } from "lucide-react";

interface Props {
  value?: Recurrence;
  onChange: (r: Recurrence | undefined) => void;
  textColor: string;
}

const UNITS: { id: RecurUnit; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

export default function RecurrenceSection({ value, onChange, textColor }: Props) {
  const enabled = !!value;

  const toggle = () => {
    if (enabled) onChange(undefined);
    else onChange({ every: 1, unit: "week" });
  };

  return (
    <div className="animate-fade-in mt-3 rounded-lg p-2.5" style={{ background: "rgba(0,0,0,0.04)" }}>
      <label className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: textColor, opacity: 0.7 }}>
          <Repeat className="h-3.5 w-3.5" /> Repeat
        </span>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className="relative h-5 w-9 rounded-full transition-colors"
          style={{ background: enabled ? "#1a1e2e" : "rgba(0,0,0,0.15)" }}
        >
          <span
            className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
            style={{ left: 2, transform: enabled ? "translateX(16px)" : "translateX(0)" }}
          />
        </button>
      </label>

      {enabled && value && (
        <div className="mt-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: textColor, opacity: 0.6 }}>Every</span>
            <input
              type="number"
              min={1}
              max={99}
              value={value.every}
              onChange={(e) => onChange({ ...value, every: Math.max(1, Number(e.target.value) || 1) })}
              className="w-12 rounded-md border bg-white px-1.5 py-1 text-center text-sm font-bold outline-none"
              style={{ borderColor: "rgba(0,0,0,0.1)", color: "#1a1e2e" }}
            />
            <div className="flex gap-1">
              {UNITS.map((u) => {
                const active = value.unit === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => onChange({ ...value, unit: u.id })}
                    className="rounded-md px-2 py-1 text-[10px] font-bold transition-colors"
                    style={{
                      background: active ? "#1a1e2e" : "rgba(0,0,0,0.05)",
                      color: active ? "#fff" : "#666",
                    }}
                  >
                    {u.label}{value.every > 1 ? "s" : ""}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-[10px]" style={{ color: textColor, opacity: 0.6 }}>
            Ends:
            <input
              type="date"
              value={value.endDate || ""}
              onChange={(e) => onChange({ ...value, endDate: e.target.value || undefined })}
              className="rounded-md border bg-white px-1.5 py-0.5 text-[10px] outline-none"
              style={{ borderColor: "rgba(0,0,0,0.1)", color: "#1a1e2e" }}
            />
            <span className="opacity-50">optional</span>
          </label>
        </div>
      )}
    </div>
  );
}
