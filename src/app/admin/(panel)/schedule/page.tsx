import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocationContext } from "@/lib/locationContext";
import AddShiftForm from "@/components/admin/AddShiftForm";
import ShiftItem, { type Shift } from "@/components/admin/ShiftItem";
import { todayKey, weekStartKey, addDaysKey, fmtDayLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  employee_id: string;
  day_date: string;
  start_time: string;
  end_time: string;
  employee: { name: string } | null;
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const supabase = createClient();
  const { selectedId } = await getLocationContext(supabase);
  const locId = selectedId ?? "";

  const weekStart = searchParams.week
    ? weekStartKey(searchParams.week)
    : weekStartKey(todayKey());
  const weekEnd = addDaysKey(weekStart, 7);
  const prevWeek = addDaysKey(weekStart, -7);
  const nextWeek = addDaysKey(weekStart, 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const key = addDaysKey(weekStart, i);
    return { key, label: fmtDayLabel(key) };
  });

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name")
    .eq("is_active", true)
    .eq("location_id", locId)
    .order("name");
  const empList = employees ?? [];

  const { data } = await supabase
    .from("schedules")
    .select("id, employee_id, day_date, start_time, end_time, employee:employees(name)")
    .eq("location_id", locId)
    .gte("day_date", weekStart)
    .lt("day_date", weekEnd)
    .order("start_time", { ascending: true });

  const shifts: Shift[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    employee_id: r.employee_id,
    day_date: r.day_date,
    start_time: r.start_time,
    end_time: r.end_time,
    employeeName: r.employee?.name ?? "Unknown",
  }));

  const today = todayKey();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Schedule</h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/schedule?week=${prevWeek}`}
            className="btn btn-secondary py-2 px-3 text-sm"
          >
            ‹ Prev
          </Link>
          <Link
            href="/admin/schedule"
            className="btn btn-secondary py-2 px-3 text-sm"
          >
            This week
          </Link>
          <Link
            href={`/admin/schedule?week=${nextWeek}`}
            className="btn btn-secondary py-2 px-3 text-sm"
          >
            Next ›
          </Link>
        </div>
      </div>

      <p className="text-muted text-sm">
        Week of {fmtDayLabel(weekStart)} – {fmtDayLabel(addDaysKey(weekStart, 6))}
      </p>

      <AddShiftForm employees={empList} weekDays={weekDays} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {weekDays.map((d) => {
          const dayShifts = shifts.filter((s) => s.day_date === d.key);
          return (
            <div
              key={d.key}
              className={`panel ${d.key === today ? "border-burnt" : ""}`}
            >
              <h3 className="font-bold text-sm mb-2">
                {d.label}
                {d.key === today && (
                  <span className="text-burnt text-xs ml-2">Today</span>
                )}
              </h3>
              {dayShifts.length === 0 ? (
                <p className="text-muted text-xs">No shifts</p>
              ) : (
                <ul className="space-y-2">
                  {dayShifts.map((s) => (
                    <ShiftItem
                      key={s.id}
                      shift={s}
                      employees={empList}
                      weekDays={weekDays}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
