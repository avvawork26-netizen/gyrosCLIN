"use client";

import { useState, useTransition } from "react";
import {
  updatePunch,
  closePunch,
  deletePunch,
} from "@/app/admin/(panel)/punches/actions";
import { fmtDateTime, utcToLocalInput, hoursBetween, fmtHours } from "@/lib/time";

export type PunchRowData = {
  id: string;
  clock_in: string;
  clock_out: string | null;
  note: string | null;
  employeeName: string;
};

export default function PunchRow({
  punch,
  flagged,
}: {
  punch: PunchRowData;
  flagged?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = punch.clock_out === null;
  const hours = open ? null : hoursBetween(punch.clock_in, punch.clock_out!);

  function run(fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData) {
    setError(null);
    start(async () => {
      const res = await fn(fd);
      if (!res.ok) setError(res.error ?? "Something went wrong");
      else setEditing(false);
    });
  }

  if (editing) {
    return (
      <li className="card border-burnt">
        <form
          action={(fd) => run(updatePunch, fd)}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={punch.id} />
          <div className="font-semibold">{punch.employeeName}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Clock in</label>
              <input
                name="clock_in"
                type="datetime-local"
                defaultValue={utcToLocalInput(punch.clock_in)}
                className="field"
                required
              />
            </div>
            <div>
              <label className="label">Clock out (blank = open)</label>
              <input
                name="clock_out"
                type="datetime-local"
                defaultValue={punch.clock_out ? utcToLocalInput(punch.clock_out) : ""}
                className="field"
              />
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <input
              name="note"
              defaultValue={punch.note ?? ""}
              className="field"
              placeholder="Optional"
            />
          </div>
          {error && <div className="text-danger text-sm">{error}</div>}
          <div className="flex gap-2">
            <button disabled={pending} className="btn py-2 px-4 text-base">
              {pending ? "..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="btn btn-secondary py-2 px-4 text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`card ${flagged ? "border-burnt" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{punch.employeeName}</div>
          <div className="text-sm">
            {fmtDateTime(punch.clock_in)}
            {" → "}
            {open ? (
              <span className="text-burnt font-semibold">OPEN</span>
            ) : (
              fmtDateTime(punch.clock_out!)
            )}
          </div>
          <div className="text-muted text-sm">
            {hours === null ? "in progress" : `${fmtHours(hours)} hrs`}
            {punch.note ? ` · ${punch.note}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {open && (
            <form action={(fd) => run(closePunch, fd)}>
              <input type="hidden" name="id" value={punch.id} />
              <button disabled={pending} className="btn py-2 px-3 text-sm">
                Close now
              </button>
            </form>
          )}
          <button
            onClick={() => setEditing(true)}
            className="btn btn-secondary py-2 px-3 text-sm"
          >
            Edit
          </button>
          <form
            action={(fd) => run(deletePunch, fd)}
            onSubmit={(e) => {
              if (!confirm("Delete this punch? This cannot be undone.")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={punch.id} />
            <button disabled={pending} className="btn btn-danger py-2 px-3 text-sm">
              Delete
            </button>
          </form>
        </div>
      </div>
      {error && <div className="text-danger text-sm mt-2">{error}</div>}
    </li>
  );
}
