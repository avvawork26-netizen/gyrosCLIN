import { createClient } from "@/lib/supabase/server";
import { getLocationContext } from "@/lib/locationContext";
import EmployeesClient, {
  type AdminEmployee,
} from "@/components/admin/EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const supabase = createClient();
  const { selectedId } = await getLocationContext(supabase);
  const { data } = await supabase
    .from("employees")
    .select("id, name, hourly_rate, is_active, locked_until")
    .eq("location_id", selectedId ?? "")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  return <EmployeesClient employees={(data ?? []) as AdminEmployee[]} />;
}
