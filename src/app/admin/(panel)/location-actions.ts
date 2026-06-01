"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listLocations } from "@/lib/locations";
import { LOCATION_COOKIE } from "@/lib/locationContext";

// Persist the admin's selected location in a cookie. Validated against the
// real location list so a bad value can't be injected.
export async function setLocation(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const locations = await listLocations(supabase);
  if (!locations.some((l) => l.id === id)) return;

  cookies().set(LOCATION_COOKIE, id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  // Re-render every admin view with the new location.
  revalidatePath("/admin", "layout");
}
