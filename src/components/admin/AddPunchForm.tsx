"use client";

import { useState, useTransition } from "react";
import { addPunch } from "@/app/admin/(panel)/punches/actions";

export default function AddPunchForm({
  employees,
}: {
  employees: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await addPunch(fd);
      if (!res.ok) setError(res.error ?? "Could not add punch");
      else {
        setFormKey((k) => k + 1);
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn btn-secondary py-2 px-4 text-base"
      >
        Add punch manually
      </button>
    );
  }

  return (
    <div className="panel">
      <h3 className="font-bold mb-3">Add punch</h3>
      <form key={formKey} action={submit} className="space-y-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Clock in</label>
            <input name="clock_in" type="datetime-local" className="field" required />
          </div>
          <div>
            <label className="label">Clock out (optional)</label>
            <input name="clock_out" type="datetime-local" className="field" />
          </div>
        </div>
        <div>
          <label className="label">Note</label>
          <input name="note" className="field" placeholder="Optional" />
        </div>
        {error && <div className="text-danger text-sm">{error}</div>}
        <div className="flex gap-2">
          <button disabled={pending} className="btn py-2 px-4 text-base">
            {pending ? "..." : "Save punch"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            className="btn btn-secondary py-2 px-4 text-base"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
