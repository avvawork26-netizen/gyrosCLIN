import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listLocations, type Location } from "./locations";

// The currently selected admin location persists in this cookie.
export const LOCATION_COOKIE = "mg_location";

// Resolve the selected location id from the cookie, validated against the real
// list. Falls back to Colonial, then the first location.
export function resolveSelectedLocationId(locations: Location[]): string | null {
  if (locations.length === 0) return null;
  const cookieId = cookies().get(LOCATION_COOKIE)?.value;
  if (cookieId && locations.some((l) => l.id === cookieId)) return cookieId;
  const colonial = locations.find((l) => l.slug === "colonial");
  return (colonial ?? locations[0]).id;
}

// Everything a page/layout needs to render and filter by location.
export async function getLocationContext(supabase: SupabaseClient): Promise<{
  locations: Location[];
  selectedId: string | null;
  selected: Location | null;
}> {
  const locations = await listLocations(supabase);
  const selectedId = resolveSelectedLocationId(locations);
  const selected = locations.find((l) => l.id === selectedId) ?? null;
  return { locations, selectedId, selected };
}

// For server actions that only need the selected id (e.g. creating an employee).
export async function getSelectedLocationId(
  supabase: SupabaseClient
): Promise<string | null> {
  const locations = await listLocations(supabase);
  return resolveSelectedLocationId(locations);
}
