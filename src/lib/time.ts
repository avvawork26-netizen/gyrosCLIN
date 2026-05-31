import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

// Single source of truth for the restaurant's wall-clock timezone.
// Everything is stored as timestamptz (UTC) in the DB and rendered here.
export const TZ = "America/New_York";

export function fmtTime(iso: string | Date): string {
  return formatInTimeZone(new Date(iso), TZ, "h:mm a");
}

export function fmtDate(iso: string | Date): string {
  return formatInTimeZone(new Date(iso), TZ, "EEE MMM d, yyyy");
}

export function fmtDateTime(iso: string | Date): string {
  return formatInTimeZone(new Date(iso), TZ, "EEE MMM d, h:mm a");
}

// YYYY-MM-DD for the given instant, in restaurant time.
export function tzDateKey(iso: string | Date): string {
  return formatInTimeZone(new Date(iso), TZ, "yyyy-MM-dd");
}

// "now" as a YYYY-MM-DD string in restaurant time.
export function todayKey(): string {
  return tzDateKey(new Date());
}

// Monday of the week containing dateKey (restaurant time), as YYYY-MM-DD.
export function weekStartKey(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Convert a restaurant-local date + "HH:mm" into a UTC ISO instant.
export function localToUtcIso(dateKey: string, hhmm: string): string {
  return fromZonedTime(`${dateKey} ${hhmm}:00`, TZ).toISOString();
}

// Extract "HH:mm" (restaurant time) from a stored instant.
export function utcToLocalHHMM(iso: string | Date): string {
  return formatInTimeZone(new Date(iso), TZ, "HH:mm");
}

// Hours between two instants, rounded to 2 decimals.
export function hoursBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round((ms / 3_600_000) * 100) / 100);
}

export function fmtHours(h: number): string {
  return h.toFixed(2);
}

// Label a plain YYYY-MM-DD (no timezone math — it's already a wall date).
export function fmtDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Format a "HH:mm" or "HH:mm:ss" wall time as "h:mm AM".
export function fmtClock(hhmmss: string): string {
  const [h, m] = hhmmss.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// For <input type="datetime-local">: stored instant -> "YYYY-MM-DDTHH:mm"
// expressed in restaurant wall time.
export function utcToLocalInput(iso: string | Date): string {
  return formatInTimeZone(new Date(iso), TZ, "yyyy-MM-dd'T'HH:mm");
}

// Inverse: a datetime-local value ("YYYY-MM-DDTHH:mm"), read as restaurant
// wall time, converted to a UTC ISO instant. Returns null if unparseable.
export function localInputToUtc(value: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(value.trim());
  if (!m) return null;
  return localToUtcIso(m[1], m[2]);
}

// Re-exported so callers needn't import date-fns-tz directly.
export { toZonedTime };
