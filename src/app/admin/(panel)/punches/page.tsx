import { createClient } from "@/lib/supabase/server";
import PunchRow, { type PunchRowData } from "@/components/admin/PunchRow";
import AddPunchForm from "@/components/admin/AddPunchForm";
import { todayKey, addDaysKey, localToUtcIso } from "@/lib/time";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  clock_in: string;
  clock_out: string | null;
  note: string | null;
  employee: { name: string } | null;
};

function toRowData(r: Row): PunchRowData {
  return {
    id: r.id,
    clock_in: r.clock_in,
    clock_out: r.clock_out,
    note: r.note,
    employeeName: r.employee?.name ?? "Unknown",
  };
}

export default async function PunchesPage({
  searchParams,
}: {
  searchParams: { employee_id?: string; from?: string; to?: string };
}) {
  const supabase = createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name")
    .order("name");
  const empList = employees ?? [];

  const today = todayKey();
  const from = searchParams.from || addDaysKey(today, -13);
  const to = searchParams.to || today;
  const employeeId = searchParams.employee_id || "";

  const fromUtc = localToUtcIso(from, "00:00");
  const toUtc = localToUtcIso(addDaysKey(to, 1), "00:00");

  // Open punches (always shown, regardless of range).
  let openQ = supabase
    .from("punches")
    .select("id, clock_in, clock_out, note, employee:employees(name)")
    .is("clock_out", null)
    .order("clock_in", { ascending: true });
  if (employeeId) openQ = openQ.eq("employee_id", employeeId);
  const { data: openData } = await openQ;
  const openRows = ((openData ?? []) as unknown as Row[]).map(toRowData);

  // Completed punches inside the selected range.
  let rangeQ = supabase
    .from("punches")
    .select("id, clock_in, clock_out, note, employee:employees(name)")
    .not("clock_out", "is", null)
    .gte("clock_in", fromUtc)
    .lt("clock_in", toUtc)
    .order("clock_in", { ascending: false });
  if (employeeId) rangeQ = rangeQ.eq("employee_id", employeeId);
  const { data: rangeData } = await rangeQ;
  const rangeRows = ((rangeData ?? []) as unknown as Row[]).map(toRowData);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Punches</h2>
        <AddPunchForm employees={empList} />
      </div>

      {/* Filter — plain GET form, no JS needed. */}
      <form
        method="get"
        className="panel grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end"
      >
        <div>
          <label className="label">Employee</label>
          <select name="employee_id" defaultValue={employeeId} className="field">
            <option value="">All</option>
            {empList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" name="from" defaultValue={from} className="field" />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" name="to" defaultValue={to} className="field" />
        </div>
        <button className="btn py-3 px-4 text-base">Apply</button>
      </form>

      <section>
        <h3 className="text-base font-bold text-burnt mb-3">
          Open punches ({openRows.length})
        </h3>
        {openRows.length === 0 ? (
          <p className="text-muted">No open punches.</p>
        ) : (
          <ul className="space-y-2">
            {openRows.map((p) => (
              <PunchRow key={p.id} punch={p} flagged />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-base font-bold mb-3">
          Completed {from} → {to} ({rangeRows.length})
        </h3>
        {rangeRows.length === 0 ? (
          <p className="text-muted">No completed punches in this range.</p>
        ) : (
          <ul className="space-y-2">
            {rangeRows.map((p) => (
              <PunchRow key={p.id} punch={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
