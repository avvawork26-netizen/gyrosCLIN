"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { randomPin } from "@/lib/pin";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

function parseRate(raw: FormDataEntryValue | null): number | null {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export type CreateResult =
  | { ok: true; name: string; pin: string }
  | { ok: false; error: string };

// Create an employee with an auto-generated, globally unique PIN.
// Returns the PIN once so the admin can hand it off verbally.
export async function createEmployee(
  _prev: CreateResult | null,
  formData: FormData
): Promise<CreateResult> {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const rate = parseRate(formData.get("hourly_rate"));
  if (!name) return { ok: false, error: "Name is required" };
  if (rate === null) return { ok: false, error: "Enter a valid hourly rate" };

  // Insert with PIN retry to dodge the (rare) unique collision.
  for (let attempt = 0; attempt < 25; attempt++) {
    const pin = randomPin();
    const { error } = await supabase
      .from("employees")
      .insert({ name, hourly_rate: rate, pin, is_active: true });
    if (!error) {
      revalidatePath("/admin/employees");
      revalidatePath("/admin");
      return { ok: true, name, pin };
    }
    // 23505 = unique_violation (pin collision) — try another PIN.
    if (error.code !== "23505") {
      return { ok: false, error: "Could not create employee" };
    }
  }
  return { ok: false, error: "Could not allocate a unique PIN, try again" };
}

export async function updateEmployee(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const rate = parseRate(formData.get("hourly_rate"));
  if (!id || !name || rate === null) return;

  await supabase
    .from("employees")
    .update({ name, hourly_rate: rate })
    .eq("id", id);
  revalidatePath("/admin/employees");
  revalidatePath("/admin");
}

export async function setEmployeeActive(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  await supabase.from("employees").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/employees");
  revalidatePath("/admin");
}

// Clears a lockout immediately (admin override for the PIN screen).
export async function clearLockout(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase
    .from("employees")
    .update({ failed_attempts: 0, locked_until: null })
    .eq("id", id);
  revalidatePath("/admin/employees");
}
