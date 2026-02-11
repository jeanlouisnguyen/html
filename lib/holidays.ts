// Canadian Federal + Quebec Provincial statutory holidays
// Fixed-date holidays and computed holidays for a given year

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  emoji: string;
  type: "federal" | "quebec" | "both";
}

function easterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function nthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  const first = new Date(year, month, 1);
  let day = first.getDay();
  let diff = dayOfWeek - day;
  if (diff < 0) diff += 7;
  const date = 1 + diff + (n - 1) * 7;
  return new Date(year, month, date);
}

function mondayBefore25May(year: number): Date {
  const may25 = new Date(year, 4, 25);
  const day = may25.getDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(year, 4, 25 - diff);
}

export function getHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  const goodFriday = addDays(easter, -2);
  const easterMonday = addDays(easter, 1);

  return [
    { date: `${year}-01-01`, name: "New Year's Day", emoji: "🎆", type: "both" },
    { date: fmt(goodFriday), name: "Good Friday", emoji: "✝️", type: "federal" },
    { date: fmt(easterMonday), name: "Easter Monday", emoji: "🐣", type: "both" },
    { date: fmt(mondayBefore25May(year)), name: "National Patriots' Day", emoji: "⚜️", type: "quebec" },
    { date: `${year}-06-24`, name: "Saint-Jean-Baptiste Day", emoji: "⚜️", type: "quebec" },
    { date: `${year}-07-01`, name: "Canada Day", emoji: "🍁", type: "federal" },
    { date: fmt(nthDayOfMonth(year, 8, 1, 1)), name: "Labour Day", emoji: "🔧", type: "both" },
    { date: `${year}-09-30`, name: "National Day for Truth and Reconciliation", emoji: "🧡", type: "federal" },
    { date: fmt(nthDayOfMonth(year, 9, 1, 2)), name: "Thanksgiving", emoji: "🦃", type: "both" },
    { date: `${year}-12-25`, name: "Christmas Day", emoji: "🎄", type: "both" },
  ];
}

export function getHolidayMap(year: number): Map<string, Holiday> {
  const map = new Map<string, Holiday>();
  for (const h of getHolidays(year)) {
    map.set(h.date, h);
  }
  return map;
}
