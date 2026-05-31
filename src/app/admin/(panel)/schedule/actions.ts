"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

export type ActionResult = { ok: boolean; error?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function validate(
  day: string,
  start: string,
  end: string
): string | null {
  if (!DATE_RE.test(day)) return "Invalid date";
  if (!TIME_RE.test(start) || !TIME_RE.test(end)) return "Invalid time";
  if (end <= start) return "End time must be after start time";
  return null;
}

export async function addShift(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const employeeId = String(formData.get("employee_id") ?? "");
  const day = String(formData.get("day_date") ?? "");
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  if (!employeeId) return { ok: false, error: "Pick an employee" };
  const bad = validate(day, start, end);
  if (bad) return { ok: false, error: bad };

  const { error } = await supabase.from("schedules").insert({
    employee_id: employeeId,
    day_date: day,
    start_time: start,
    end_time: end,
  });
  if (error) return { ok: false, error: "Could not add shift" };
  revalidatePath("/admin/schedule");
  return { ok: true };
}

export async function updateShift(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const employeeId = String(formData.get("employee_id") ?? "");
  const day = String(formData.get("day_date") ?? "");
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  if (!id) return { ok: false, error: "Missing shift" };
  if (!employeeId) return { ok: false, error: "Pick an employee" };
  const bad = validate(day, start, end);
  if (bad) return { ok: false, error: bad };

  const { error } = await supabase
    .from("schedules")
    .update({
      employee_id: employeeId,
      day_date: day,
      start_time: start,
      end_time: end,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not save shift" };
  revalidatePath("/admin/schedule");
  return { ok: true };
}

export async function deleteShift(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing shift" };
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete shift" };
  revalidatePath("/admin/schedule");
  return { ok: true };
}
