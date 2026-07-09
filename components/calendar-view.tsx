"use client";

import React from "react"

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { Thing } from "@/lib/types";
import { useSettings } from "@/lib/settings-store";
import { getHolidayMap, type Holiday } from "@/lib/holidays";
import { getCardBg, TYPE_ICONS } from "@/lib/card-helpers";
import { toYMD } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, CalendarDays, Calendar, CalendarRange, LayoutList, Rows3, CalendarClock } from "lucide-react";

type CalView = "monthly" | "weekly" | "daily" | "quarterly" | "yearly" | "list";

const VIEWS: { id: CalView; label: string; icon: typeof CalendarDays }[] = [
  { id: "monthly", label: "Month", icon: CalendarDays },
  { id: "weekly", label: "Week", icon: CalendarRange },
  { id: "daily", label: "Day", icon: Calendar },
  { id: "quarterly", label: "Quarter", icon: Rows3 },
  { id: "yearly", label: "Year", icon: CalendarClock },
  { id: "list", label: "List", icon: LayoutList },
];

function fmt(d: Date) { return toYMD(d); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getJulianDay(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthGrid(year: number, month: number, mondayStart: boolean): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  if (mondayStart) startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = getDaysInMonth(year, month);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function thingsForDate(things: Thing[], date: string) {
  return things.filter((t) => t.dueDate === date || t.eventDate === date);
}

const CAL_BG = "hsl(var(--card))";

interface CalProps {
  things: Thing[];
  onTapThing: (t: Thing) => void;
  onToggleComplete: (id: string) => void;
  onDailyDateChange?: (date: string | undefined) => void;
  onCreateAtTime?: (date: string, hour: number) => void;
  onHeaderSlotChange?: (slot: React.ReactNode) => void;
}

export default function CalendarView({ things, onTapThing, onToggleComplete, onDailyDateChange, onCreateAtTime, onHeaderSlotChange }: CalProps) {
  const { settings } = useSettings();
  const [view, setView] = useState<CalView>("monthly");
  const [current, setCurrent] = useState(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();
  const holidays = useMemo(() => getHolidayMap(year), [year]);
  const dayLetters = settings.weekStartMonday
    ? ["M", "T", "W", "T", "F", "S", "S"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  const nav = (dir: number) => {
    const d = new Date(current);
    if (view === "monthly") d.setMonth(d.getMonth() + dir);
    else if (view === "weekly") d.setDate(d.getDate() + dir * 7);
    else if (view === "daily") d.setDate(d.getDate() + dir);
    else if (view === "quarterly") d.setMonth(d.getMonth() + dir * 3);
    else if (view === "yearly") d.setFullYear(d.getFullYear() + dir);
    else d.setMonth(d.getMonth() + dir);
    setCurrent(d);
  };

  const goToDay = (d: Date) => { setCurrent(d); setView("daily"); };
  const goToWeek = (d: Date) => { setCurrent(d); setView("weekly"); };
  const goToMonth = (y: number, m: number) => { setCurrent(new Date(y, m, 1)); setView("monthly"); };
  const todayStr = fmt(new Date());

  useEffect(() => {
    if (view === "daily") {
      onDailyDateChange?.(fmt(current));
    } else {
      onDailyDateChange?.(undefined);
    }
  }, [view, current, onDailyDateChange]);

  useEffect(() => {
    onHeaderSlotChange?.(
      <div className="flex items-center gap-0.5">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          const active = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-label={v.label}
              title={v.label}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ background: active ? "#1a1e2e" : "transparent", color: active ? "#fff" : "#8a8f9c" }}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    );
    return () => onHeaderSlotChange?.(null);
  }, [view, onHeaderSlotChange]);

  return (
    <div className="flex h-full flex-col" style={{ background: CAL_BG }}>
      {/* Navigation header */}
      <div className="flex flex-shrink-0 items-center justify-between px-4 py-1.5">
        <button onClick={() => nav(-1)} className="p-1" style={{ color: "#1a1e2e" }}><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="text-sm font-black" style={{ color: "#1a1e2e" }}>
          {view === "yearly" ? year :
           view === "quarterly" ? `Q${Math.floor(month / 3) + 1} ${year}` :
           view === "daily" ? current.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) :
           current.toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
        </h2>
        <button onClick={() => nav(1)} className="p-1" style={{ color: "#1a1e2e" }}><ChevronRight className="h-5 w-5" /></button>
      </div>

      {/* Content area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-20">
        {view === "monthly" && <MonthlyView year={year} month={month} things={things} holidays={holidays} settings={settings} dayLetters={dayLetters} todayStr={todayStr} onTapThing={onTapThing} goToDay={goToDay} goToWeek={goToWeek} />}
        {view === "weekly" && <WeeklyView current={current} things={things} holidays={holidays} settings={settings} todayStr={todayStr} onTapThing={onTapThing} />}
        {view === "daily" && <DailyView current={current} things={things} holidays={holidays} settings={settings} todayStr={todayStr} onTapThing={onTapThing} onToggle={onToggleComplete} onCreateAtTime={onCreateAtTime} />}
        {view === "quarterly" && <QuarterlyView year={year} month={month} things={things} holidays={holidays} onTapThing={onTapThing} goToMonth={goToMonth} settings={settings} />}
        {view === "yearly" && <YearlyView year={year} things={things} />}
        {view === "list" && <ListView current={current} things={things} holidays={holidays} settings={settings} onTapThing={onTapThing} onToggle={onToggleComplete} />}
      </div>
    </div>
  );
}

/* ============ MONTHLY ============ */
function MonthlyView({ year, month, things, holidays, settings, dayLetters, todayStr, onTapThing, goToDay, goToWeek }: {
  year: number; month: number; things: Thing[]; holidays: Map<string, Holiday>;
  settings: { isoWeekNumbers: boolean; julianDayNumbers: boolean; weekStartMonday: boolean; showHolidays: boolean };
  dayLetters: string[]; todayStr: string; onTapThing: (t: Thing) => void;
  goToDay: (d: Date) => void; goToWeek: (d: Date) => void;
}) {
  const weeks = getMonthGrid(year, month, settings.weekStartMonday);
  const cols = settings.isoWeekNumbers ? "28px repeat(7, 1fr)" : "repeat(7, 1fr)";

  return (
    <div className="flex flex-1 flex-col" style={{ minHeight: 0 }}>
      {/* Day headers */}
      <div className="grid flex-shrink-0" style={{ gridTemplateColumns: cols, gap: 1 }}>
        {settings.isoWeekNumbers && <div />}
        {dayLetters.map((d, i) => (
          <div key={`${d}-${i}`} className="py-1 text-center text-[11px] font-black uppercase" style={{ color: "#666" }}>{d}</div>
        ))}
      </div>

      {/* Weeks grid - fills remaining vertical space */}
      <div className="grid flex-1" style={{ gridTemplateColumns: "1fr", gridTemplateRows: `repeat(${weeks.length}, 1fr)`, gap: 1 }}>
        {weeks.map((week, wi) => {
          const firstDayInWeek = week.find((d) => d !== null);
          const weekNum = firstDayInWeek ? getISOWeek(firstDayInWeek) : 0;
          return (
            <div key={wi} className="grid" style={{ gridTemplateColumns: cols, gap: 1 }}>
              {settings.isoWeekNumbers && (
                <button
                  onClick={() => firstDayInWeek && goToWeek(firstDayInWeek)}
                  className="flex items-center justify-center font-mono transition-colors hover:text-primary"
                  style={{ borderRadius: 0, fontSize: 11, fontWeight: 800, color: "#aaa" }}
                  title={`Week ${weekNum}`}
                >
                  {weekNum}
                </button>
              )}
              {week.map((day, di) => {
                if (!day) return <div key={di} style={{ background: "rgba(0,0,0,0.02)" }} />;
                const ds = fmt(day);
                const isToday = ds === todayStr;
                const holiday = settings.showHolidays ? holidays.get(ds) : undefined;
                const dayThings = thingsForDate(things, ds);
                const julianDay = settings.julianDayNumbers ? getJulianDay(day) : null;

                return (
                  <button
                    key={di}
                    onClick={() => goToDay(day)}
                    className="group relative flex flex-col overflow-hidden p-0.5 text-left transition-all active:scale-[0.97]"
                    style={{
                      borderRadius: 0,
                      background: isToday ? "#e8e8e6" : "#ffffff",
                      boxShadow: isToday
                        ? "inset 0 1px 4px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.08)"
                        : "0 1px 2px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 1px rgba(0,0,0,0.04)",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className="tabular-nums leading-none"
                        style={{ fontSize: 14, fontWeight: isToday ? 900 : 700, color: isToday ? "#e67e22" : "#1a1e2e" }}
                      >
                        {day.getDate()}
                      </span>
                      {julianDay !== null && (
                        <span className="font-mono leading-none tabular-nums" style={{ fontSize: 9, fontWeight: 700, color: "#bbb" }}>{julianDay}</span>
                      )}
                    </div>
                    {holiday && <span className="mt-px text-[9px] leading-none" title={holiday.name}>{holiday.emoji}</span>}
                    {dayThings.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-[2px] pt-px">
                        {dayThings.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="h-[5px] w-[5px] rounded-full"
                            style={{ background: getCardBg(t) === "#ffffff" ? "#999" : getCardBg(t) }}
                            title={t.title}
                            onClick={(e) => { e.stopPropagation(); onTapThing(t); }}
                          />
                        ))}
                        {dayThings.length > 3 && (
                          <span className="text-[7px] font-bold leading-none" style={{ color: "#999" }}>+{dayThings.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ WEEKLY ============ */
function WeeklyView({ current, things, holidays, settings, todayStr, onTapThing }: {
  current: Date; things: Thing[]; holidays: Map<string, Holiday>;
  settings: { showHolidays: boolean; weekStartMonday: boolean };
  todayStr: string; onTapThing: (t: Thing) => void;
}) {
  const dow = current.getDay();
  const startOffset = settings.weekStartMonday ? (dow === 0 ? -6 : 1 - dow) : -dow;
  const weekStart = addDays(current, startOffset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid flex-1 grid-cols-7 gap-px overflow-y-auto">
      {days.map((day) => {
        const ds = fmt(day);
        const isToday = ds === todayStr;
        const holiday = settings.showHolidays ? holidays.get(ds) : undefined;
        const dayThings = thingsForDate(things, ds);
        return (
          <div key={ds} className="flex flex-col" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="p-1 text-center" style={{ background: isToday ? "#e8e8e6" : "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="text-[10px] font-bold uppercase" style={{ color: "#888" }}>
                {day.toLocaleDateString("en-CA", { weekday: "short" })}
              </div>
              <div className="tabular-nums" style={{ fontSize: 16, fontWeight: isToday ? 900 : 700, color: isToday ? "#e67e22" : "#1a1e2e" }}>
                {day.getDate()}
              </div>
            </div>
            {holiday && (
              <div className="px-0.5 py-0.5 text-center" style={{ background: "#fef3c7" }}>
                <span className="text-[10px]">{holiday.emoji}</span>
                <p className="text-[7px] font-bold leading-tight" style={{ color: "#92400e" }}>{holiday.name}</p>
              </div>
            )}
            <div className="mt-1 flex flex-col gap-1 px-0.5">
              {dayThings.map((t) => {
                const Icon = TYPE_ICONS[t.type];
                return (
                  <button
                    key={t.id}
                    onClick={() => onTapThing(t)}
                    className="border p-1 text-left"
                    style={{ background: getCardBg(t), borderColor: "rgba(0,0,0,0.06)", borderRadius: 3 }}
                  >
                    <Icon className="h-2.5 w-2.5 opacity-50" />
                    <p className="mt-0.5 text-[8px] font-bold leading-tight" style={{ color: "#1a1e2e" }}>
                      {t.title.length > 12 ? `${t.title.slice(0, 12)}...` : t.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ DAILY ============ */
function DailyView({ current, things, holidays, settings, todayStr, onTapThing, onToggle, onCreateAtTime }: {
  current: Date; things: Thing[]; holidays: Map<string, Holiday>;
  settings: { showHolidays: boolean };
  todayStr: string; onTapThing: (t: Thing) => void; onToggle: (id: string) => void;
  onCreateAtTime?: (date: string, hour: number) => void;
}) {
  const ds = fmt(current);
  const holiday = settings.showHolidays ? holidays.get(ds) : undefined;
  const dayThings = thingsForDate(things, ds);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Pinch-to-zoom: hour height between 36px and 200px */
  const [hourHeight, setHourHeight] = useState(60);
  const pinchRef = useRef<{ startDist: number; startHeight: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { startDist: Math.hypot(dx, dy), startHeight: hourHeight };
    }
  }, [hourHeight]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / pinchRef.current.startDist;
      setHourHeight(Math.min(200, Math.max(36, Math.round(pinchRef.current.startHeight * scale))));
    }
  }, []);

  const handleTouchEnd = useCallback(() => { pinchRef.current = null; }, []);

  /* Also support scroll-wheel with ctrl/cmd for desktop */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setHourHeight((prev) => Math.min(200, Math.max(36, prev - Math.round(e.deltaY * 0.3))));
    }
  }, []);

  const topBarThings = dayThings.filter(
    (t) => t.type === "task" || t.type === "birthday" || t.type === "event"
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = hourHeight * 7;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hours = Array.from({ length: 24 }, (_, i) => i);

  /* Things placed in time slots (only events with a startTime) */
  const timedThings = useMemo(() => {
    const map = new Map<number, Thing[]>();
    for (const t of dayThings) {
      if (t.startTime) {
        const h = parseInt(t.startTime.split(":")[0], 10);
        if (!map.has(h)) map.set(h, []);
        map.get(h)!.push(t);
      }
    }
    return map;
  }, [dayThings]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Persistent top bar: all-day things, holidays, tasks due */}
      {(holiday || topBarThings.length > 0) && (
        <div className="flex-shrink-0 border-b pb-1.5 mb-1" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {holiday && (
            <div className="mb-1 rounded-md px-3 py-1.5" style={{ background: "#fef3c7" }}>
              <span className="text-sm">{holiday.emoji}</span>
              <span className="ml-2 text-xs font-bold" style={{ color: "#92400e" }}>{holiday.name}</span>
            </div>
          )}
          {topBarThings.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {topBarThings.map((t) => {
                const Icon = TYPE_ICONS[t.type];
                return (
                  <button
                    key={t.id}
                    onClick={() => onTapThing(t)}
                    className="flex items-center gap-1 rounded-md border px-2 py-1"
                    style={{ background: getCardBg(t), borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    {t.type === "task" && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); onToggle(t.id); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onToggle(t.id); } }}
                        className="flex h-3.5 w-3.5 items-center justify-center border"
                        style={{ borderColor: "rgba(0,0,0,0.2)", borderRadius: 2, background: t.completed ? "#c8f7c5" : "#fff" }}
                      >
                        {t.completed && <Check className="h-2.5 w-2.5" />}
                      </span>
                    )}
                    <Icon className="h-3 w-3 opacity-50" />
                    <span className="text-[10px] font-bold" style={{ color: "#1a1e2e" }}>{t.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Time schedule with pinch-to-zoom */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {hours.map((h) => {
          const hourThings = timedThings.get(h) || [];
          return (
            <div
              key={h}
              className="flex"
              style={{ height: hourHeight, borderBottom: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-11 flex-shrink-0 pt-1 pr-1.5 text-right font-mono"
                style={{ fontSize: 10, fontWeight: 700, color: "#aaa" }}
              >
                {h.toString().padStart(2, "0")}:00
              </div>
              <button
                className="relative flex-1 text-left"
                style={{ borderLeft: "1px solid rgba(0,0,0,0.06)", background: "#ffffff" }}
                onClick={() => onCreateAtTime?.(ds, h)}
                aria-label={`Create event at ${h}:00`}
              >
                {/* Timed things */}
                {hourThings.map((t) => {
                  const Icon = TYPE_ICONS[t.type];
                  return (
                    <div
                      key={t.id}
                      className="mx-1 my-0.5 flex items-center gap-1 rounded border px-1.5 py-0.5"
                      style={{ background: getCardBg(t), borderColor: "rgba(0,0,0,0.06)" }}
                      onClick={(e) => { e.stopPropagation(); onTapThing(t); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") onTapThing(t); }}
                    >
                      <Icon className="h-3 w-3 flex-shrink-0 opacity-50" />
                      <span className="text-[10px] font-bold" style={{ color: "#1a1e2e" }}>{t.title}</span>
                    </div>
                  );
                })}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ QUARTERLY ============ */
function QuarterlyView({ year, month, things, holidays, onTapThing, goToMonth, settings }: {
  year: number; month: number; things: Thing[]; holidays: Map<string, Holiday>;
  onTapThing: (t: Thing) => void; goToMonth: (year: number, month: number) => void;
  settings: { showHolidays: boolean; weekStartMonday: boolean };
}) {
  const qStart = Math.floor(month / 3) * 3;
  const months = [qStart, qStart + 1, qStart + 2];
  const todayStr = fmt(new Date());

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
      {months.map((m) => {
        const daysInMonth = getDaysInMonth(year, m);
        const firstDay = new Date(year, m, 1);
        let startDow = firstDay.getDay();
        if (settings.weekStartMonday) startDow = startDow === 0 ? 6 : startDow - 1;
        const dayLetters = settings.weekStartMonday ? ["M","T","W","T","F","S","S"] : ["S","M","T","W","T","F","S"];
        const cells: (number | null)[] = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <div key={m} className="rounded-md border p-3" style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.08)" }}>
            <button
              onClick={() => goToMonth(year, m)}
              className="mb-2 block w-full text-center font-black uppercase tracking-wider transition-colors hover:text-primary active:scale-[0.98]"
              style={{ fontSize: 14, color: "#1a1e2e" }}
            >
              {new Date(year, m, 1).toLocaleDateString("en-CA", { month: "long" })}
            </button>
            <div className="grid grid-cols-7 gap-px">
              {dayLetters.map((d, i) => (
                <div key={`h-${i}`} className="py-0.5 text-center text-[8px] font-black" style={{ color: "#888" }}>{d}</div>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const d = new Date(year, m, day);
                const ds = fmt(d);
                const count = thingsForDate(things, ds).length;
                const isToday = ds === todayStr;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center py-0.5 tabular-nums"
                    style={{
                      borderRadius: 0,
                      fontSize: 11,
                      fontWeight: isToday ? 900 : count > 0 ? 700 : 500,
                      background: isToday ? "#e67e22" : count > 0 ? "hsl(var(--primary) / 0.15)" : "#fff",
                      color: isToday ? "#fff" : "#1a1e2e",
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ YEARLY ============ */
function YearlyView({ year, things }: { year: number; things: Thing[] }) {
  const todayStr = fmt(new Date());
  return (
    <div className="grid flex-1 grid-cols-3 grid-rows-4 gap-2 overflow-hidden">
      {Array.from({ length: 12 }, (_, m) => {
        const daysInMonth = getDaysInMonth(year, m);
        return (
          <div key={m} className="flex flex-col overflow-hidden">
            <h4 className="mb-0.5 flex-shrink-0 text-center font-black uppercase" style={{ fontSize: 9, color: "#1a1e2e" }}>
              {new Date(year, m, 1).toLocaleDateString("en-CA", { month: "short" })}
            </h4>
            <div className="grid flex-1 grid-cols-7 content-start gap-px">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const ds = fmt(new Date(year, m, i + 1));
                const count = thingsForDate(things, ds).length;
                const isToday = ds === todayStr;
                const bg = count === 0 ? "#f0f0ef" : count === 1 ? "hsl(var(--primary) / 0.3)" : count === 2 ? "hsl(var(--primary) / 0.5)" : "hsl(var(--primary) / 0.8)";
                return (
                  <div
                    key={i}
                    className="aspect-square w-full"
                    style={{
                      borderRadius: 0, minHeight: 0,
                      background: bg,
                      outline: isToday ? "2px solid #e67e22" : "none",
                      outlineOffset: -1,
                    }}
                    title={`${ds}: ${count} things`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ LIST ============ */
function ListView({ current, things, holidays, settings, onTapThing, onToggle }: {
  current: Date; things: Thing[]; holidays: Map<string, Holiday>;
  settings: { showHolidays: boolean };
  onTapThing: (t: Thing) => void; onToggle: (id: string) => void;
}) {
  const start = new Date(current.getFullYear(), current.getMonth(), 1);
  const allDays = Array.from({ length: 60 }, (_, i) => addDays(start, i));
  const todayStr = fmt(new Date());

  const daysWithContent = allDays.filter((d) => {
    const ds = fmt(d);
    const hasHoliday = settings.showHolidays && holidays.has(ds);
    const hasThings = thingsForDate(things, ds).length > 0;
    return hasHoliday || hasThings;
  });

  return (
    <div className="flex-1 space-y-1 overflow-y-auto">
      {daysWithContent.map((day) => {
        const ds = fmt(day);
        const isToday = ds === todayStr;
        const holiday = settings.showHolidays ? holidays.get(ds) : undefined;
        const dayThings = thingsForDate(things, ds);

        return (
          <div key={ds} className="py-1.5">
            <div className="flex items-center gap-2" style={{ color: isToday ? "#e67e22" : "#888" }}>
              <span className="font-mono text-xs font-bold tabular-nums">
                {day.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              {isToday && <span className="rounded px-1 py-px text-[9px] font-black" style={{ background: "#e67e22", color: "#fff" }}>TODAY</span>}
              <div className="flex-1 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }} />
            </div>
            {holiday && (
              <p className="mt-0.5 text-xs" style={{ color: "#666" }}>
                {holiday.emoji} {holiday.name}
              </p>
            )}
            {dayThings.map((t) => {
              const Icon = TYPE_ICONS[t.type];
              return (
                <div key={t.id} className="mt-1 flex items-center gap-2 pl-2">
                  {t.type === "task" ? (
                    <button
                      onClick={() => onToggle(t.id)}
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center border"
                      style={{ borderColor: "rgba(0,0,0,0.2)", borderRadius: 2, background: t.completed ? "#c8f7c5" : "#fff" }}
                    >
                      {t.completed && <Check className="h-3 w-3" style={{ color: "#1a1e2e" }} />}
                    </button>
                  ) : (
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#aaa" }} />
                  )}
                  <button
                    onClick={() => onTapThing(t)}
                    className="text-left text-xs font-semibold"
                    style={{ color: t.completed ? "#aaa" : "#1a1e2e", textDecoration: t.completed ? "line-through" : "none" }}
                  >
                    {t.title}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
      {daysWithContent.length === 0 && (
        <p className="py-10 text-center text-sm" style={{ color: "#888" }}>No scheduled Things</p>
      )}
    </div>
  );
}
