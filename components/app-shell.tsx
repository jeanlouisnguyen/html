"use client";

import { useState, type ReactNode } from "react";
import {
  LayoutGrid,
  CalendarDays,
  CheckSquare,
  FileText,
  Wallet,
  Bell,
  Library,
  Settings,
} from "lucide-react";

export type Tab = "board" | "calendar" | "tasks" | "notes" | "budget" | "reminders" | "library";

const TABS: { id: Tab; icon: typeof LayoutGrid; label: string }[] = [
  { id: "board", icon: LayoutGrid, label: "Board" },
  { id: "calendar", icon: CalendarDays, label: "Calendar" },
  { id: "tasks", icon: CheckSquare, label: "Tasks" },
  { id: "notes", icon: FileText, label: "Notes" },
  { id: "budget", icon: Wallet, label: "Budget" },
  { id: "reminders", icon: Bell, label: "Reminders" },
  { id: "library", icon: Library, label: "Library" },
];

interface AppShellProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onSettingsOpen: () => void;
  headerSlot?: ReactNode;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, onSettingsOpen, headerSlot, children }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Top bar */}
      <header className="flex h-12 flex-shrink-0 items-center gap-1 border-b border-border px-3">
        <img src="/logo.png" alt="Pock-it!" style={{ width: 80, height: "auto", flexShrink: 0 }} />
        {/* Toolbar icon buttons injected by the active view */}
        <div className="flex flex-1 items-center justify-end gap-0.5 overflow-hidden">
          {headerSlot}
        </div>
        <div className="ml-1 h-5 w-px flex-shrink-0" style={{ background: "hsl(var(--border))" }} />
        <button
          onClick={onSettingsOpen}
          className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground active:scale-95"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Bottom nav */}
      <nav
        className="flex h-16 flex-shrink-0 items-center justify-around border-t border-border px-1"
        style={{ background: "hsl(var(--card))" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 px-1 py-1.5 transition-all active:scale-90"
              aria-label={tab.label}
            >
              {/* Active indicator pill */}
              {active && (
                <span
                  className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-full"
                  style={{ width: 24, height: 3, background: "hsl(var(--primary))" }}
                />
              )}
              <Icon
                className="h-5 w-5 transition-all"
                strokeWidth={active ? 2.5 : 1.5}
                style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
              />
              <span
                className="text-[10px] leading-none transition-all"
                style={{
                  color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
