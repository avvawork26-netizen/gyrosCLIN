"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { localInputToUtc } from "@/lib/time";
import { getEmployeeLocationId } from "@/lib/locations";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

function revalidate() {
  revalidatePath("/admin/punches");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
}

export type ActionResult = { ok: boolean; error?: string };

// Edit a punch: clock_in (required), clock_out (blank = still open), note.
export async function updatePunch(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const clockInRaw = String(formData.get("clock_in") ?? "");
  const clockOutRaw = String(formData.get("clock_out") ?? "").trim();
  const noteRaw = String(formData.get("note") ?? "").trim();
  if (!id) return { ok: false, error: "Missing punch" };

  const clockIn = localInputToUtc(clockInRaw);
  if (!clockIn) return { ok: false, error: "Invalid clock-in time" };

  let clockOut: string | null = null;
  if (clockOutRaw) {
    clockOut = localInputToUtc(clockOutRaw);
    if (!clockOut) return { ok: false, error: "Invalid clock-out time" };
    if (new Date(clockOut) < new Date(clockIn)) {
      return { ok: false, error: "Clock-out cannot be before clock-in" };
    }
  }

  const { error } = await supabase
    .from("punches")
    .update({
      clock_in: clockIn,
      clock_out: clockOut,
      note: noteRaw || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not save punch" };
  revalidate();
  return { ok: true };
}

// Manually close a missed punch at the given time (defaults to now).
export async function closePunch(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const atRaw = String(formData.get("clock_out") ?? "").trim();
  if (!id) return { ok: false, error: "Missing punch" };

  const clockOut = atRaw ? localInputToUtc(atRaw) : new Date().toISOString();
  if (!clockOut) return { ok: false, error: "Invalid time" };

  // Guard the >= constraint so we can return a clean message.
  const { data: row } = await supabase
    .from("punches")
    .select("clock_in")
    .eq("id", id)
    .maybeSingle();
  if (row && new Date(clockOut) < new Date(row.clock_in)) {
    return { ok: false, error: "Clock-out cannot be before clock-in" };
  }

  const { error } = await supabase
    .from("punches")
    .update({ clock_out: clockOut })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not close punch" };
  revalidate();
  return { ok: true };
}

// Add a punch manually (corrections / forgotten clock-ins).
export async function addPunch(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const employeeId = String(formData.get("employee_id") ?? "");
  const clockInRaw = String(formData.get("clock_in") ?? "");
  const clockOutRaw = String(formData.get("clock_out") ?? "").trim();
  const noteRaw = String(formData.get("note") ?? "").trim();
  if (!employeeId) return { ok: false, error: "Pick an employee" };

  const clockIn = localInputToUtc(clockInRaw);
  if (!clockIn) return { ok: false, error: "Invalid clock-in time" };

  let clockOut: string | null = null;
  if (clockOutRaw) {
    clockOut = localInputToUtc(clockOutRaw);
    if (!clockOut) return { ok: false, error: "Invalid clock-out time" };
    if (new Date(clockOut) < new Date(clockIn)) {
      return { ok: false, error: "Clock-out cannot be before clock-in" };
    }
  }

  // A punch belongs to the employee's location.
  const locationId = await getEmployeeLocationId(supabase, employeeId);
  if (!locationId) return { ok: false, error: "Employee has no location" };

  const { error } = await supabase.from("punches").insert({
    employee_id: employeeId,
    location_id: locationId,
    clock_in: clockIn,
    clock_out: clockOut,
    note: noteRaw || null,
  });
  if (error) return { ok: false, error: "Could not add punch" };
  revalidate();
  return { ok: true };
}

export async function deletePunch(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing punch" };
  const { error } = await supabase.from("punches").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete punch" };
  revalidate();
  return { ok: true };
}
