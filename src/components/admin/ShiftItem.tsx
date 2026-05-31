"use client";

import { useState, useTransition } from "react";
import {
  updateShift,
  deleteShift,
} from "@/app/admin/(panel)/schedule/actions";
import { fmtClock } from "@/lib/time";

export type Shift = {
  id: string;
  employee_id: string;
  day_date: string;
  start_time: string;
  end_time: string;
  employeeName: string;
};

const hhmm = (t: string) => t.slice(0, 5);

export default function ShiftItem({
  shift,
  employees,
  weekDays,
}: {
  shift: Shift;
  employees: { id: string; name: string }[];
  weekDays: { key: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData) {
    setError(null);
    start(async () => {
      const res = await fn(fd);
      if (!res.ok) setError(res.error ?? "Error");
      else setEditing(false);
    });
  }

  if (editing) {
    return (
      <li className="border border-burnt p-2">
        <form action={(fd) => run(updateShift, fd)} className="space-y-2">
          <input type="hidden" name="id" value={shift.id} />
          <select
            name="employee_id"
            defaultValue={shift.employee_id}
            className="field py-2"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <select name="day_date" defaultValue={shift.day_date} className="field py-2">
            {weekDays.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              name="start_time"
              type="time"
              defaultValue={hhmm(shift.start_time)}
              className="field py-2"
              required
            />
            <input
              name="end_time"
              type="time"
              defaultValue={hhmm(shift.end_time)}
              className="field py-2"
              required
            />
          </div>
          {error && <div className="text-danger text-xs">{error}</div>}
          <div className="flex gap-2">
            <button disabled={pending} className="btn py-1 px-3 text-sm">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="btn btn-secondary py-1 px-3 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="border border-line p-2">
      <div className="font-semibold text-sm">{shift.employeeName}</div>
      <div className="text-muted text-sm">
        {fmtClock(shift.start_time)} – {fmtClock(shift.end_time)}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setEditing(true)}
          className="text-burnt text-xs uppercase tracking-wide"
        >
          Edit
        </button>
        <form action={(fd) => run(deleteShift, fd)}>
          <input type="hidden" name="id" value={shift.id} />
          <button className="text-danger text-xs uppercase tracking-wide">
            Delete
          </button>
        </form>
      </div>
      {error && <div className="text-danger text-xs mt-1">{error}</div>}
    </li>
  );
}
