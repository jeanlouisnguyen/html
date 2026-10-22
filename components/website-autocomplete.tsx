"use client";

import { useState, useMemo } from "react";
import { searchSites, faviconFor, type SiteSuggestion } from "@/lib/website-suggestions";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Called when a known site is picked, with its favicon + url. */
  onPickSite?: (site: SiteSuggestion) => void;
  textColor: string;
  placeholder?: string;
}

export default function WebsiteAutocomplete({ value, onChange, onPickSite, textColor, placeholder }: Props) {
  const [focused, setFocused] = useState(false);
  const matches = useMemo(() => searchSites(value), [value]);
  const showList = focused && value.trim().length > 0 && matches.length > 0;

  return (
    <div className="relative">
      <input
        className="w-full bg-transparent text-sm outline-none placeholder:opacity-40"
        style={{ color: textColor }}
        placeholder={placeholder || "Website or service"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {showList && (
        <div className="animate-scale-in absolute left-0 right-0 top-7 z-50 max-h-56 overflow-y-auto rounded-xl border bg-white p-1 shadow-xl"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {matches.map((s) => (
            <button
              key={s.name + s.domain}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(s.name);
                onPickSite?.(s);
                setFocused(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={faviconFor(s.domain, 64)} alt="" width={18} height={18}
                className="h-[18px] w-[18px] flex-shrink-0 rounded" crossOrigin="anonymous" />
              <span className="flex-1 truncate text-xs font-semibold" style={{ color: "#1a1e2e" }}>{s.name}</span>
              <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: "#bbb" }}>{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
