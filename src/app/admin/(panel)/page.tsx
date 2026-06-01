import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocationContext } from "@/lib/locationContext";
import { fmtTime, fmtDateTime, todayKey, tzDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

type OpenRow = {
  id: string;
  clock_in: string;
  employee: { name: string } | null;
};

export default async function Dashboard() {
  const supabase = createClient();
  const { selectedId } = await getLocationContext(supabase);
  const { data } = await supabase
    .from("punches")
    .select("id, clock_in, employee:employees(name)")
    .eq("location_id", selectedId ?? "")
    .is("clock_out", null)
    .order("clock_in", { ascending: true });

  const rows = (data ?? []) as unknown as OpenRow[];
  const today = todayKey();
  const onClock = rows.filter((r) => tzDateKey(r.clock_in) === today);
  const flagged = rows.filter((r) => tzDateKey(r.clock_in) !== today);

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Currently clocked in</h2>
          <span className="text-muted text-sm">{onClock.length}</span>
        </div>
        {onClock.length === 0 ? (
          <p className="text-muted">No one is clocked in right now.</p>
        ) : (
          <ul className="space-y-2">
            {onClock.map((r) => (
              <li
                key={r.id}
                className="card flex items-center justify-between"
              >
                <span className="font-semibold">
                  {r.employee?.name ?? "Unknown"}
                </span>
                <span className="text-muted text-sm">
                  since {fmtTime(r.clock_in)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-burnt">
            Flagged open punches
          </h2>
          <span className="text-muted text-sm">{flagged.length}</span>
        </div>
        <p className="text-muted text-sm mb-3">
          Punches still open from a prior day — likely a missed clock-out.
        </p>
        {flagged.length === 0 ? (
          <p className="text-muted">None. All prior punches are closed.</p>
        ) : (
          <ul className="space-y-2">
            {flagged.map((r) => (
              <li
                key={r.id}
                className="card border-burnt flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {r.employee?.name ?? "Unknown"}
                  </div>
                  <div className="text-muted text-sm">
                    in {fmtDateTime(r.clock_in)}, never clocked out
                  </div>
                </div>
                <Link href="/admin/punches" className="btn btn-secondary py-2 px-3 text-sm">
                  Resolve
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
