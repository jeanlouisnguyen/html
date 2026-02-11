import type { Thing, ThingType, Circle, Priority } from "./types";
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
};

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
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().split("T")[0];

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
    default: return "#ffffff";
  }
}

export function getCardTextColor(_bg: string): string {
  return "#1a1e2e";
}
