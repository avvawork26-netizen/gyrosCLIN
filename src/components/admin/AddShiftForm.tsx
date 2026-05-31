"use client";

import { useState, useTransition } from "react";
import { addShift } from "@/app/admin/(panel)/schedule/actions";

export default function AddShiftForm({
  employees,
  weekDays,
}: {
  employees: { id: string; name: string }[];
  weekDays: { key: string; label: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await addShift(fd);
      if (!res.ok) setError(res.error ?? "Could not add shift");
      else setFormKey((k) => k + 1);
    });
  }

  if (employees.length === 0) {
    return (
      <p className="text-muted">
        Add an active employee before creating shifts.
      </p>
    );
  }

  return (
    <form
      key={formKey}
      action={submit}
      className="panel grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-3 items-end"
    >
      <div>
        <label className="label">Employee</label>
        <select name="employee_id" className="field" required defaultValue="">
          <option value="" disabled>
            Select…
          </option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Day</label>
        <select name="day_date" className="field" required defaultValue={weekDays[0].key}>
          {weekDays.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Start</label>
        <input name="start_time" type="time" className="field" required />
      </div>
      <div>
        <label className="label">End</label>
        <input name="end_time" type="time" className="field" required />
      </div>
      <button disabled={pending} className="btn py-3 px-4 text-base">
        {pending ? "..." : "Add shift"}
      </button>
      {error && (
        <div className="text-danger text-sm sm:col-span-5">{error}</div>
      )}
    </form>
  );
}
