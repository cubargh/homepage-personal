import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string or object into a string respecting the configured timezone.
 * @param date The date to format (Date object, timestamp, or ISO string)
 * @param formatStr The format string (date-fns syntax)
 * @param timeZone The IANA timezone string (e.g. "America/New_York")
 * @returns The formatted date string
 */
export function formatTime(date: Date | string | number, formatStr: string, timeZone: string = "UTC") {
  return formatInTimeZone(date, timeZone, formatStr);
}
