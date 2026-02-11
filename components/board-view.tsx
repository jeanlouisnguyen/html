"use client";

import React from "react"

import { useMemo, useState } from "react";
import type { Thing, ThingType, Circle, Priority } from "@/lib/types";
import { TYPE_ICONS, CIRCLE_ICONS, getCardBg, getCardTextColor } from "@/lib/card-helpers";
import ThingCard from "./thing-card";
import {
  ArrowUpDown, Plus, Pin, CircleDot, Layers, CalendarDays, Activity,
  AlertTriangle, LayoutGrid, List, Check, X, Columns, Grid, FileText,
  Square, CheckSquare,
} from "lucide-react";

type SortMode = "custom" | "priority" | "newest" | "type";
type ViewMode = "board" | "tasks" | "notes" | "budget" | "reminders";
type LayoutStyle = "grid" | "list" | "kanban" | "eisenhower" | "outline";
type DateFilter = null | "today" | "week" | "month" | "overdue";
type StatusFilter = null | "active" | "done" | "pending";
type OpenPanel = null | "sort" | "circles" | "types" | "date" | "status" | "priority" | "view";

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const SORT_LABELS: Record<SortMode, string> = { custom: "Custom", priority: "Priority", newest: "Newest", type: "Type" };
const DATE_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: null, label: "All" }, { id: "today", label: "Today" },
  { id: "week", label: "This Week" }, { id: "month", label: "This Month" },
  { id: "overdue", label: "Overdue" },
];
const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: null, label: "All" }, { id: "active", label: "Active" },
  { id: "done", label: "Done" }, { id: "pending", label: "Pending" },
];

const EISENHOWER_QUADRANTS = [
  { key: "do" as const, label: "Do First", sub: "Urgent & Important", color: "#fee2e2", border: "#fca5a5" },
  { key: "schedule" as const, label: "Schedule", sub: "Important, Not Urgent", color: "#dbeafe", border: "#93c5fd" },
  { key: "delegate" as const, label: "Delegate", sub: "Urgent, Not Important", color: "#fef9c3", border: "#fde047" },
  { key: "delete" as const, label: "Eliminate", sub: "Neither", color: "#f3f4f6", border: "#d1d5db" },
];

const KANBAN_COLS = [
  { key: "todo", label: "To Do", match: (t: Thing) => !t.completed && !isInProgress(t) },
  { key: "progress", label: "In Progress", match: (t: Thing) => !t.completed && isInProgress(t) },
  { key: "done", label: "Done", match: (t: Thing) => t.completed },
];
function isInProgress(t: Thing): boolean {
  if (t.items && t.items.length > 0) {
    const checked = t.items.filter((i) => i.checked).length;
    return checked > 0 && checked < t.items.length;
  }
  return false;
}

function tiltFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return -2.5 + ((Math.abs(h) % 1000) / 1000) * 5;
}

function detectViewMode(things: Thing[]): ViewMode {
  if (things.length === 0) return "board";
  const types = new Set(things.map((t) => t.type));
  if (types.size === 1) {
    if (types.has("task")) return "tasks";
    if (types.has("note")) return "notes";
    if (types.has("reminder")) return "reminders";
  }
  if (things.every((t) => t.type === "expense" || t.type === "subscription")) return "budget";
  return "board";
}

/* ---- Bullet signifier for outline ---- */
function outlineBullet(t: Thing): { symbol: string; style: string } {
  if (t.completed) return { symbol: "\u2611", style: "line-through opacity-40" };
  if (t.priority === "urgent" || t.priority === "high") return { symbol: "\u25CF", style: "text-red-500 font-bold" };
  if (t.type === "task") return { symbol: "\u2610", style: "" };
  if (t.type === "event") return { symbol: "\u25C6", style: "text-blue-500" };
  if (t.type === "note") return { symbol: "\u2014", style: "text-gray-400" };
  if (t.type === "reminder") return { symbol: "\u25B6", style: "text-amber-500" };
  if (t.type === "expense" || t.type === "subscription") return { symbol: "$", style: "text-green-600 font-mono" };
  return { symbol: "\u2022", style: "" };
}

function ToolbarChip({ icon: Icon, label, active, badge, onClick }: {
  icon: typeof ArrowUpDown; label: string; active: boolean; badge?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
      style={{ background: active ? "#1a1e2e" : "#f0efed", color: active ? "#fff" : "#555", boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {badge && (
        <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1.5 text-[9px] font-bold"
          style={{ background: active ? "rgba(255,255,255,0.25)" : "#1a1e2e", color: "#fff" }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function DropdownPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-2 right-2 z-50 mt-1 rounded-lg p-2 shadow-lg"
        style={{ background: "#fff", border: "1px solid #e5e5e5" }}>
        {children}
      </div>
    </>
  );
}

interface BoardViewProps { things: Thing[]; onTap: (thing: Thing) => void; onAdd: () => void; }

export default function BoardView({ things, onTap, onAdd }: BoardViewProps) {
  const [typeFilter, setTypeFilter] = useState<ThingType | null>(null);
  const [circleFilter, setCircleFilter] = useState<Circle | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [sort, setSort] = useState<SortMode>("custom");
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [layout, setLayout] = useState<LayoutStyle>("grid");

  const viewMode = useMemo(() => detectViewMode(things), [things]);
  const toggle = (panel: OpenPanel) => setOpenPanel((p) => (p === panel ? null : panel));

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (typeFilter) c++; if (circleFilter) c++; if (priorityFilter) c++;
    if (dateFilter) c++; if (statusFilter) c++;
    return c;
  }, [typeFilter, circleFilter, priorityFilter, dateFilter, statusFilter]);

  const { pinned, unpinned, allFiltered } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
    const weekStr = weekEnd.toISOString().split("T")[0];
    const monthEnd = new Date(today); monthEnd.setDate(monthEnd.getDate() + 30);
    const monthStr = monthEnd.toISOString().split("T")[0];

    let list = [...things];
    if (typeFilter) list = list.filter((t) => t.type === typeFilter);
    if (circleFilter) list = list.filter((t) => t.circle === circleFilter);
    if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter);
    if (dateFilter) {
      list = list.filter((t) => {
        const d = t.dueDate || t.eventDate; if (!d) return false;
        switch (dateFilter) {
          case "today": return d === todayStr;
          case "week": return d >= todayStr && d <= weekStr;
          case "month": return d >= todayStr && d <= monthStr;
          case "overdue": return d < todayStr && !t.completed;
          default: return true;
        }
      });
    }
    if (statusFilter) {
      list = list.filter((t) => {
        switch (statusFilter) {
          case "done": return t.completed;
          case "active": return !t.completed;
          case "pending": return !t.completed && t.dueDate;
          default: return true;
        }
      });
    }
    switch (sort) {
      case "priority": list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]); break;
      case "newest": list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case "type": list.sort((a, b) => a.type.localeCompare(b.type)); break;
    }
    return { pinned: list.filter((t) => t.pinned), unpinned: list.filter((t) => !t.pinned), allFiltered: list };
  }, [things, typeFilter, circleFilter, priorityFilter, dateFilter, statusFilter, sort]);

  const allTypes = Object.keys(TYPE_ICONS) as ThingType[];
  const allCircles = Object.keys(CIRCLE_ICONS) as Circle[];
  const allPriorities: Priority[] = ["urgent", "high", "medium", "low"];
  const PRIORITY_COLORS: Record<Priority, string> = { urgent: "#ef4444", high: "#f97316", medium: "#eab308", low: "#9ca3af" };
  const totalCount = pinned.length + unpinned.length;

  /* Available layouts per tab */
  const layoutOptions: { id: LayoutStyle; icon: typeof LayoutGrid; label: string }[] = useMemo(() => {
    const base: { id: LayoutStyle; icon: typeof LayoutGrid; label: string }[] = [
      { id: "grid", icon: LayoutGrid, label: "Grid" },
      { id: "list", icon: List, label: "List" },
      { id: "outline", icon: FileText, label: "Outline" },
    ];
    if (viewMode === "tasks") {
      base.push({ id: "kanban", icon: Columns, label: "Kanban" });
      base.push({ id: "eisenhower", icon: Grid, label: "Matrix" });
    }
    return base;
  }, [viewMode]);

  const sortModes: SortMode[] = useMemo(() => {
    switch (viewMode) {
      case "notes": return ["custom", "newest"];
      case "budget": return ["custom", "newest"];
      default: return ["custom", "priority", "newest", "type"];
    }
  }, [viewMode]);

  /* ---- Render helpers ---- */
  const renderCards = (items: Thing[]) => {
    if (layout === "list") {
      return (
        <div className="flex flex-col gap-0.5">
          {items.map((thing) => (
            <div key={thing.id} className="relative" style={{ zIndex: 1 }}>
              <ThingCard thing={thing} onTap={() => onTap(thing)} />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="columns-3 gap-1.5">
        {items.map((thing, idx) => (
          <div key={thing.id} className="relative break-inside-avoid"
            style={{
              marginBottom: 2, marginTop: idx >= 3 ? -6 : 0,
              zIndex: idx, transform: `rotate(${tiltFor(thing.id)}deg)`,
              transformOrigin: "center center", transition: "transform 0.15s ease",
            }}>
            <ThingCard thing={thing} onTap={() => onTap(thing)} />
          </div>
        ))}
      </div>
    );
  };

  /* ---- OUTLINE VIEW ---- */
  const renderOutline = () => {
    const groups: Record<string, Thing[]> = {};
    for (const t of allFiltered) {
      const key = t.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return (
      <div className="space-y-3 px-2 pb-24 pt-2" style={{ background: "#fff" }}>
        {Object.entries(groups).map(([type, items]) => {
          const Icon = TYPE_ICONS[type as ThingType];
          const bg = getCardBg({ type } as Thing);
          return (
            <div key={type}>
              <div className="flex items-center gap-1.5 border-b pb-1 mb-1" style={{ borderColor: bg }}>
                <Icon className="h-3 w-3" style={{ color: getCardTextColor(bg) }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#999" }}>
                  {type}s ({items.length})
                </span>
              </div>
              <ul className="space-y-0.5">
                {items.map((t) => {
                  const b = outlineBullet(t);
                  const cardBg = getCardBg(t);
                  return (
                    <li key={t.id}>
                      <button onClick={() => onTap(t)}
                        className="flex w-full items-baseline gap-1.5 rounded px-1.5 py-0.5 text-left transition-colors hover:bg-gray-50">
                        <span className={`flex-shrink-0 text-[11px] leading-none ${b.style}`}>{b.symbol}</span>
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full mt-0.5" style={{ background: cardBg, border: "1px solid rgba(0,0,0,0.08)" }} />
                        <span className={`flex-1 text-[11px] leading-snug ${b.style}`}>
                          {t.title}
                        </span>
                        {t.priority === "urgent" && <span className="text-[8px] font-bold text-red-500">URGENT</span>}
                        {t.priority === "high" && <span className="text-[8px] font-bold text-orange-500">HIGH</span>}
                        {(t.dueDate || t.eventDate) && (
                          <span className="flex-shrink-0 text-[8px] tabular-nums" style={{ color: "#aaa" }}>
                            {new Date((t.dueDate || t.eventDate)! + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {t.circle && (
                          <span className="flex-shrink-0 text-[8px] font-semibold" style={{ color: "#bbb" }}>@{t.circle}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  /* ---- KANBAN VIEW ---- */
  const renderKanban = () => (
    <div className="flex h-full gap-1.5 overflow-x-auto px-1.5 pb-24 pt-1" style={{ background: "#fff" }}>
      {KANBAN_COLS.map((col) => {
        const items = allFiltered.filter(col.match);
        return (
          <div key={col.key} className="flex min-w-[140px] flex-1 flex-col rounded-lg"
            style={{ background: "#f8f7f5" }}>
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#888" }}>{col.label}</span>
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold"
                style={{ background: "#e5e5e3", color: "#666" }}>{items.length}</span>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto px-1 pb-2">
              {items.map((thing) => (
                <div key={thing.id}>
                  <ThingCard thing={thing} onTap={() => onTap(thing)} />
                </div>
              ))}
              {items.length === 0 && (
                <p className="py-6 text-center text-[9px]" style={{ color: "#ccc" }}>Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ---- EISENHOWER MATRIX VIEW ---- */
  const renderEisenhower = () => {
    const quadrantItems = (key: string) => allFiltered.filter((t) => {
      if (t.eisenhower) return t.eisenhower === key;
      // Auto-categorize by priority if no explicit eisenhower set
      switch (key) {
        case "do": return t.priority === "urgent";
        case "schedule": return t.priority === "high";
        case "delegate": return t.priority === "medium";
        case "delete": return t.priority === "low";
        default: return false;
      }
    });
    return (
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-1 px-1.5 pb-24 pt-1" style={{ background: "#fff" }}>
        {EISENHOWER_QUADRANTS.map((q) => {
          const items = quadrantItems(q.key);
          return (
            <div key={q.key} className="flex flex-col overflow-hidden rounded-lg"
              style={{ background: q.color, border: `1.5px solid ${q.border}` }}>
              <div className="px-2 pt-1.5 pb-0.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "#333" }}>{q.label}</p>
                <p className="text-[7px]" style={{ color: "#888" }}>{q.sub}</p>
              </div>
              <div className="flex-1 space-y-0.5 overflow-y-auto px-1 pb-1">
                {items.map((thing) => (
                  <button key={thing.id} onClick={() => onTap(thing)}
                    className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left transition-colors"
                    style={{ background: "rgba(255,255,255,0.6)" }}>
                    <span className="flex h-3 w-3 flex-shrink-0 items-center justify-center">
                      {thing.completed
                        ? <CheckSquare className="h-2.5 w-2.5 text-green-500" />
                        : <Square className="h-2.5 w-2.5 opacity-30" />}
                    </span>
                    <span className={`flex-1 truncate text-[9px] font-medium ${thing.completed ? "line-through opacity-40" : ""}`}>
                      {thing.title}
                    </span>
                  </button>
                ))}
                {items.length === 0 && (
                  <p className="py-4 text-center text-[8px]" style={{ color: "#bbb" }}>Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const showGridOrList = layout === "grid" || layout === "list";

  return (
    <div className="relative flex h-full flex-col" style={{ background: "#ffffff" }}>
      {/* TOOLBAR */}
      <div className="mx-1.5 mt-1.5 mb-0.5">
        <div className="flex items-center gap-1 overflow-x-auto px-0.5 py-0.5 scrollbar-hide">
          {/* View */}
          <ToolbarChip icon={layoutOptions.find((o) => o.id === layout)?.icon || LayoutGrid}
            label={layoutOptions.find((o) => o.id === layout)?.label || "Grid"}
            active={openPanel === "view"} onClick={() => toggle("view")} />
          {/* Sort */}
          <ToolbarChip icon={ArrowUpDown} label={SORT_LABELS[sort]} active={openPanel === "sort"}
            onClick={() => toggle("sort")} />
          {/* Circle */}
          <ToolbarChip icon={CircleDot} label="Circle" active={openPanel === "circles" || !!circleFilter}
            badge={circleFilter ? "1" : undefined} onClick={() => toggle("circles")} />
          {/* Type (board only) */}
          {viewMode === "board" && (
            <ToolbarChip icon={Layers} label="Type" active={openPanel === "types" || !!typeFilter}
              badge={typeFilter ? "1" : undefined} onClick={() => toggle("types")} />
          )}
          {/* Date */}
          <ToolbarChip icon={CalendarDays} label="Date" active={openPanel === "date" || !!dateFilter}
            badge={dateFilter ? "1" : undefined} onClick={() => toggle("date")} />
          {/* Status */}
          <ToolbarChip icon={Activity} label="Status" active={openPanel === "status" || !!statusFilter}
            badge={statusFilter ? "1" : undefined} onClick={() => toggle("status")} />
          {/* Priority */}
          <ToolbarChip icon={AlertTriangle} label="Priority" active={openPanel === "priority" || !!priorityFilter}
            badge={priorityFilter ? "1" : undefined} onClick={() => toggle("priority")} />
          {/* Clear */}
          {activeFilterCount > 0 && (
            <button onClick={() => { setTypeFilter(null); setCircleFilter(null); setPriorityFilter(null); setDateFilter(null); setStatusFilter(null); }}
              className="flex flex-shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-[10px] font-semibold"
              style={{ background: "#fee2e2", color: "#ef4444" }}>
              <X className="h-2.5 w-2.5" /> Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* DROPDOWN PANELS */}
      {openPanel === "view" && (
        <DropdownPanel onClose={() => setOpenPanel(null)}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#999" }}>Layout</p>
          <div className="flex flex-wrap gap-1">
            {layoutOptions.map((o) => (
              <button key={o.id} onClick={() => { setLayout(o.id); setOpenPanel(null); }}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold"
                style={{ background: layout === o.id ? "#1a1e2e" : "#f5f5f4", color: layout === o.id ? "#fff" : "#555" }}>
                <o.icon className="h-3.5 w-3.5" />
                {o.label}
              </button>
            ))}
          </div>
        </DropdownPanel>
      )}

      {openPanel === "sort" && (
        <DropdownPanel onClose={() => setOpenPanel(null)}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#999" }}>Sort by</p>
          <div className="flex flex-wrap gap-1">
            {sortModes.map((s) => (
              <button key={s} onClick={() => { setSort(s); setOpenPanel(null); }}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: sort === s ? "#1a1e2e" : "#f5f5f4", color: sort === s ? "#fff" : "#555" }}>
                {sort === s && <Check className="h-3 w-3" />} {SORT_LABELS[s]}
              </button>
            ))}
          </div>
        </DropdownPanel>
      )}

      {openPanel === "circles" && (
        <DropdownPanel onClose={() => setOpenPanel(null)}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#999" }}>Filter by Circle</p>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => { setCircleFilter(null); setOpenPanel(null); }}
              className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: !circleFilter ? "#1a1e2e" : "#f5f5f4", color: !circleFilter ? "#fff" : "#555" }}>All</button>
            {allCircles.map((c) => {
              const Icon = CIRCLE_ICONS[c]; const active = circleFilter === c;
              return (<button key={c} onClick={() => { setCircleFilter(active ? null : c); setOpenPanel(null); }}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize"
                style={{ background: active ? "#1a1e2e" : "#f5f5f4", color: active ? "#fff" : "#555" }}>
                <Icon className="h-3 w-3" /> {c}
              </button>);
            })}
          </div>
        </DropdownPanel>
      )}

      {openPanel === "types" && (
        <DropdownPanel onClose={() => setOpenPanel(null)}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#999" }}>Filter by Type</p>
          <div className="grid grid-cols-5 gap-1">
            <button onClick={() => { setTypeFilter(null); setOpenPanel(null); }}
              className="flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[9px] font-semibold"
              style={{ background: !typeFilter ? "#1a1e2e" : "#f5f5f4", color: !typeFilter ? "#fff" : "#555" }}>
              <Layers className="h-3.5 w-3.5" /> All
            </button>
            {allTypes.map((t) => { const Icon = TYPE_ICONS[t]; const active = typeFilter === t;
              return (<button key={t} onClick={() => { setTypeFilter(active ? null : t); setOpenPanel(null); }}
                className="flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[9px] font-semibold capitalize"
                style={{ background: active ? "#1a1e2e" : "#f5f5f4", color: active ? "#fff" : "#555" }}>
                <Icon className="h-3.5 w-3.5" /> {t}
              </button>);
            })}
          </div>
        </DropdownPanel>
      )}

      {openPanel === "date" && (
        <DropdownPanel onClose={() => setOpenPanel(null)}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#999" }}>Filter by Date</p>
          <div className="flex flex-wrap gap-1">
            {DATE_OPTIONS.map((o) => (
              <button key={o.label} onClick={() => { setDateFilter(o.id); setOpenPanel(null); }}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: dateFilter === o.id ? "#1a1e2e" : "#f5f5f4", color: dateFilter === o.id ? "#fff" : "#555" }}>
                {dateFilter === o.id && <Check className="h-3 w-3" />} {o.label}
              </button>
            ))}
          </div>
        </DropdownPanel>
      )}

      {openPanel === "status" && (
        <DropdownPanel onClose={() => setOpenPanel(null)}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#999" }}>Filter by Status</p>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((o) => (
              <button key={o.label} onClick={() => { setStatusFilter(o.id); setOpenPanel(null); }}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: statusFilter === o.id ? "#1a1e2e" : "#f5f5f4", color: statusFilter === o.id ? "#fff" : "#555" }}>
                {statusFilter === o.id && <Check className="h-3 w-3" />} {o.label}
              </button>
            ))}
          </div>
        </DropdownPanel>
      )}

      {openPanel === "priority" && (
        <DropdownPanel onClose={() => setOpenPanel(null)}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#999" }}>Filter by Priority</p>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => { setPriorityFilter(null); setOpenPanel(null); }}
              className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: !priorityFilter ? "#1a1e2e" : "#f5f5f4", color: !priorityFilter ? "#fff" : "#555" }}>All</button>
            {allPriorities.map((p) => { const active = priorityFilter === p;
              return (<button key={p} onClick={() => { setPriorityFilter(active ? null : p); setOpenPanel(null); }}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize"
                style={{ background: active ? "#1a1e2e" : "#f5f5f4", color: active ? "#fff" : "#555" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_COLORS[p] }} /> {p}
              </button>);
            })}
          </div>
        </DropdownPanel>
      )}

      {/* CONTENT */}
      <div key={layout} className="animate-fade-in flex-1 overflow-hidden">
        {layout === "outline" ? renderOutline()
         : layout === "kanban" ? renderKanban()
         : layout === "eisenhower" ? renderEisenhower()
         : (
          <div className="dot-grid h-full overflow-y-auto px-1.5 pb-24 pt-1">
          {pinned.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 px-1 pb-1">
                <Pin className="h-2.5 w-2.5" style={{ color: "#ef4444" }} />
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#999" }}>Pinned</span>
                <span className="text-[9px] tabular-nums" style={{ color: "#ccc" }}>{pinned.length}</span>
              </div>
              {renderCards(pinned)}
              <div className="mx-4 mt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }} />
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div className="flex items-center gap-1.5 px-1 pb-1 pt-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#bbb" }}>
                    {viewMode === "board" ? "All" : viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                  </span>
                  <span className="text-[9px] tabular-nums" style={{ color: "#ccc" }}>{unpinned.length}</span>
                </div>
              )}
              {renderCards(unpinned)}
            </div>
          )}
          {totalCount === 0 && (
            <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.03)" }}>
                <Plus className="h-7 w-7" style={{ color: "#bbb" }} />
              </div>
              <p className="mb-1 text-sm font-semibold" style={{ color: "#555" }}>Your board is empty</p>
              <p className="mb-4 max-w-[200px] text-[11px] leading-relaxed" style={{ color: "#999" }}>
                Create your first Thing to get started organizing your thoughts
              </p>
              <button onClick={onAdd} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-transform active:scale-95"
                style={{ background: "#1a1e2e", color: "#fff" }}>
                <Plus className="h-4 w-4" /> Create a Thing
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={onAdd}
        className="fixed bottom-20 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
        style={{ background: "#1a1e2e", color: "#fff" }} aria-label="Add Thing">
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
