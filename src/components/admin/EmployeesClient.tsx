"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import {
  createEmployee,
  updateEmployee,
  setEmployeeActive,
  deleteEmployee,
  clearLockout,
  type CreateResult,
} from "@/app/admin/(panel)/employees/actions";

export type AdminEmployee = {
  id: string;
  name: string;
  hourly_rate: number;
  is_active: boolean;
  locked_until: string | null;
};

function SubmitBtn({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn py-2 px-4 text-base">
      {pending ? "..." : children}
    </button>
  );
}

export default function EmployeesClient({
  employees,
  locationName,
}: {
  employees: AdminEmployee[];
  locationName: string;
}) {
  const active = employees.filter((e) => e.is_active);
  const inactive = employees.filter((e) => !e.is_active);

  return (
    <div className="space-y-8">
      <AddEmployee locationName={locationName} />

      <section>
        <h2 className="text-lg font-bold mb-3">Active staff ({active.length})</h2>
        {active.length === 0 ? (
          <p className="text-muted">No active employees.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((e) => (
              <EmployeeRow key={e.id} emp={e} />
            ))}
          </ul>
        )}
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3 text-muted">
            Deactivated ({inactive.length})
          </h2>
          <ul className="space-y-2">
            {inactive.map((e) => (
              <EmployeeRow key={e.id} emp={e} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function AddEmployee({ locationName }: { locationName: string }) {
  const [state, action] = useFormState<CreateResult | null, FormData>(
    createEmployee,
    null
  );
  const [revealed, setRevealed] = useState<{ name: string; pin: string } | null>(
    null
  );

  // Surface a freshly created PIN once, then let the admin dismiss it.
  useEffect(() => {
    if (state?.ok) setRevealed({ name: state.name, pin: state.pin });
  }, [state]);

  return (
    <section className="panel">
      <h2 className="text-lg font-bold mb-1">Add employee</h2>
      <p className="text-sm text-muted mb-3">
        Will be added to{" "}
        <span className="text-burnt font-semibold">{locationName}</span> — switch
        location in the header to add elsewhere.
      </p>

      {revealed && (
        <div className="border border-burnt bg-oxblood2 p-4 mb-4">
          <p className="text-sm text-muted uppercase tracking-wide mb-1">
            PIN for {revealed.name} — added to {locationName} — shown once
          </p>
          <p className="text-4xl font-bold tracking-widest text-burnt mb-2">
            {revealed.pin}
          </p>
          <p className="text-sm text-muted mb-3">
            Write it down or tell {revealed.name} now. It will not be shown
            again.
          </p>
          <button
            onClick={() => setRevealed(null)}
            className="btn btn-secondary py-2 px-4 text-base"
          >
            Got it
          </button>
        </div>
      )}

      {state && !state.ok && (
        <div className="border border-danger text-danger px-3 py-2 mb-4">
          {state.error}
        </div>
      )}

      <form
        action={action}
        key={revealed ? "reset" : "form"}
        className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end"
      >
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input id="name" name="name" className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="hourly_rate">
            Hourly rate
          </label>
          <input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            className="field w-32"
            required
          />
        </div>
        <SubmitBtn>Add</SubmitBtn>
      </form>
    </section>
  );
}

function EmployeeRow({ emp }: { emp: AdminEmployee }) {
  const [editing, setEditing] = useState(false);
  const locked =
    !!emp.locked_until && new Date(emp.locked_until).getTime() > Date.now();

  if (editing) {
    return (
      <li className="card">
        <form
          action={async (fd) => {
            await updateEmployee(fd);
            setEditing(false);
          }}
          className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end"
        >
          <input type="hidden" name="id" value={emp.id} />
          <div>
            <label className="label">Name</label>
            <input name="name" defaultValue={emp.name} className="field" required />
          </div>
          <div>
            <label className="label">Hourly rate</label>
            <input
              name="hourly_rate"
              type="number"
              step="0.01"
              min="0"
              defaultValue={emp.hourly_rate}
              className="field w-32"
              required
            />
          </div>
          <SubmitBtn>Save</SubmitBtn>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn btn-secondary py-2 px-4 text-base"
          >
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="font-semibold">
          {emp.name}
          {locked && (
            <span className="tag border-danger text-danger ml-2">Locked</span>
          )}
        </div>
        <div className="text-muted text-sm">
          ${emp.hourly_rate.toFixed(2)}/hr
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEditing(true)}
          className="btn btn-secondary py-2 px-3 text-sm"
        >
          Edit
        </button>
        {locked && (
          <form action={clearLockout}>
            <input type="hidden" name="id" value={emp.id} />
            <button className="btn btn-secondary py-2 px-3 text-sm">
              Clear lockout
            </button>
          </form>
        )}
        <form action={setEmployeeActive}>
          <input type="hidden" name="id" value={emp.id} />
          <input
            type="hidden"
            name="active"
            value={emp.is_active ? "false" : "true"}
          />
          <button
            className={`btn py-2 px-3 text-sm ${
              emp.is_active ? "btn-danger" : ""
            }`}
          >
            {emp.is_active ? "Deactivate" : "Reactivate"}
          </button>
        </form>
        {!emp.is_active && (
          <form
            action={deleteEmployee}
            onSubmit={(e) => {
              if (
                !confirm(
                  `Permanently delete ${emp.name}? This also removes all of their punch and schedule history. This cannot be undone.`
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={emp.id} />
            <button className="btn btn-danger py-2 px-3 text-sm">Delete</button>
          </form>
        )}
      </div>
    </li>
  );
}
