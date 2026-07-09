import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Date as YYYY-MM-DD using LOCAL date parts.
 * Never use `toISOString().split("T")[0]` for calendar dates — it returns the
 * UTC day, which is off by one for users east of UTC late at night and shifts
 * local-midnight dates backward for all UTC+ timezones.
 */
export function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's date as YYYY-MM-DD in the user's local timezone. */
export function todayYMD(): string {
  return toYMD(new Date())
}
