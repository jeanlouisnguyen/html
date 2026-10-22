"use client";

import { useMemo } from "react";
import { evaluatePassword } from "@/lib/password-strength";
import { Lightbulb } from "lucide-react";

interface Props {
  password: string;
}

export default function PasswordStrengthMeter({ password }: Props) {
  const result = useMemo(() => evaluatePassword(password), [password]);

  if (result.level === "empty") return null;

  // 4 segments fill based on level
  const segments = ["weak", "fair", "good", "strong"];
  const activeIndex =
    result.level === "weak" ? 0 :
    result.level === "fair" ? 1 :
    result.level === "good" ? 2 : 3;

  return (
    <div className="mt-1.5 rounded-lg p-2" style={{ background: "rgba(0,0,0,0.04)" }}>
      {/* Segmented bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {segments.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{ background: i <= activeIndex ? result.color : "rgba(0,0,0,0.1)" }}
            />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: result.color }}>
          {result.label}
        </span>
      </div>

      {/* Live contextual suggestions */}
      {result.suggestions.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {result.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-1 text-[9px] leading-snug" style={{ color: "#666" }}>
              <Lightbulb className="mt-px h-2.5 w-2.5 flex-shrink-0" style={{ color: result.color }} />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
