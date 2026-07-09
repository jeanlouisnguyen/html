"use client";

import { useState, useCallback, type ReactNode } from "react";
import { useThings } from "@/lib/store";
import type { Thing, ThingType } from "@/lib/types";
import LoadingScreen from "@/components/loading-screen";
import AppShell, { type Tab } from "@/components/app-shell";
import BoardView from "@/components/board-view";
import CalendarView from "@/components/calendar-view";
import LibraryView from "@/components/library-view";
import StickyNoteEditor, { type OriginRect } from "@/components/sticky-note-editor";
import SettingsView from "@/components/settings-view";
import RemindersPanel from "@/components/reminders-panel";
import FabMenu from "@/components/fab-menu";

/* Map active tab to default Thing type */
function tabToDefaultType(tab: Tab): ThingType {
  switch (tab) {
    case "calendar": return "event";
    case "tasks": return "task";
    case "notes": return "note";
    case "budget": return "expense";
    default: return "task";
  }
}

export default function Page() {
  const { things, addThing, updateThing, deleteThing, toggleComplete } = useThings();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("board");
  const [editingThing, setEditingThing] = useState<Thing | null>(null);
  const [creating, setCreating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [calendarDailyDate, setCalendarDailyDate] = useState<string | undefined>();
  const [createStartTime, setCreateStartTime] = useState<string | undefined>();
  const [createPrefillDate, setCreatePrefillDate] = useState<string | undefined>();
  const [forcedType, setForcedType] = useState<ThingType | undefined>();
  const [originRect, setOriginRect] = useState<OriginRect | null>(null);
  const [headerSlot, setHeaderSlot] = useState<ReactNode>(null);

  const handleLoadDone = useCallback(() => setLoading(false), []);

  const tasks = things.filter((t) => t.type === "task");
  const notes = things.filter((t) => t.type === "note");
  const budgetTypes = things.filter((t) => t.type === "expense" || t.type === "subscription");

  const handleTap = (thing: Thing, rect?: OriginRect) => {
    setOriginRect(rect ?? null);
    setEditingThing(thing);
  };
  const handleAdd = (rect?: OriginRect) => {
    setOriginRect(rect ?? null);
    setCreateStartTime(undefined);
    setCreatePrefillDate(undefined);
    setForcedType(undefined);
    setCreating(true);
  };
  const handleAddType = (t: ThingType, rect?: OriginRect) => {
    setOriginRect(rect ?? null);
    setCreateStartTime(undefined);
    setCreatePrefillDate(undefined);
    setForcedType(t);
    setCreating(true);
  };
  const handleCreateAtTime = (date: string, hour: number) => {
    setOriginRect(null);
    setCreatePrefillDate(date);
    setCreateStartTime(`${hour.toString().padStart(2, "0")}:00`);
    setForcedType(undefined);
    setCreating(true);
  };
  const handleToggle = (id: string) => toggleComplete(id);

  const handleTabChange = useCallback((t: Tab) => {
    setTab(t);
    if (t === "calendar" || t === "library") setHeaderSlot(null);
  }, []);

  if (loading) {
    return <LoadingScreen onDone={handleLoadDone} />;
  }

  const defaultType = forcedType || (createStartTime ? ("event" as ThingType) : tabToDefaultType(tab));
  const prefillDate = createPrefillDate || (tab === "calendar" ? calendarDailyDate : undefined);

  return (
    <>
      <AppShell activeTab={tab} onTabChange={handleTabChange} onSettingsOpen={() => setSettingsOpen(true)} onRemindersOpen={() => setRemindersOpen(true)} headerSlot={headerSlot}>
        {tab === "board" && (
          <BoardView things={things} onTap={handleTap} onAdd={handleAdd} onAddType={handleAddType} onHeaderSlotChange={setHeaderSlot} />
        )}
        {tab === "calendar" && (
          <CalendarView
            things={things}
            onTapThing={handleTap}
            onToggleComplete={handleToggle}
            onDailyDateChange={setCalendarDailyDate}
            onCreateAtTime={handleCreateAtTime}
            onHeaderSlotChange={setHeaderSlot}
          />
        )}
        {tab === "tasks" && (
          <BoardView things={tasks} onTap={handleTap} onAdd={handleAdd} onAddType={handleAddType} onHeaderSlotChange={setHeaderSlot} />
        )}
        {tab === "notes" && (
          <BoardView things={notes} onTap={handleTap} onAdd={handleAdd} onAddType={handleAddType} onHeaderSlotChange={setHeaderSlot} />
        )}
        {tab === "budget" && (
          <BoardView things={budgetTypes} onTap={handleTap} onAdd={handleAdd} onAddType={handleAddType} onHeaderSlotChange={setHeaderSlot} />
        )}
        {tab === "library" && (
          <LibraryView things={things} onTap={handleTap} onAddType={handleAddType} onHeaderSlotChange={setHeaderSlot} />
        )}

        {/* Global FAB -- visible on Calendar + Library tabs (BoardView has its own) */}
        {(tab === "calendar" || tab === "library") && (
          <FabMenu onQuickAdd={handleAdd} onSelectType={handleAddType} />
        )}
      </AppShell>

      {editingThing && (
        <StickyNoteEditor
          mode="edit"
          initial={editingThing}
          originRect={originRect}
          onUpdate={(updates) => updateThing(editingThing.id, updates)}
          onToggleComplete={() => toggleComplete(editingThing.id)}
          onDelete={() => { deleteThing(editingThing.id); setEditingThing(null); setOriginRect(null); }}
          onClose={() => { setEditingThing(null); setOriginRect(null); }}
        />
      )}

      {creating && (
        <StickyNoteEditor
          mode="create"
          initial={{
            type: defaultType,
            dueDate: defaultType === "event" || defaultType === "birthday" ? undefined : prefillDate,
            eventDate: defaultType === "event" || defaultType === "birthday" ? prefillDate : undefined,
            startTime: createStartTime,
          }}
          originRect={originRect}
          onCreate={addThing}
          onClose={() => { setCreating(false); setCreateStartTime(undefined); setCreatePrefillDate(undefined); setForcedType(undefined); setOriginRect(null); }}
        />
      )}

      {settingsOpen && (
        <SettingsView onClose={() => setSettingsOpen(false)} />
      )}

      <RemindersPanel
        open={remindersOpen}
        things={things}
        onClose={() => setRemindersOpen(false)}
        onTapThing={(t, rect) => { setRemindersOpen(false); handleTap(t, rect); }}
      />
    </>
  );
}
