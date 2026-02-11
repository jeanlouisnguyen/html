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
  | "password";

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
  recurring?: "daily" | "weekly" | "monthly" | "yearly";
  birthdayPerson?: string;
  eisenhower?: "do" | "schedule" | "delegate" | "delete";
}
