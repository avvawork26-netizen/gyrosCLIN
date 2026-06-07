import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionData, PunchView, ScheduleView } from "./types";
import {
  todayKey,
  weekStartKey,
  addDaysKey,
  localToUtcIso,
  tzDateKey,
  hoursBetween,
} from "./time";

// Builds everything the public clock screen shows for one employee:
// current status, this week's schedule, and this week's hours.
// Uses the service-role client (RLS-bypassing) — server only.
export async function buildSession(
  admin: SupabaseClient,
  employee: { id: string; name: string }
): Promise<SessionData> {
  const today = todayKey();
  const weekStart = weekStartKey(today);
  const weekEnd = addDaysKey(weekStart, 7);
  const weekStartUtc = localToUtcIso(weekStart, "00:00");
  const weekEndUtc = localToUtcIso(weekEnd, "00:00");
  const todayStartUtc = localToUtcIso(today, "00:00");
  const todayEndUtc = localToUtcIso(addDaysKey(today, 1), "00:00");

  // This week's punches (by clock_in), newest first.
  const { data: weekPunches } = await admin
    .from("punches")
    .select("id, clock_in, clock_out, note")
    .eq("employee_id", employee.id)
    .gte("clock_in", weekStartUtc)
    .lt("clock_in", weekEndUtc)
    .order("clock_in", { ascending: false });

  // Any open punch (could have started before today, e.g. overnight).
  const { data: openPunches } = await admin
    .from("punches")
    .select("id, clock_in, clock_out, note, status")
    .eq("employee_id", employee.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1);

  const open = openPunches?.[0] ?? null;
  const nowIso = new Date().toISOString();

  // Week hours: completed punches + the open one accrued up to now.
  let weekHours = 0;
  for (const p of weekPunches ?? []) {
    if (p.clock_out) weekHours += hoursBetween(p.clock_in, p.clock_out);
    else weekHours += hoursBetween(p.clock_in, nowIso);
  }
  weekHours = Math.round(weekHours * 100) / 100;

  const todayPunches: PunchView[] = (weekPunches ?? []).filter(
    (p) => tzDateKey(p.clock_in) === today
  );

  const { data: scheduleRows } = await admin
    .from("schedules")
    .select("id, day_date, start_time, end_time")
    .eq("employee_id", employee.id)
    .gte("day_date", weekStart)
    .lt("day_date", weekEnd)
    .order("day_date", { ascending: true })
    .order("start_time", { ascending: true });

  const weekSchedule: ScheduleView[] = scheduleRows ?? [];

  return {
    employee: { id: employee.id, name: employee.name },
    status: open ? "in" : "out",
    onLunch: open?.status === "lunch",
    openSince: open?.clock_in ?? null,
    weekStart,
    weekHours,
    todayPunches,
    weekSchedule,
    hasScheduleForWeek: weekSchedule.length > 0,
  };
}
