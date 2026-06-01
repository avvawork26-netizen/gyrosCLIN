import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Public: the clock-in screen's name list for one location. Returns id + name
// only — never pin, rate, or any other field. A location is required so a
// counter only ever sees its own staff.
export async function GET(req: Request) {
  const location = new URL(req.url).searchParams.get("location");
  if (!location) {
    return NextResponse.json({ error: "Location required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("employees")
    .select("id, name")
    .eq("is_active", true)
    .eq("location_id", location)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Unable to load staff" }, { status: 500 });
  }
  return NextResponse.json({ employees: data ?? [] });
}
