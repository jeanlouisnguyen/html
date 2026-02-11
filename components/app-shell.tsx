"use client";

import { useState, type ReactNode } from "react";
import {
  LayoutGrid,
  CalendarDays,
  CheckSquare,
  FileText,
  Wallet,
  Bell,
  Settings,
} from "lucide-react";

export type Tab = "board" | "calendar" | "tasks" | "notes" | "budget" | "reminders";

const TABS: { id: Tab; icon: typeof LayoutGrid; label: string }[] = [
  { id: "board", icon: LayoutGrid, label: "Board" },
  { id: "calendar", icon: CalendarDays, label: "Calendar" },
  { id: "tasks", icon: CheckSquare, label: "Tasks" },
  { id: "notes", icon: FileText, label: "Notes" },
  { id: "budget", icon: Wallet, label: "Budget" },
  { id: "reminders", icon: Bell, label: "Reminders" },
];

interface AppShellProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onSettingsOpen: () => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, onSettingsOpen, children }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Top bar */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border px-4">
        <img src="/logo.png" alt="Pock-it!" style={{ width: 88, height: "auto" }} />
        <button
          onClick={onSettingsOpen}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Bottom nav */}
      <nav className="flex h-16 flex-shrink-0 items-center justify-around border-t border-border px-1" style={{ background: "hsl(var(--card))" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={tab.label}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
