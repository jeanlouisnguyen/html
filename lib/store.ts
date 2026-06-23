'use client';

import { useSyncExternalStore, useCallback } from "react";
import type { Thing } from "./types";
import { nextOccurrence } from "./recurrence";

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const SEED_THINGS: Thing[] = [
  {
    id: generateId(), title: "Quarterly report", type: "task", circle: "work",
    priority: "high", pinned: true, completed: false, tags: ["deadline"],
    createdAt: fmt(addDays(today, -5)), dueDate: fmt(today),
    description: "Prepare Q1 results for management review"
  },
  {
    id: generateId(), title: "Water the plants", type: "task", circle: "home",
    priority: "low", pinned: false, completed: false, tags: ["routine"],
    createdAt: fmt(addDays(today, -3)), dueDate: fmt(today),
    recurrence: { every: 3, unit: "day" },
    description: "Living room + balcony"
  },
  {
    id: generateId(), title: "Grocery list", type: "list", circle: "home",
    priority: "medium", pinned: false, completed: false, tags: ["shopping"],
    createdAt: fmt(addDays(today, -1)),
    items: [
      { id: "a", text: "Milk", checked: false },
      { id: "b", text: "Eggs", checked: true },
      { id: "c", text: "Bread", checked: false },
      { id: "d", text: "Avocados", checked: false },
    ]
  },
  {
    id: generateId(), title: "App design ideas", type: "note", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["creative"],
    createdAt: fmt(addDays(today, -3)),
    description: "Explore minimalist card layouts with pastel gradients. Consider motion design for transitions."
  },
  {
    id: generateId(), title: "Team standup", type: "event", circle: "work",
    priority: "medium", pinned: false, completed: false, tags: ["meeting"],
    createdAt: fmt(addDays(today, -7)), eventDate: fmt(addDays(today, 3)),
    description: "Daily sync with engineering team at 9:30 AM"
  },
  {
    id: generateId(), title: "Netflix", type: "subscription", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["entertainment"],
    createdAt: fmt(addDays(today, -30)), dueDate: fmt(addDays(today, 5)),
    amount: 22.99, vendor: "Netflix", recurring: "monthly"
  },
  {
    id: generateId(), title: "Rent payment", type: "expense", circle: "home",
    priority: "urgent", pinned: true, completed: false, tags: ["housing"],
    createdAt: fmt(addDays(today, -2)), dueDate: fmt(addDays(today, 1)),
    amount: 1850, vendor: "Landlord"
  },
  {
    id: generateId(), title: "Mom's birthday", type: "birthday", circle: "family",
    priority: "high", pinned: true, completed: false, tags: ["family"],
    createdAt: fmt(addDays(today, -60)), eventDate: fmt(addDays(today, 12)),
    birthdayPerson: "Mom"
  },
  {
    id: generateId(), title: "Take medication", type: "reminder", circle: "health",
    priority: "high", pinned: false, completed: false, tags: ["health"],
    createdAt: fmt(addDays(today, -10)), dueDate: fmt(today),
    recurring: "daily", description: "Blood pressure meds after breakfast"
  },
  {
    id: generateId(), title: "Design inspiration", type: "bookmark", circle: "work",
    priority: "low", pinned: false, completed: false, tags: ["design"],
    createdAt: fmt(addDays(today, -4)),
    url: "https://dribbble.com", description: "Great mobile patterns"
  },
  {
    id: generateId(), title: "AWS Console", type: "password", circle: "work",
    priority: "medium", pinned: false, completed: false, tags: ["dev"],
    createdAt: fmt(addDays(today, -20)),
    username: "admin@company.com", password: "s3cur3P@ss!"
  },
  {
    id: generateId(), title: "Dentist appointment", type: "event", circle: "health",
    priority: "medium", pinned: false, completed: true, tags: ["health"],
    createdAt: fmt(addDays(today, -14)), eventDate: fmt(addDays(today, -2)),
    description: "Cleaning and checkup at Dr. Smith"
  },
  {
    id: generateId(), title: "Buy birthday gift", type: "task", circle: "family",
    priority: "medium", pinned: false, completed: true, tags: ["shopping"],
    createdAt: fmt(addDays(today, -8)), dueDate: fmt(addDays(today, -1)),
    description: "Get a nice scarf for Mom"
  },
  // ---- Media library: movies ----
  {
    id: generateId(), title: "Nebula Drift", type: "movie", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["sci-fi"],
    createdAt: fmt(addDays(today, -12)),
    coverImage: "/media/movie-nebula.png", coverCached: true,
    creator: "Ava Marlowe", year: "2024", mediaStatus: "done", rating: 5,
  },
  {
    id: generateId(), title: "City Lights at Midnight", type: "movie", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["thriller"],
    createdAt: fmt(addDays(today, -6)),
    coverImage: "/media/movie-citylights.png", coverCached: true,
    creator: "Dario Fontaine", year: "2023", mediaStatus: "active", rating: 0,
  },
  {
    id: generateId(), title: "The Last Summit", type: "movie", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["adventure"],
    createdAt: fmt(addDays(today, -2)),
    coverImage: "/media/movie-summit.png", coverCached: true,
    creator: "Lena Brooks", year: "2025", mediaStatus: "todo", rating: 0,
  },
  // ---- Media library: books ----
  {
    id: generateId(), title: "The Tideglass House", type: "book", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["fiction"],
    createdAt: fmt(addDays(today, -15)),
    coverImage: "/media/book-tideglass.png", coverCached: true,
    creator: "Mara Sinclair", year: "2022", mediaStatus: "done", rating: 4,
  },
  {
    id: generateId(), title: "Ember Road", type: "book", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["fantasy"],
    createdAt: fmt(addDays(today, -9)),
    coverImage: "/media/book-emberroad.png", coverCached: true,
    creator: "J. T. Vance", year: "2021", mediaStatus: "active", rating: 0,
  },
  {
    id: generateId(), title: "The Quiet Mind", type: "book", circle: "health",
    priority: "low", pinned: false, completed: false, tags: ["wellness"],
    createdAt: fmt(addDays(today, -3)),
    coverImage: "/media/book-quietmind.png", coverCached: true,
    creator: "Dr. Helen Park", year: "2023", mediaStatus: "todo", rating: 0,
  },
  // ---- Media library: songs / albums ----
  {
    id: generateId(), title: "Midnight Radio", type: "song", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["synthwave"],
    createdAt: fmt(addDays(today, -11)),
    coverImage: "/media/album-midnightradio.png", coverCached: true,
    creator: "Neon Atlas", year: "2024", mediaStatus: "done", rating: 5,
  },
  {
    id: generateId(), title: "Golden Hour", type: "song", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["folk"],
    createdAt: fmt(addDays(today, -7)),
    coverImage: "/media/album-goldenhour.png", coverCached: true,
    creator: "River & Pine", year: "2023", mediaStatus: "active", rating: 0,
  },
  {
    id: generateId(), title: "Blue Note Sessions", type: "song", circle: "personal",
    priority: "low", pinned: false, completed: false, tags: ["jazz"],
    createdAt: fmt(addDays(today, -1)),
    coverImage: "/media/album-bluenote.png", coverCached: true,
    creator: "The Hank Mason Trio", year: "2022", mediaStatus: "todo", rating: 0,
  },
];

type Listener = () => void;
let things: Thing[] = [...SEED_THINGS];
let listeners: Set<Listener> = new Set();

function emit() {
  for (const l of listeners) l();
}

function getSnapshot() {
  return things;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThings() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addThing = useCallback((t: Omit<Thing, "id" | "createdAt">) => {
    things = [{ ...t, id: generateId(), createdAt: fmt(new Date()) }, ...things];
    emit();
  }, []);

  const updateThing = useCallback((id: string, updates: Partial<Thing>) => {
    things = things.map((t) => (t.id === id ? { ...t, ...updates } : t));
    emit();
  }, []);

  const deleteThing = useCallback((id: string) => {
    things = things.filter((t) => t.id !== id);
    emit();
  }, []);

  /**
   * Toggle a thing's completed state. When completing a recurring thing, the
   * current instance is marked done AND a fresh incomplete copy is spawned on
   * its next scheduled date — so finishing one occurrence rolls the schedule
   * forward automatically.
   */
  const toggleComplete = useCallback((id: string) => {
    const target = things.find((t) => t.id === id);
    if (!target) return;
    const nowCompleted = !target.completed;
    let result = things.map((t) => (t.id === id ? { ...t, completed: nowCompleted } : t));

    if (nowCompleted && target.recurrence) {
      const baseDate = target.dueDate || target.eventDate;
      if (baseDate) {
        const next = nextOccurrence(baseDate, target.recurrence);
        if (next) {
          const usesEvent = target.type === "event" || target.type === "birthday";
          const spawn: Thing = {
            ...target,
            id: generateId(),
            createdAt: fmt(new Date()),
            completed: false,
            ...(usesEvent ? { eventDate: next } : { dueDate: next }),
          };
          result = [spawn, ...result];
        }
      }
    }
    things = result;
    emit();
  }, []);

  const reorder = useCallback((fromIdx: number, toIdx: number) => {
    const arr = [...things];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    things = arr;
    emit();
  }, []);

  return { things: data, addThing, updateThing, deleteThing, toggleComplete, reorder };
}
