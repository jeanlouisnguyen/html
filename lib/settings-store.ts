"use client";
import { useSyncExternalStore, useCallback } from "react";

/* ---- Custom Circle ---- */
export interface CustomCircle {
  id: string;
  label: string;
  icon: string; // lucide icon name e.g. "Briefcase"
  color: string; // hex
}

/* ---- Custom Priority ---- */
export interface CustomPriority {
  id: string;
  label: string;
  icon: string;
  color: string;
  rank: number; // lower = more important
  animated?: boolean;
}

/* ---- Category (expenses, income, passwords) ---- */
export interface Category {
  id: string;
  label: string;
  emoji: string;
  parentId?: string; // for sub-items
}

export interface AppSettings {
  isoWeekNumbers: boolean;
  julianDayNumbers: boolean;
  weekStartMonday: boolean;
  showHolidays: boolean;
  circles: CustomCircle[];
  priorities: CustomPriority[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  passwordCategories: Category[];
}

const DEFAULT_CIRCLES: CustomCircle[] = [
  { id: "work", label: "Work", icon: "Briefcase", color: "#3b82f6" },
  { id: "personal", label: "Personal", icon: "User", color: "#8b5cf6" },
  { id: "home", label: "Home", icon: "Home", color: "#22c55e" },
  { id: "health", label: "Health", icon: "Heart", color: "#ef4444" },
  { id: "family", label: "Family", icon: "Users", color: "#f97316" },
];

const DEFAULT_PRIORITIES: CustomPriority[] = [
  { id: "urgent", label: "Urgent", icon: "AlertTriangle", color: "#ef4444", rank: 0, animated: true },
  { id: "high", label: "High", icon: "ChevronUp", color: "#ef4444", rank: 1 },
  { id: "medium", label: "Medium", icon: "Minus", color: "#eab308", rank: 2 },
  { id: "low", label: "Low", icon: "ChevronDown", color: "#9ca3af", rank: 3 },
];

const DEFAULT_EXPENSE_CATS: Category[] = [
  { id: "housing", label: "Housing", emoji: "house" },
  { id: "rent", label: "Rent", emoji: "key", parentId: "housing" },
  { id: "mortgage", label: "Mortgage", emoji: "bank", parentId: "housing" },
  { id: "food", label: "Food & Dining", emoji: "utensils" },
  { id: "groceries", label: "Groceries", emoji: "apple", parentId: "food" },
  { id: "restaurants", label: "Restaurants", emoji: "coffee", parentId: "food" },
  { id: "transport", label: "Transport", emoji: "car" },
  { id: "utilities", label: "Utilities", emoji: "zap" },
  { id: "entertainment", label: "Entertainment", emoji: "film" },
  { id: "health-cat", label: "Health", emoji: "stethoscope" },
  { id: "other-exp", label: "Other", emoji: "package" },
];

const DEFAULT_INCOME_CATS: Category[] = [
  { id: "salary", label: "Salary", emoji: "banknote" },
  { id: "freelance", label: "Freelance", emoji: "laptop" },
  { id: "investments", label: "Investments", emoji: "trending-up" },
  { id: "dividends", label: "Dividends", emoji: "bar-chart", parentId: "investments" },
  { id: "other-inc", label: "Other", emoji: "plus-circle" },
];

const DEFAULT_PASSWORD_CATS: Category[] = [
  { id: "social", label: "Social Media", emoji: "share-2" },
  { id: "finance", label: "Finance", emoji: "landmark" },
  { id: "email", label: "Email", emoji: "mail" },
  { id: "work-pw", label: "Work", emoji: "building" },
  { id: "dev", label: "Development", emoji: "code" },
  { id: "other-pw", label: "Other", emoji: "key" },
];

const DEFAULT: AppSettings = {
  isoWeekNumbers: false,
  julianDayNumbers: false,
  weekStartMonday: true,
  showHolidays: true,
  circles: DEFAULT_CIRCLES,
  priorities: DEFAULT_PRIORITIES,
  expenseCategories: DEFAULT_EXPENSE_CATS,
  incomeCategories: DEFAULT_INCOME_CATS,
  passwordCategories: DEFAULT_PASSWORD_CATS,
};

type Listener = () => void;
let settings: AppSettings = { ...DEFAULT };
let listeners: Set<Listener> = new Set();

function emit() {
  for (const l of listeners) l();
}
function getSnapshot() {
  return settings;
}
function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSettings() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const update = useCallback((patch: Partial<AppSettings>) => {
    settings = { ...settings, ...patch };
    emit();
  }, []);
  return { settings: data, updateSettings: update };
}
