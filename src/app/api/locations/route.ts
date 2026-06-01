import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Public: the locations shown on the clock-in screen's first step.
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("locations")
    .select("id, name, slug")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load locations" },
      { status: 500 }
    );
  }
  return NextResponse.json({ locations: data ?? [] });
}
