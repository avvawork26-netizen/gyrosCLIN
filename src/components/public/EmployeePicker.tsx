"use client";

import type { PublicEmployee } from "@/lib/types";

// Grid of large name buttons. The whole list is public (active staff only).
export default function EmployeePicker({
  employees,
  loading,
  error,
  onPick,
}: {
  employees: PublicEmployee[];
  loading: boolean;
  error: string | null;
  onPick: (e: PublicEmployee) => void;
}) {
  if (loading) {
    return <p className="text-muted">Loading staff...</p>;
  }
  if (error) {
    return (
      <div className="border border-danger text-danger px-3 py-2">{error}</div>
    );
  }
  if (employees.length === 0) {
    return (
      <p className="text-muted">
        No active staff yet. An admin needs to add employees.
      </p>
    );
  }
  return (
    <div>
      <p className="text-muted mb-3">Tap your name to clock in or out</p>
      <div className="grid grid-cols-2 gap-3">
        {employees.map((e) => (
          <button
            key={e.id}
            onClick={() => onPick(e)}
            className="btn bg-oxblood2 border border-line py-6 text-lg active:bg-oxblood text-left"
          >
            {e.name}
          </button>
        ))}
      </div>
    </div>
  );
}
