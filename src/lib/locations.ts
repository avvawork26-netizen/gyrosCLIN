import type { SupabaseClient } from "@supabase/supabase-js";

export type Location = { id: string; name: string; slug: string };

// All locations, ordered for display (Colonial first by creation order).
export async function listLocations(
  supabase: SupabaseClient
): Promise<Location[]> {
  const { data } = await supabase
    .from("locations")
    .select("id, name, slug")
    .order("created_at", { ascending: true });
  return data ?? [];
}

// The fallback location when none is selected: Colonial, else the first one.
export async function getDefaultLocationId(
  supabase: SupabaseClient
): Promise<string | null> {
  const locations = await listLocations(supabase);
  if (locations.length === 0) return null;
  const colonial = locations.find((l) => l.slug === "colonial");
  return (colonial ?? locations[0]).id;
}

// The location an employee belongs to (used to stamp their punches/shifts).
export async function getEmployeeLocationId(
  supabase: SupabaseClient,
  employeeId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("employees")
    .select("location_id")
    .eq("id", employeeId)
    .maybeSingle();
  return data?.location_id ?? null;
}
