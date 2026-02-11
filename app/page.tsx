"use client";

import { useState, useCallback } from "react";
import { useThings } from "@/lib/store";
import type { Thing, ThingType } from "@/lib/types";
import LoadingScreen from "@/components/loading-screen";
import AppShell, { type Tab } from "@/components/app-shell";
import BoardView from "@/components/board-view";
import CalendarView from "@/components/calendar-view";
import ThingEditView from "@/components/thing-edit-view";
import CreateThingSheet from "@/components/create-thing-sheet";
import SettingsView from "@/components/settings-view";
import { Plus } from "lucide-react"; // Import Plus component

/* Map active tab to default Thing type */
function tabToDefaultType(tab: Tab): ThingType {
  switch (tab) {
    case "calendar": return "event";
    case "tasks": return "task";
    case "notes": return "note";
    case "budget": return "expense";
    case "reminders": return "reminder";
    default: return "task";
  }
}

export default function Page() {
  const { things, addThing, updateThing, deleteThing } = useThings();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("board");
  const [editingThing, setEditingThing] = useState<Thing | null>(null);
  const [creating, setCreating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /* Track the date the user was viewing in calendar daily view */
  const [calendarDailyDate, setCalendarDailyDate] = useState<string | undefined>();
  const [createStartTime, setCreateStartTime] = useState<string | undefined>();
  const [createPrefillDate, setCreatePrefillDate] = useState<string | undefined>();

  const handleLoadDone = useCallback(() => setLoading(false), []);

  const tasks = things.filter((t) => t.type === "task");
  const notes = things.filter((t) => t.type === "note");
  const budgetTypes = things.filter((t) => t.type === "expense" || t.type === "subscription");
  const reminders = things.filter((t) => t.type === "reminder");

  const handleTap = (thing: Thing) => setEditingThing(thing);
  const handleAdd = () => {
    setCreateStartTime(undefined);
    setCreatePrefillDate(undefined);
    setCreating(true);
  };
  const handleCreateAtTime = (date: string, hour: number) => {
    setCreatePrefillDate(date);
    setCreateStartTime(`${hour.toString().padStart(2, "0")}:00`);
    setCreating(true);
  };
  const handleToggle = (id: string) => {
    const t = things.find((x) => x.id === id);
    if (t) updateThing(id, { completed: !t.completed });
  };

  if (loading) {
    return <LoadingScreen onDone={handleLoadDone} />;
  }

  const defaultType = createStartTime ? "event" as ThingType : tabToDefaultType(tab);
  const prefillDate = createPrefillDate || (tab === "calendar" ? calendarDailyDate : undefined);

  return (
    <>
      <AppShell activeTab={tab} onTabChange={setTab} onSettingsOpen={() => setSettingsOpen(true)}>
        {tab === "board" && (
          <BoardView things={things} onTap={handleTap} onAdd={handleAdd} />
        )}
        {tab === "calendar" && (
          <CalendarView
            things={things}
            onTapThing={handleTap}
            onToggleComplete={handleToggle}
            onDailyDateChange={setCalendarDailyDate}
            onCreateAtTime={handleCreateAtTime}
          />
        )}
        {tab === "tasks" && (
          <BoardView things={tasks} onTap={handleTap} onAdd={handleAdd} />
        )}
        {tab === "notes" && (
          <BoardView things={notes} onTap={handleTap} onAdd={handleAdd} />
        )}
        {tab === "budget" && (
          <BoardView things={budgetTypes} onTap={handleTap} onAdd={handleAdd} />
        )}
        {tab === "reminders" && (
          <BoardView things={reminders} onTap={handleTap} onAdd={handleAdd} />
        )}

        {/* Global FAB -- visible on Calendar tab (BoardView has its own) */}
        {tab === "calendar" && (
          <button
            onClick={handleAdd}
            className="fixed bottom-20 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
            style={{ background: "#1a1e2e", color: "#fff" }}
            aria-label="Add Thing"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        )}
      </AppShell>

      {editingThing && (
        <ThingEditView
          thing={editingThing}
          onSave={(updates) => updateThing(editingThing.id, updates)}
          onDelete={() => { deleteThing(editingThing.id); setEditingThing(null); }}
          onClose={() => setEditingThing(null)}
        />
      )}

      {creating && (
        <CreateThingSheet
          onSave={addThing}
          onClose={() => { setCreating(false); setCreateStartTime(undefined); setCreatePrefillDate(undefined); }}
          defaultType={defaultType}
          prefillDate={prefillDate}
          prefillStartTime={createStartTime}
        />
      )}

      {settingsOpen && (
        <SettingsView onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
