"use client";

import { useState } from "react";
import { X, Pipette } from "lucide-react";

const PALETTE = [
  /* reds */    "#ef4444","#dc2626","#b91c1c","#f87171","#fca5a5",
  /* oranges */ "#f97316","#ea580c","#c2410c","#fb923c","#fdba74",
  /* yellows */ "#eab308","#ca8a04","#a16207","#facc15","#fde047",
  /* greens */  "#22c55e","#16a34a","#15803d","#4ade80","#86efac",
  /* teals */   "#14b8a6","#0d9488","#0f766e","#2dd4bf","#5eead4",
  /* blues */   "#3b82f6","#2563eb","#1d4ed8","#60a5fa","#93c5fd",
  /* indigos */ "#6366f1","#4f46e5","#4338ca","#818cf8","#a5b4fc",
  /* purples */ "#8b5cf6","#7c3aed","#6d28d9","#a78bfa","#c4b5fd",
  /* pinks */   "#ec4899","#db2777","#be185d","#f472b6","#f9a8d4",
  /* grays */   "#1a1e2e","#374151","#6b7280","#9ca3af","#d1d5db",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export default function ColorPicker({ value, onChange, onClose }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState(value);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="flex w-full max-w-md flex-col rounded-t-2xl" style={{ background: "#ffffff", maxHeight: "60vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "#e5e5e5" }}>
          <h3 className="text-sm font-bold" style={{ color: "#1a1e2e" }}>Choose Color</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#f0f0f0" }}>
            <X className="h-4 w-4" style={{ color: "#1a1e2e" }} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-lg" style={{ background: value, border: "1px solid rgba(0,0,0,0.1)" }} />
          <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#f8f8f8" }}>
            <Pipette className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#999" }} />
            <input
              type="text"
              value={customHex}
              onChange={(e) => {
                setCustomHex(e.target.value);
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                  onChange(e.target.value);
                }
              }}
              maxLength={7}
              className="flex-1 font-mono text-xs outline-none"
              style={{ color: "#1a1e2e", background: "transparent" }}
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Swatches */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="grid grid-cols-10 gap-1.5">
            {PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => { onChange(color); setCustomHex(color); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform active:scale-90"
                style={{
                  background: color,
                  border: value === color ? "2px solid #1a1e2e" : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: value === color ? "0 0 0 2px #fff, 0 0 0 4px #1a1e2e" : "none",
                }}
                aria-label={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
