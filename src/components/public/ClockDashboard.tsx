"use client";

import { useEffect, useState } from "react";
import type { SessionData } from "@/lib/types";
import {
  fmtTime,
  fmtDayLabel,
  fmtClock,
  fmtHours,
  todayKey,
} from "@/lib/time";

// Post-PIN view: status, clock button, week schedule, week hours.
export default function ClockDashboard({
  session,
  onPunch,
  onDone,
  busy,
  error,
}: {
  session: SessionData;
  onPunch: (action: "in" | "out") => void;
  onDone: () => void;
  busy: boolean;
  error: string | null;
}) {
  const clockedIn = session.status === "in";
  const today = todayKey();

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{session.employee.name}</h2>
        <button
          onClick={onDone}
          className="text-burnt text-sm uppercase tracking-wide"
        >
          Done
        </button>
      </div>

      <LiveClock />

      <div className="panel mb-4">
        <div className="flex items-center justify-between">
          <span className="text-muted uppercase text-sm tracking-wide">
            Status
          </span>
          <span
            className={`tag ${
              clockedIn ? "border-ok text-ok" : "border-muted text-muted"
            }`}
          >
            {clockedIn ? "Clocked in" : "Clocked out"}
          </span>
        </div>
        {clockedIn && session.openSince && (
          <p className="mt-2 text-sm text-muted">
            Since {fmtTime(session.openSince)}
          </p>
        )}
      </div>

      {error && (
        <div className="border border-danger text-danger px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {clockedIn ? (
        <button
          onClick={() => onPunch("out")}
          disabled={busy}
          className="btn btn-block btn-danger text-2xl py-7 mb-4"
        >
          {busy ? "..." : "Clock out"}
        </button>
      ) : (
        <button
          onClick={() => onPunch("in")}
          disabled={busy}
          className="btn btn-block text-2xl py-7 mb-4"
        >
          {busy ? "..." : "Clock in"}
        </button>
      )}

      <div className="panel mb-4">
        <div className="flex items-center justify-between">
          <span className="text-muted uppercase text-sm tracking-wide">
            This week
          </span>
          <span className="text-2xl font-bold text-burnt">
            {fmtHours(session.weekHours)} hrs
          </span>
        </div>
      </div>

      <div className="card mb-4">
        <h3 className="text-sm uppercase tracking-wide text-muted mb-2">
          Today&apos;s punches
        </h3>
        {session.todayPunches.length === 0 ? (
          <p className="text-muted text-sm">No punches today yet.</p>
        ) : (
          <ul className="space-y-1">
            {session.todayPunches.map((p) => (
              <li key={p.id} className="text-sm">
                {fmtTime(p.clock_in)} &ndash;{" "}
                {p.clock_out ? fmtTime(p.clock_out) : "open"}
                {p.note ? (
                  <span className="text-muted"> &middot; {p.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm uppercase tracking-wide text-muted mb-2">
          Your week schedule
        </h3>
        {!session.hasScheduleForWeek ? (
          <p className="text-muted text-sm">No schedule posted yet.</p>
        ) : (
          <ul className="space-y-1">
            {session.weekSchedule.map((s) => (
              <li
                key={s.id}
                className={`text-sm flex justify-between ${
                  s.day_date === today ? "text-bone" : "text-muted"
                }`}
              >
                <span>{fmtDayLabel(s.day_date)}</span>
                <span>
                  {fmtClock(s.start_time)} &ndash; {fmtClock(s.end_time)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="text-center text-muted mb-4" suppressHydrationWarning>
      {fmtTime(now)}
    </p>
  );
}
