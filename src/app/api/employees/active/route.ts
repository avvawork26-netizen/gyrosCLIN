import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Never let a CDN/browser cache this list — staff appear/leave in real time.
const NO_STORE = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  "Netlify-CDN-Cache-Control": "no-store",
};

// Public: the clock-in screen's name list for one location. Returns id + name
// only — never pin, rate, or any other field. A location is required so a
// counter only ever sees its own staff.
export async function GET(req: Request) {
  const location = new URL(req.url).searchParams.get("location");
  if (!location) {
    return NextResponse.json(
      { error: "Location required" },
      { status: 400, headers: NO_STORE }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("employees")
    .select("id, name")
    .eq("is_active", true)
    .eq("location_id", location)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load staff" },
      { status: 500, headers: NO_STORE }
    );
  }
  return NextResponse.json({ employees: data ?? [] }, { headers: NO_STORE });
}
