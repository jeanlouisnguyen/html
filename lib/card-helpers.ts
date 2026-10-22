import type { Thing, ThingType, Circle, Priority } from "./types";
import { toYMD } from "./utils";
import {
  CheckSquare,
  FileText,
  CalendarDays,
  Bell,
  ListChecks,
  Bookmark,
  DollarSign,
  CreditCard,
  Gift,
  Lock,
  Briefcase,
  User,
  Home,
  Heart,
  Users,
  Film,
  BookOpen,
  Disc3,
} from "lucide-react";

export const TYPE_ICONS: Record<ThingType, typeof CheckSquare> = {
  task: CheckSquare,
  note: FileText,
  event: CalendarDays,
  reminder: Bell,
  list: ListChecks,
  bookmark: Bookmark,
  expense: DollarSign,
  subscription: CreditCard,
  birthday: Gift,
  password: Lock,
  movie: Film,
  book: BookOpen,
  song: Disc3,
};

/* Types whose due date is mandatory */
export const DUE_DATE_REQUIRED: ThingType[] = ["reminder", "birthday", "subscription"];

/* Types that support a cover image fetched from a public source */
export const MEDIA_TYPES: ThingType[] = ["movie", "book", "song"];

/* Per-type labels for the three media-tracker statuses */
export const MEDIA_STATUS_LABELS: Record<
  "movie" | "book" | "song",
  { todo: string; active: string; done: string }
> = {
  movie: { todo: "Watchlist", active: "Watching", done: "Watched" },
  book: { todo: "To read", active: "Reading", done: "Read" },
  song: { todo: "To listen", active: "Listening", done: "Listened" },
};

export function mediaStatusLabel(type: ThingType, status: "todo" | "active" | "done"): string {
  const set = MEDIA_STATUS_LABELS[type as "movie" | "book" | "song"];
  return set ? set[status] : status;
}

export const CIRCLE_ICONS: Record<Circle, typeof Briefcase> = {
  work: Briefcase,
  personal: User,
  home: Home,
  health: Heart,
  family: Users,
};

/* ---- circle sticker colors (bg + shadow) ---- */
export const CIRCLE_STICKER_COLORS: Record<Circle, { bg: string; shadow: string }> = {
  work: { bg: "#3b82f6", shadow: "#1d4ed8" },
  personal: { bg: "#8b5cf6", shadow: "#6d28d9" },
  home: { bg: "#22c55e", shadow: "#15803d" },
  health: { bg: "#ef4444", shadow: "#b91c1c" },
  family: { bg: "#f97316", shadow: "#c2410c" },
};

/* ---- priority sticker config ---- */
export function getPrioritySticker(p: Priority | undefined): {
  bg: string;
  animated: boolean;
  show: boolean;
} {
  switch (p) {
    case "urgent":
      return { bg: "#ef4444", animated: true, show: true };
    case "high":
      return { bg: "#ef4444", animated: false, show: true };
    case "medium":
      return { bg: "#eab308", animated: false, show: true };
    case "low":
      return { bg: "#9ca3af", animated: false, show: true };
    default:
      return { bg: "transparent", animated: false, show: false };
  }
}

/* legacy dot helper still used in some views */
export function getPriorityDot(p: Priority | undefined): string {
  switch (p) {
    case "urgent": return "#ef4444";
    case "high": return "#f97316";
    case "medium": return "#eab308";
    case "low": return "#94a3b8";
    default: return "transparent";
  }
}

// Color logic: determine card background
export function getCardBg(thing: Thing): string {
  const today = new Date();
  const todayStr = toYMD(today);

  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const in7Str = toYMD(in7);

  // Completed tasks or past events -> green
  if (thing.type === "task" && thing.completed) return "#c8f7c5";
  if (thing.type === "event" && thing.eventDate && thing.eventDate < todayStr) return "#c8f7c5";

  // Due today -> red
  const relevantDate = thing.dueDate || thing.eventDate;
  if (relevantDate === todayStr) return "#ffcccc";

  // Due within 7 days -> orange
  if (relevantDate && relevantDate > todayStr && relevantDate <= in7Str) return "#ffe0b2";

  // Type defaults
  switch (thing.type) {
    case "note": return "#ffffff";
    case "event": return "#d4e8ff";
    case "task": return "#fff9c4";
    case "movie": return "#1a1a2e";
    case "book": return "#f3e8d8";
    case "song": return "#1c1c1c";
    default: return "#ffffff";
  }
}

export function getCardTextColor(bg: string): string {
  // Determine luminance for dark backgrounds (movie/song)
  const hex = bg.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum < 0.4) return "#f5f5f5";
  }
  return "#1a1e2e";
}
