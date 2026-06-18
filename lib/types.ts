export type ThingType =
  | "task"
  | "note"
  | "event"
  | "reminder"
  | "list"
  | "bookmark"
  | "expense"
  | "subscription"
  | "birthday"
  | "password"
  | "movie"
  | "book"
  | "song";

export type RecurUnit = "day" | "week" | "month" | "year";

export interface Recurrence {
  every: number;        // e.g. every 2 weeks
  unit: RecurUnit;
  endDate?: string;     // optional stop date
}

export type Circle = "work" | "personal" | "home" | "health" | "family";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface ListItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Thing {
  id: string;
  title: string;
  type: ThingType;
  circle?: Circle;
  priority: Priority;
  pinned: boolean;
  completed: boolean;
  tags: string[];
  createdAt: string;
  dueDate?: string;
  eventDate?: string;
  startTime?: string;
  description?: string;
  // type-specific
  amount?: number;
  vendor?: string;
  url?: string;
  password?: string;
  username?: string;
  items?: ListItem[];
  recurring?: "daily" | "weekly" | "monthly" | "yearly"; // legacy
  recurrence?: Recurrence;
  birthdayPerson?: string;
  eisenhower?: "do" | "schedule" | "delegate" | "delete";
  // media + rich metadata
  coverImage?: string;   // poster / book cover / album art / bookmark thumbnail
  faviconUrl?: string;   // bookmark favicon
  creator?: string;      // director (movie), author (book), artist (song/album)
  year?: string;         // release year
  siteName?: string;     // bookmark site name
}
