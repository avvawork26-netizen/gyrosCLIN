import { createClient } from "@/lib/supabase/server";
import { getLocationContext } from "@/lib/locationContext";
import {
  todayKey,
  weekStartKey,
  addDaysKey,
  localToUtcIso,
  tzDateKey,
  hoursBetween,
  fmtHours,
  fmtDayLabel,
} from "@/lib/time";

export const dynamic = "force-dynamic";

const OVERTIME_THRESHOLD = 40;

type Row = {
  clock_in: string;
  clock_out: string | null;
  employee: {
    id: string;
    name: string;
    hourly_rate: number;
    is_active: boolean;
  } | null;
};

type Agg = {
  id: string;
  name: string;
  rate: number;
  active: boolean;
  totalHours: number;
  openCount: number;
  weekHours: Map<string, number>;
};

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const supabase = createClient();
  const { selectedId } = await getLocationContext(supabase);

  const today = todayKey();
  // Default range: the current week so far.
  const from = searchParams.from || weekStartKey(today);
  const to = searchParams.to || today;
  const fromUtc = localToUtcIso(from, "00:00");
  const toUtc = localToUtcIso(addDaysKey(to, 1), "00:00");

  const { data } = await supabase
    .from("punches")
    .select(
      "clock_in, clock_out, employee:employees(id, name, hourly_rate, is_active)"
    )
    .eq("location_id", selectedId ?? "")
    .gte("clock_in", fromUtc)
    .lt("clock_in", toUtc)
    .order("clock_in", { ascending: true });

  const rows = (data ?? []) as unknown as Row[];
  const nowIso = new Date().toISOString();

  const byEmp = new Map<string, Agg>();
  for (const r of rows) {
    if (!r.employee) continue;
    const e = r.employee;
    let agg = byEmp.get(e.id);
    if (!agg) {
      agg = {
        id: e.id,
        name: e.name,
        rate: Number(e.hourly_rate),
        active: e.is_active,
        totalHours: 0,
        openCount: 0,
        weekHours: new Map(),
      };
      byEmp.set(e.id, agg);
    }
    const hrs = r.clock_out
      ? hoursBetween(r.clock_in, r.clock_out)
      : hoursBetween(r.clock_in, nowIso);
    agg.totalHours += hrs;
    if (!r.clock_out) agg.openCount += 1;
    const wk = weekStartKey(tzDateKey(r.clock_in));
    agg.weekHours.set(wk, (agg.weekHours.get(wk) ?? 0) + hrs);
  }

  const aggs = Array.from(byEmp.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  let totalHours = 0;
  let totalCost = 0;
  for (const a of aggs) {
    a.totalHours = Math.round(a.totalHours * 100) / 100;
    totalHours += a.totalHours;
    totalCost += a.totalHours * a.rate;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Reports</h2>

      <form
        method="get"
        className="panel grid grid-cols-1 sm:grid-cols-[auto_auto_auto] gap-3 items-end"
      >
        <div>
          <label className="label">From</label>
          <input type="date" name="from" defaultValue={from} className="field" />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" name="to" defaultValue={to} className="field" />
        </div>
        <button className="btn py-3 px-4 text-base">Run report</button>
      </form>

      {aggs.length === 0 ? (
        <div className="panel">
          <p className="text-muted">
            No punches recorded between {from} and {to}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="card">
              <div className="label">Range</div>
              <div className="text-sm">
                {fmtDayLabel(from)} – {fmtDayLabel(to)}
              </div>
            </div>
            <div className="card">
              <div className="label">Total hours</div>
              <div className="text-2xl font-bold text-burnt">
                {fmtHours(totalHours)}
              </div>
            </div>
            <div className="card">
              <div className="label">Est. labor cost</div>
              <div className="text-2xl font-bold text-burnt">
                {money(totalCost)}
              </div>
            </div>
          </div>

          <ul className="space-y-2">
            {aggs.map((a) => {
              const overtimeWeeks = Array.from(a.weekHours.entries())
                .filter(([, h]) => h > OVERTIME_THRESHOLD)
                .sort((x, y) => x[0].localeCompare(y[0]));
              const cost = a.totalHours * a.rate;
              return (
                <li key={a.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {a.name}
                        {!a.active && (
                          <span className="tag border-muted text-muted ml-2">
                            Inactive
                          </span>
                        )}
                        {overtimeWeeks.length > 0 && (
                          <span className="tag border-danger text-danger ml-2">
                            Overtime
                          </span>
                        )}
                      </div>
                      <div className="text-muted text-sm">
                        {money(a.rate)}/hr
                        {a.openCount > 0 &&
                          ` · ${a.openCount} open punch${
                            a.openCount === 1 ? "" : "es"
                          } (counted to now)`}
                      </div>
                      {overtimeWeeks.length > 0 && (
                        <div className="text-danger text-sm mt-1">
                          {overtimeWeeks.map(([wk, h]) => (
                            <div key={wk}>
                              Week of {fmtDayLabel(wk)}: {fmtHours(h)} hrs
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {fmtHours(a.totalHours)}
                        <span className="text-muted text-sm font-normal"> hrs</span>
                      </div>
                      <div className="text-burnt font-semibold">
                        {money(cost)}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="text-muted text-xs">
            Overtime flags weeks (Mon–Sun) over {OVERTIME_THRESHOLD} hours, based
            on punches inside the selected range. Times shown in America/New_York.
          </p>
        </>
      )}
    </div>
  );
}
