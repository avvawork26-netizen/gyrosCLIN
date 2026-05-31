import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Public: the clock-in screen's name list. Returns id + name only —
// never pin, rate, or any other field.
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("employees")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Unable to load staff" }, { status: 500 });
  }
  return NextResponse.json({ employees: data ?? [] });
}
